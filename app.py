"""
Hugging Face Spaces Entrypoint (Gradio SDK - 100% Free CPU Tier).

Mounts the production FastAPI backend onto Gradio so that:
1. All REST API endpoints (/predict, /predict-nutrition, /health, /docs) are directly accessible
   by the Vercel frontend via HTTP POST/GET.
2. Visiting the Hugging Face Space URL in a browser renders an interactive Gradio test interface.
"""

import io
import gradio as gr
from backend.main import app as fastapi_app
from backend.predictor import classifier, nutrition_classifier


def predict_food_gui(image):
    """Interactive GUI handler for testing in Hugging Face browser window."""
    if image is None:
        return "Please upload an image of food."

    # Convert PIL image to bytes
    buf = io.BytesIO()
    image.save(buf, format="JPEG")
    img_bytes = buf.getvalue()

    # Run inference via optimized classifier
    result = classifier.predict(img_bytes)

    top_class = result["predicted_class"].replace("_", " ").title()
    conf_pct = result["percentage"]

    output_lines = [
        f"🏆 Top Match: {top_class} ({conf_pct})",
        "",
        "📊 Top 5 Predictions:",
    ]
    for idx, item in enumerate(result["top_5"], 1):
        name = item["food_class"].replace("_", " ").title()
        output_lines.append(f"  {idx}. {name} — {item['percentage']}")

    if "nutrition" in result and result["nutrition"]:
        nutr = result["nutrition"]
        output_lines.extend([
            "",
            "🥗 Nutrition Estimates (Nutrition5k):",
            f"  • Calories: {nutr.get('calories', 0)} kcal",
            f"  • Protein:  {nutr.get('protein_g', 0)} g",
            f"  • Carbs:    {nutr.get('carbs_g', 0)} g",
            f"  • Fat:      {nutr.get('fat_g', 0)} g",
        ])

    if "inference_time_ms" in result:
        output_lines.extend([
            "",
            f"⚡ Inference Latency: {result['inference_time_ms']} ms",
        ])

    return "\n".join(output_lines)


# Define Gradio GUI
demo = gr.Interface(
    fn=predict_food_gui,
    inputs=gr.Image(type="pil", label="Upload Food Photo"),
    outputs=gr.Textbox(label="Analysis Results", lines=14),
    title="🥗 Food Recognition & Calorie Estimation API",
    description=(
        "Full REST API for food classification & nutrition estimation powered by EfficientNetB0 & FastAPI.\n\n"
        "• REST API endpoints: `/predict`, `/predict-nutrition`, `/health`, `/docs`\n"
        "• Compatible with React/Vite frontends on Vercel."
    ),
    examples=[],
    flagging_mode="never",
)

# Mount Gradio onto the FastAPI app so both the REST API and the GUI work seamlessly together
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
