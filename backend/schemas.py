"""
Pydantic schemas for Food Recognition API requests and responses.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class TopPrediction(BaseModel):
    """Individual prediction item in top-K results."""
    food_class: str = Field(..., description="Food class name (e.g., 'pizza')")
    confidence: float = Field(..., description="Prediction confidence score between 0 and 1")
    percentage: str = Field(..., description="Confidence formatted as percentage string (e.g., '94.21%')")
class NutritionInfo(BaseModel):
    """Estimated nutrition values for the food item."""
    calories: float = Field(..., description="Estimated calories in kilocalories")
    protein_g: float = Field(..., description="Estimated protein in grams")
    carbs_g: float = Field(..., description="Estimated carbohydrates in grams")
    fat_g: float = Field(..., description="Estimated fat in grams")


class PredictionResponse(BaseModel):
    """Response payload for food classification prediction."""
    success: bool = Field(True, description="Indicates if prediction was successful")
    predicted_class: str = Field(..., description="Top predicted food class")
    confidence: float = Field(..., description="Confidence score for top prediction")
    percentage: str = Field(..., description="Confidence formatted as percentage string")
    top_5: List[TopPrediction] = Field(..., description="Top 5 most likely food classes")
    nutrition: Optional[NutritionInfo] = Field(None, description="Estimated nutrition values")
    filename: Optional[str] = Field(None, description="Original filename of uploaded image")
    image_size: Optional[str] = Field(None, description="Original resolution of uploaded image (WxH)")


class HealthResponse(BaseModel):
    """Health check status response."""
    status: str = Field(..., description="Service status ('healthy' or 'degraded')")
    model_loaded: bool = Field(..., description="Whether the food classification model is loaded")
    nutrition_model_loaded: Optional[bool] = Field(None, description="Whether the nutrition regression model is loaded")
    classes_loaded: bool = Field(..., description="Whether class names JSON is loaded")
    total_classes: int = Field(..., description="Number of recognized food classes")
    model_path: Optional[str] = Field(None, description="Resolved path of the classification model file")
    nutrition_model_path: Optional[str] = Field(None, description="Resolved path of the nutrition model file")


class NutritionPredictionResponse(BaseModel):
    """Response payload for standalone nutrition prediction."""
    success: bool = Field(True, description="Indicates if prediction was successful")
    nutrition: NutritionInfo = Field(..., description="Estimated nutrition values")
    filename: Optional[str] = Field(None, description="Original filename of uploaded image")
    image_size: Optional[str] = Field(None, description="Original resolution of uploaded image (WxH)")

