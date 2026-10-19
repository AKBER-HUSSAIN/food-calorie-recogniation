"""
FastAPI Backend for Food Recognition and Calorie Estimation.

Endpoints:
- GET  /        : API overview and links
- GET  /health  : Check if API and ML model are ready
- POST /predict : Accept multipart/form-data image, classify food, return top 5 predictions
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.predictor import classifier, nutrition_classifier
from backend.schemas import HealthResponse, PredictionResponse, NutritionInfo, NutritionPredictionResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("food_recognition.api")

# Allowed image MIME types and extensions
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB limit


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler.
    Loads the trained model and class names on API startup,
    and handles graceful shutdown.
    """
    logger.info("Application starting up... Loading model and class names.")
    try:
        classifier.load()
        nutrition_classifier.load()
        logger.info("Food classification model initialized and ready for requests.")
    except Exception as exc:
        logger.error(
            "CRITICAL: Failed to load food recognition model at startup: %s",
            exc,
            exc_info=True,
        )
        # We do not crash the app so /health can report status: degraded
    yield
    logger.info("Application shutting down.")


# Initialize FastAPI application
app = FastAPI(
    title="Food Recognition & Calorie Estimation API",
    description=(
        "Backend API powered by FastAPI and TensorFlow/Keras EfficientNetB0. "
        "Classifies combined Indian and international food categories and returns confidence scores and top-5 predictions."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------
# CORS Configuration
# Enables frontend development from localhost (React, Vue, Vite, vanilla HTML, etc.)
# ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Routes
# ---------------------------------------------------------
@app.get(
    "/",
    summary="Root endpoint",
    description="Welcome message and API information.",
    tags=["General"],
)
async def root():
    return {
        "message": "Welcome to the Food Recognition & Calorie Estimation API",
        "status": "online",
        "documentation": "/docs",
        "health_check": "/health",
        "predict_endpoint": "/predict",
    }


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="System and Model Health Check",
    description="Verifies whether the FastAPI server is running and the TensorFlow model is loaded.",
    tags=["Diagnostics"],
)
async def health_check():
    """
    Check if the API and classification & nutrition models are loaded and ready.
    """
    is_healthy = classifier.is_loaded and classifier.model is not None

    return HealthResponse(
        status="healthy" if is_healthy else "degraded",
        model_loaded=classifier.is_loaded,
        nutrition_model_loaded=nutrition_classifier.is_loaded,
        classes_loaded=len(classifier.class_names) > 0,
        total_classes=len(classifier.class_names),
        model_path=str(classifier.model_path) if classifier.model_path else None,
        nutrition_model_path=str(nutrition_classifier.model_path) if nutrition_classifier.model_path else None,
    )



@app.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Classify Food Image",
    description=(
        "Upload an image (JPEG, PNG, WEBP, BMP) using multipart/form-data. "
        "The model will classify the food item and return the predicted category, "
        "confidence score, and top-5 predictions."
    ),
    tags=["Inference"],
)
async def predict_food(
    file: UploadFile = File(..., description="Uploaded food photo (multipart/form-data)"),
):
    """
    Accepts an uploaded image file, validates format, runs EfficientNetB0 inference,
    and returns top-5 prediction results.
    """
    # 1. Verify model is loaded
    if not classifier.is_loaded or classifier.model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Model is currently unavailable or failed to load on startup. "
                "Check server logs and GET /health."
            ),
        )

    # 2. Validate filename and extension
    filename = file.filename or "unknown.jpg"
    ext = Path(filename).suffix.lower()

    # Validate file extension and MIME type
    is_valid_mime = file.content_type and file.content_type.lower() in ALLOWED_MIME_TYPES
    is_valid_ext = ext in ALLOWED_EXTENSIONS

    if not (is_valid_mime or is_valid_ext):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported file type. Detected MIME: '{file.content_type}', Extension: '{ext}'. "
                "Please upload a valid image file (.jpg, .jpeg, .png, .webp, .bmp)."
            ),
        )

    # 3. Read image bytes
    try:
        contents = await file.read()
    except Exception as exc:
        logger.error("Failed to read uploaded file stream: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read the uploaded file data.",
        )

    if not contents or len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image size exceeds the maximum allowed limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB.",
        )

    # 4. Perform prediction via classifier
    try:
        result = classifier.predict(contents)
    except ValueError as val_err:
        # Raised when PIL fails to parse image bytes
        logger.warning("Invalid image file submitted: %s", val_err)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or corrupted image file: {str(val_err)}",
        )
    except Exception as exc:
        logger.error("Inference failure during prediction: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while analyzing the image: {str(exc)}",
        )

    # Build nutrition info if present in result
    nutrition_data = None
    if "nutrition" in result:
        nutrition_data = NutritionInfo(**result["nutrition"])

    return PredictionResponse(
        success=True,
        predicted_class=result["predicted_class"],
        confidence=result["confidence"],
        percentage=result["percentage"],
        top_5=result["top_5"],
        nutrition=nutrition_data,
        filename=filename,
        image_size=result["original_size"],
    )


@app.post(
    "/predict-nutrition",
    response_model=NutritionPredictionResponse,
    summary="Estimate Food Nutrition",
    description=(
        "Upload an image (JPEG, PNG, WEBP, BMP) using multipart/form-data. "
        "The Nutrition5k multi-output regression model will estimate calories (kcal), "
        "protein (g), carbohydrates (g), and fat (g)."
    ),
    tags=["Inference"],
)
async def predict_nutrition_only(
    file: UploadFile = File(..., description="Uploaded food photo (multipart/form-data)"),
):
    """
    Accepts an uploaded image file, validates format, runs Nutrition5k regression inference,
    and returns estimated calories, protein, carbohydrates, and fat.
    """
    if not nutrition_classifier.is_loaded or nutrition_classifier.model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Nutrition model is currently unavailable or failed to load on startup. "
                "Check server logs and GET /health."
            ),
        )

    filename = file.filename or "unknown.jpg"
    ext = Path(filename).suffix.lower()

    is_valid_mime = file.content_type and file.content_type.lower() in ALLOWED_MIME_TYPES
    is_valid_ext = ext in ALLOWED_EXTENSIONS

    if not (is_valid_mime or is_valid_ext):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported file type. Detected MIME: '{file.content_type}', Extension: '{ext}'. "
                "Please upload a valid image file (.jpg, .jpeg, .png, .webp, .bmp)."
            ),
        )

    try:
        contents = await file.read()
    except Exception as exc:
        logger.error("Failed to read uploaded file stream: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read the uploaded file data.",
        )

    if not contents or len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image size exceeds the maximum allowed limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB.",
        )

    try:
        nutrition_dict = nutrition_classifier.predict_nutrition(contents)
    except ValueError as val_err:
        logger.warning("Invalid image file submitted for nutrition: %s", val_err)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or corrupted image file: {str(val_err)}",
        )
    except Exception as exc:
        logger.error("Inference failure during nutrition prediction: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while analyzing the image for nutrition: {str(exc)}",
        )

    return NutritionPredictionResponse(
        success=True,
        nutrition=NutritionInfo(**nutrition_dict),
        filename=filename,
    )

