"""
Predictor utility module for Food Recognition and Calorie Estimation.

Handles:
- Safe discovery and loading of the trained Keras model and class names JSON
- Loading of the nutrition regression model with its scaler
- Thread-safe singleton loading (ensures models and scaler load only once per process)
- Memory-optimized model loading (compile=False to omit optimizer overhead)
- Startup warmup to eliminate cold inference JIT compilation delays
- Image validation, conversion to RGB, and 224x224 resizing
- NumPy array preparation with batch dimension (1, 224, 224, 3) and float32 type
- EfficientNetB0-compatible preprocessing (preserves [0, 255] raw pixel values)
- Separate timing measurement for classification and nutrition inference
- Reused preprocessed tensor across both models to avoid duplicate image decoding
"""

import io
import json
import logging
import os
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
from PIL import Image, UnidentifiedImageError

logger = logging.getLogger("food_recognition.predictor")


def find_project_file(filename: str) -> Optional[Path]:
    """
    Search for a file in common relative locations:
    1. Current working directory
    2. backend directory
    3. Project root (parent of backend)
    4. models/ subdirectories
    """
    current_file_dir = Path(__file__).resolve().parent  # /backend
    project_root = current_file_dir.parent             # root directory

    search_candidates = [
        current_file_dir / filename,
        project_root / filename,
        Path.cwd() / filename,
        current_file_dir / "models" / filename,
        project_root / "models" / filename,
        Path.cwd() / "backend" / filename,
        Path.cwd() / "backend" / "models" / filename,
        project_root / "backend" / "models" / filename,
    ]

    for candidate in search_candidates:
        if candidate.exists() and candidate.is_file():
            return candidate.resolve()

    return None


class FoodClassifier:
    """
    Manages the trained combined Indian and international food classification
    EfficientNetB0 model and prediction pipeline.
    """

    def __init__(self):
        self.model: Optional[Any] = None
        self.class_names: List[str] = []
        self.model_path: Optional[Path] = None
        self.classes_path: Optional[Path] = None
        self.is_loaded: bool = False
        self._lock = threading.Lock()

    def load(
        self,
        model_filename: str = "food_recognition_efficientnet.keras",
        class_names_filename: str = "class_names.json",
    ) -> None:
        """
        Safely loads the class names mapping and Keras model into memory.
        Ensures models are loaded ONLY ONCE per process with compile=False
        to minimize memory usage, followed by a graph warmup.
        """
        if self.is_loaded and self.model is not None:
            logger.info("FoodClassifier already loaded in process; skipping reload.")
            return

        with self._lock:
            if self.is_loaded and self.model is not None:
                return

            logger.info("Initializing FoodClassifier resource loading...")

            # 1. Locate and load class names
            classes_path = find_project_file(class_names_filename)
            if not classes_path:
                raise FileNotFoundError(
                    f"Class names file '{class_names_filename}' not found. "
                    f"Please ensure it exists in the project root or backend folder."
                )

            logger.info("Loading class names from: %s", classes_path)
            with open(classes_path, "r", encoding="utf-8") as f:
                self.class_names = json.load(f)

            self.classes_path = classes_path
            total_classes = len(self.class_names)
            logger.info("Successfully loaded %d food classes from %s.", total_classes, classes_path.name)

            # 2. Locate and load Keras model
            model_path = find_project_file(model_filename)
            if not model_path:
                raise FileNotFoundError(
                    f"Trained model file '{model_filename}' not found. "
                    f"Please ensure it exists in the project root or backend folder."
                )

            logger.info("Loading trained Keras model from: %s (compile=False for inference)", model_path)

            try:
                import keras
                load_model_fn = keras.models.load_model
            except (ImportError, AttributeError):
                import tensorflow as tf
                load_model_fn = tf.keras.models.load_model

            # Load model with compile=False to avoid loading optimizer weights into RAM
            self.model = load_model_fn(str(model_path), compile=False)
            self.model_path = model_path

            # 3. Verify output units alignment with class names
            output_classes = self.model.output_shape[-1]
            if output_classes != total_classes:
                logger.warning(
                    "Model output dimension (%d) does not match total class names (%d)! "
                    "Prediction indices may be misaligned.",
                    output_classes,
                    total_classes,
                )
            else:
                logger.info(
                    "Model output layer (%d units) perfectly aligns with %d class names.",
                    output_classes,
                    total_classes,
                )

            # 4. Perform one-time warmup to compile internal execution graph
            self._warmup()
            self.is_loaded = True
            logger.info("FoodClassifier loaded and warmed up successfully.")

    def _warmup(self) -> None:
        """Runs a synthetic inference to trigger XLA/graph compilation during startup."""
        try:
            logger.info("Warming up FoodClassifier graph...")
            dummy_input = np.zeros((1, 224, 224, 3), dtype=np.float32)
            _ = self._infer(dummy_input)
            logger.info("FoodClassifier graph warmed up successfully.")
        except Exception as exc:
            logger.warning("FoodClassifier warmup note: %s", exc)

    def _infer(self, input_tensor: np.ndarray) -> np.ndarray:
        """
        Fast direct callable evaluation for batch_size=1 inference.
        Avoids the dataset construction and teardown overhead of model.predict().
        """
        try:
            raw = self.model(input_tensor, training=False)
            if hasattr(raw, "numpy"):
                return raw.numpy()
            return np.asarray(raw)
        except Exception:
            return self.model.predict(input_tensor, verbose=0)

    @staticmethod
    def preprocess_image(
        image_bytes: bytes,
        target_size: Tuple[int, int] = (224, 224),
    ) -> Tuple[np.ndarray, Tuple[int, int]]:
        """
        Validates and prepares an uploaded image for the EfficientNetB0 model:
        1. Opens image bytes with PIL (validating file integrity)
        2. Converts to standard 3-channel RGB (handles RGBA, Grayscale, CMYK)
        3. Resizes to (224, 224) using bilinear interpolation
        4. Converts to float32 NumPy array with shape (1, 224, 224, 3)
        5. Preserves [0, 255] raw pixel values as expected by EfficientNetB0 internal rescaling.

        Returns:
            Tuple of (preprocessed_batch_tensor, original_image_dimensions)
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
        except (UnidentifiedImageError, OSError) as e:
            raise ValueError(f"Uploaded file is not a valid or readable image: {str(e)}") from e

        original_size = image.size  # (width, height)

        if image.mode != "RGB":
            image = image.convert("RGB")

        resized_image = image.resize(target_size, Image.Resampling.BILINEAR)
        img_array = np.array(resized_image, dtype=np.float32)
        img_batch = np.expand_dims(img_array, axis=0)

        return img_batch, original_size

    def predict(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Runs food classification and nutrition estimation on input image bytes.
        Measures classifier and nutrition inference times separately.
        Reuses the preprocessed tensor so image decoding is performed only once.

        Returns:
            Dict containing predicted_class, confidence, percentage, top_5,
            original_size, nutrition, classifier_time_ms, nutrition_time_ms,
            and inference_time_ms.
        """
        if not self.is_loaded or self.model is None:
            raise RuntimeError("Model is not loaded. Please ensure the API started properly.")

        # 1. Single preprocessing step
        t_prep_start = time.perf_counter()
        input_tensor, original_size = self.preprocess_image(image_bytes)
        prep_time_ms = round((time.perf_counter() - t_prep_start) * 1000, 2)

        # 2. Food Classifier inference & timing
        t_cls_start = time.perf_counter()
        preds = self._infer(input_tensor)
        cls_time_ms = round((time.perf_counter() - t_cls_start) * 1000, 2)

        probabilities = preds[0]

        # Extract top 5 indices ordered by confidence descending
        top_k = min(5, len(probabilities))
        top_indices = np.argsort(probabilities)[::-1][:top_k]

        top_5_results = []
        for idx in top_indices:
            class_name = self.class_names[idx] if idx < len(self.class_names) else f"Class_{idx}"
            conf = float(probabilities[idx])
            top_5_results.append({
                "food_class": class_name,
                "confidence": round(conf, 4),
                "percentage": f"{conf * 100:.2f}%",
            })

        best_prediction = top_5_results[0]

        result: Dict[str, Any] = {
            "predicted_class": best_prediction["food_class"],
            "confidence": best_prediction["confidence"],
            "percentage": best_prediction["percentage"],
            "top_5": top_5_results,
            "original_size": f"{original_size[0]}x{original_size[1]}",
            "classifier_time_ms": cls_time_ms,
            "preprocessing_time_ms": prep_time_ms,
        }

        # 3. Nutrition estimation reusing the preprocessed tensor & timing separately
        nutr_time_ms = 0.0
        try:
            t_nutr_start = time.perf_counter()
            nutrition = nutrition_classifier.predict_nutrition(input_tensor=input_tensor)
            nutr_time_ms = round((time.perf_counter() - t_nutr_start) * 1000, 2)
            result["nutrition"] = nutrition
            result["nutrition_time_ms"] = nutr_time_ms
        except Exception as exc:
            logger.warning("Nutrition prediction failed (non-fatal): %s", exc)

        total_inference_ms = round(cls_time_ms + nutr_time_ms, 2)
        result["inference_time_ms"] = total_inference_ms

        logger.info(
            "Prediction finished - Top: %s | Classifier: %.2fms | Nutrition: %.2fms | Total ML: %.2fms",
            result["predicted_class"],
            cls_time_ms,
            nutr_time_ms,
            total_inference_ms,
        )

        return result


class NutritionClassifier:
    """
    Manages the nutrition regression model that predicts
    calories, protein, carbohydrates, and fat from a food image.
    """

    def __init__(self):
        self.model: Optional[Any] = None
        self.scaler: Optional[Any] = None
        self.target_order: List[str] = []
        self.is_loaded: bool = False
        self.model_path: Optional[Path] = None
        self.scaler_path: Optional[Path] = None
        self.config_path: Optional[Path] = None
        self._lock = threading.Lock()

    def load(
        self,
        model_filename: str = "nutrition_prediction_model.keras",
        scaler_filename: str = "nutrition_target_scaler.joblib",
        config_filename: str = "nutrition_model_config.json",
    ) -> None:
        """
        Load the nutrition regression model, its scaler, and target ordering config.
        Ensures resources load only once per process with compile=False.
        """
        if self.is_loaded and self.model is not None and self.scaler is not None:
            logger.info("NutritionClassifier already loaded in process; skipping reload.")
            return

        with self._lock:
            if self.is_loaded and self.model is not None and self.scaler is not None:
                return

            logger.info("Loading nutrition model resources...")

            # 1. Load config for target order
            config_path = find_project_file(config_filename)
            if not config_path:
                raise FileNotFoundError(f"Nutrition config file '{config_filename}' not found.")
            self.config_path = config_path
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
            self.target_order = config.get("targets_order", [])
            logger.info("Nutrition target order: %s", self.target_order)

            # 2. Load scaler
            scaler_path = find_project_file(scaler_filename)
            if not scaler_path:
                raise FileNotFoundError(f"Nutrition scaler file '{scaler_filename}' not found.")
            self.scaler_path = scaler_path
            self.scaler = joblib.load(str(scaler_path))
            logger.info("Nutrition scaler loaded from: %s", scaler_path)

            # 3. Load Keras model with compile=False
            model_path = find_project_file(model_filename)
            if not model_path:
                raise FileNotFoundError(f"Nutrition model file '{model_filename}' not found.")
            self.model_path = model_path

            try:
                import keras
                load_model_fn = keras.models.load_model
            except (ImportError, AttributeError):
                import tensorflow as tf
                load_model_fn = tf.keras.models.load_model

            self.model = load_model_fn(str(model_path), compile=False)

            # 4. Perform startup warmup
            self._warmup()
            self.is_loaded = True
            logger.info("Nutrition model loaded and warmed up successfully from: %s", model_path)

    def _warmup(self) -> None:
        """Runs a synthetic inference to trigger XLA/graph compilation during startup."""
        try:
            logger.info("Warming up NutritionClassifier graph...")
            dummy_input = np.zeros((1, 224, 224, 3), dtype=np.float32)
            _ = self._infer(dummy_input)
            logger.info("NutritionClassifier graph warmed up successfully.")
        except Exception as exc:
            logger.warning("NutritionClassifier warmup note: %s", exc)

    def _infer(self, input_tensor: np.ndarray) -> np.ndarray:
        """Fast direct callable evaluation for single-sample inference."""
        try:
            raw = self.model(input_tensor, training=False)
            if hasattr(raw, "numpy"):
                return raw.numpy()
            return np.asarray(raw)
        except Exception:
            return self.model.predict(input_tensor, verbose=0)

    def predict_nutrition(
        self,
        image_bytes: Optional[bytes] = None,
        input_tensor: Optional[np.ndarray] = None,
    ) -> Dict[str, Any]:
        """
        Predict nutrition values (calories, protein, carbs, fat) for an image.
        Accepts either raw image bytes or an already preprocessed tensor.
        Returns a dict with keys matching target_order from the config.
        """
        if not self.is_loaded or self.model is None or self.scaler is None:
            raise RuntimeError("Nutrition model or scaler not loaded.")

        if input_tensor is None:
            if image_bytes is None:
                raise ValueError("Either image_bytes or input_tensor must be provided.")
            input_tensor, _ = FoodClassifier.preprocess_image(image_bytes)

        # Fast model prediction -> shape (1, 4)
        raw_preds = self._infer(input_tensor)

        # Inverse-transform from standardised scale back to original units
        nutrition_vals = self.scaler.inverse_transform(raw_preds)[0]

        # Map values to named keys (nutritional quantities cannot be negative physically)
        result = {}
        for idx, name in enumerate(self.target_order):
            val = max(0.0, float(nutrition_vals[idx]))
            result[name] = round(val, 2)
        return result


# Global singleton instances
classifier = FoodClassifier()
nutrition_classifier = NutritionClassifier()
