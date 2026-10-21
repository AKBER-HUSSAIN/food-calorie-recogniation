---
title: Food Recognition & Calorie Estimation API
emoji: 🥗
colorFrom: green
colorTo: lime
sdk: docker
app_port: 7860
---

# Food Recognition and Calorie Estimation Using Machine Learning

Full-stack application for food recognition powered by **FastAPI**, **TensorFlow/Keras** (EfficientNetB0 on combined Indian and international Food-101 datasets), and a modern **React + Vite + Tailwind CSS** frontend.


---

## Project Structure

```text
food-calorie-recognization/
│
├── class_names.json                    # 116 food categories (combined Indian & international)
├── food_recognition_efficientnet.keras # Trained EfficientNetB0 Keras model
├── requirements.txt                    # Python project dependencies
├── run.py                              # Backend startup shortcut script
├── README.md                           # Documentation & setup guide
│
├── backend/                            # FastAPI Backend
│   ├── __init__.py                     # Package marker
│   ├── main.py                         # API server & routes (/predict, /health, /)
│   ├── predictor.py                    # EfficientNet inference & image preprocessing
│   ├── schemas.py                      # Pydantic data schemas
│   └── requirements.txt                # Backend dependencies copy
│
└── frontend/                           # React + Vite + Tailwind CSS Frontend
    ├── index.html                      # HTML entry with typography & metadata
    ├── package.json                    # Frontend dependencies (React, Vite, Lucide, Tailwind)
    ├── vite.config.js                  # Vite configuration with Tailwind CSS plugin
    └── src/
        ├── main.jsx                    # React entry point
        ├── App.jsx                     # Main dashboard coordinator
        ├── index.css                   # Tailwind CSS styling & custom layers
        ├── components/
        │   ├── Header.jsx              # App header with live backend status indicator
        │   ├── ImageUploader.jsx       # Drag-and-drop, preview & prediction trigger
        │   └── PredictionResults.jsx   # Top-1 match showcase & top-5 probabilities breakdown
        └── utils/
            └── formatters.js           # Label & byte formatting helpers
```

---

## Model & Preprocessing Specifications

- **Architecture:** EfficientNetB0 (Transfer Learning with Fine-Tuning)
- **Classes:** 116 food classes (101 international dishes + 15 popular Indian dishes: Biryani, Chole Bhature, Dabeli, Dal, Dhokla, Dosa, Jalebi, Kathi Roll, Kofta, Naan, Pakora, Paneer, Pani Puri, Pav Bhaji, Vada Pav).
- **Input Resolution:** $224 \times 224$ pixels, 3 channels (RGB)
- **Pixel Value Range:** Raw $[0.0, 255.0]$ (`np.float32`). **Do not divide by 255** because the trained model architecture includes internal `Rescaling` and `Normalization` layers inside the EfficientNetB0 sub-block.
- **Output Layer:** Dense softmax layer with 116 class probabilities.

---

## Running the Application (Two Terminals)

The system is designed to run with the backend and frontend in separate terminals.

### Terminal 1: Start the Backend (FastAPI)

1. Open PowerShell and navigate to the project directory:
   ```powershell
   cd c:\Users\Admin\OneDrive\Desktop\food-calorie-recognization
   ```

2. Start the API server:
   ```powershell
   python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
   ```
   *(Or alternatively run: `python run.py`)*

3. Verify backend is running:
   - Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - Health check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### Terminal 2: Start the Frontend (React + Vite + Tailwind CSS)

1. Open a **new** PowerShell window and navigate to the `frontend` directory:
   ```powershell
   cd c:\Users\Admin\OneDrive\Desktop\food-calorie-recognization\frontend
   ```

2. Install frontend dependencies (if not already installed):
   ```powershell
   npm install
   ```

3. Launch the development server:
   ```powershell
   npm run dev
   ```

4. Open your browser and navigate to:
   **[http://localhost:5173](http://localhost:5173)**

---

## Dashboard Features

- **Live Health Status:** Automatically queries `GET /health` and displays a real-time connection badge (shows `Backend Online (101 classes)` when ready).
- **Drag-and-Drop Image Uploader:** Supports drag-and-drop or file browsing with instant image validation (JPEG, PNG, WEBP, BMP up to 15MB).
- **Pre-inference Image Preview:** Displays the chosen food photo with file name and file size.
- **Neural Inference Animation:** Displays scanning feedback while `EfficientNetB0` computes predictions.
- **Top Match Showcase:** Highlights the recognized food dish with its confidence score and progress bar.
- **Top 5 Probability Breakdown:** Visualizes the top 5 ranking food categories with percentage bars.
- **Error Handling & Reset:** Gracefully flags invalid files, network issues, or model loading errors with clear alerts and one-click reset.

---

## API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API status, greeting, and links to documentation |
| `GET` | `/health` | Diagnostic check confirming model and class mapping are in memory |
| `POST` | `/predict` | Multipart file upload for food image classification (returns top-5) |
| `GET` | `/docs` | Swagger interactive OpenAPI documentation |
| `GET` | `/redoc` | ReDoc alternative documentation format |

---

## Troubleshooting Common Windows Issues

### 1. `uvicorn : The term 'uvicorn' is not recognized`
Run `python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000` or `python run.py`. This uses Python directly without needing `Scripts` in PATH.

### 2. `npm : The term 'npm' is not recognized`
Ensure Node.js is installed from [nodejs.org](https://nodejs.org/) and that your terminal was restarted after installation.

### 3. Port already in use (`8000` or `5173`)
If port 8000 is occupied, you can change the port:
```powershell
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8001
```

---

## Next Steps
- Link recognized food categories with the USDA nutritional database to calculate calories, macronutrients (protein, carbs, fat), and portion sizes.
