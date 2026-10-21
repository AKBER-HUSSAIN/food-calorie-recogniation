"""
Convenience entry point to run the Food Recognition FastAPI server.
Supports local development and production container hosting (e.g., Render).
"""
import os
import uvicorn

if __name__ == "__main__":
    # Render assigns the port via $PORT (usually 10000)
    port = int(os.environ.get("PORT", 10000 if "RENDER" in os.environ else 8000))
    # Must bind to 0.0.0.0 in container/cloud environments so Render's proxy can route traffic
    host = os.environ.get("HOST", "0.0.0.0")
    # Enable reload only in local development, not on cloud servers
    is_prod = "RENDER" in os.environ or os.environ.get("ENVIRONMENT") == "production"
    reload = False if is_prod else True

    print(f"Starting Food Recognition API server on http://{host}:{port} ...")
    uvicorn.run("backend.main:app", host=host, port=port, reload=reload)
