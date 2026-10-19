"""
Convenience entry point to run the Food Recognition FastAPI server.
Usage:
    python run.py
"""
import uvicorn

if __name__ == "__main__":
    print("Starting Food Recognition API server on http://127.0.0.1:8000 ...")
    print("Swagger docs available at: http://127.0.0.1:8000/docs")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
