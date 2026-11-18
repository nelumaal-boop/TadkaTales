import os
import glob
import json
import re
from datetime import datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for
from extractor import extract_recipe_from_video

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RECIPES_DIR = os.path.join(BASE_DIR, "recipes")
os.makedirs(RECIPES_DIR, exist_ok=True)

app = Flask(__name__, template_folder="templates", static_folder="static")
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    text = re.sub(r'^-+|-+$', '', text)
    return text or "recipe"

def normalize_recipe(data: dict) -> dict:
    if not isinstance(data, dict):
        return {}

    # Title
    if "title" in data and isinstance(data["title"], dict):
        if not data.get("title_en"):
            data["title_en"] = data["title"].get("en", "")
        if not data.get("title_hi"):
            data["title_hi"] = data["title"].get("hi", "")

    # Description
    if "description" in data and isinstance(data["description"], dict):
        if not data.get("description_en"):
            data["description_en"] = data["description"].get("en", "")
        if not data.get("description_hi"):
            data["description_hi"] = data["description"].get("hi", "")

    # Times
    if "prepTime" in data and not data.get("prep_time_en"):
        data["prep_time_en"] = data["prepTime"]
        data["prep_time_hi"] = data["prepTime"]
    if "cookTime" in data and not data.get("cook_time_en"):
        data["cook_time_en"] = data["cookTime"]
        data["cook_time_hi"] = data["cookTime"]
    if "servings" in data and not data.get("servings_en"):
        data["servings_en"] = data["servings"]
        data["servings_hi"] = data["servings"]

    if not data.get("difficulty_en"):
        data["difficulty_en"] = "Medium"
        data["difficulty_hi"] = "मध्यम"

    # Diet
    if not data.get("diet"):
        is_veg = data.get("isVegetarian", True)
        data["diet"] = "Veg" if is_veg else "Non-Veg"
        data["diet_hi"] = "शाकाहारी" if is_veg else "मांसाहारी"

    # YouTube ID & Image URL
    y_id = data.get("youtube_id") or data.get("youtubeId", "")
    if y_id:
        if not data.get("youtube_id"):
            data["youtube_id"] = y_id
        if not data.get("youtube_url"):
            data["youtube_url"] = f"https://www.youtube.com/watch?v={y_id}"
        if not data.get("image_url"):
            data["image_url"] = f"https://img.youtube.com/vi/{y_id}/hqdefault.jpg"

    # Ingredients
    if "ingredients" in data and isinstance(data["ingredients"], list) and not data.get("ingredients_en"):
        ing_en, ing_hi = [], []
        for cat in data["ingredients"]:
            if isinstance(cat, dict) and "items" in cat:
                for item in cat["items"]:
                    if isinstance(item, dict):
                        ing_en.append(item.get("en", ""))
                        ing_hi.append(item.get("hi", ""))
                    elif isinstance(item, str):
                        ing_en.append(item)
                        ing_hi.append(item)
        data["ingredients_en"] = ing_en
        data["ingredients_hi"] = ing_hi

    # Instructions
    if "instructions" in data and isinstance(data["instructions"], list) and not data.get("instructions_en"):
        inst_en, inst_hi = [], []
        for step in data["instructions"]:
            if isinstance(step, dict):
                t = step.get("text", {})
                if isinstance(t, dict):
                    inst_en.append(t.get("en", ""))
                    inst_hi.append(t.get("hi", ""))
                elif isinstance(t, str):
                    inst_en.append(t)
                    inst_hi.append(t)
            elif isinstance(step, str):
                inst_en.append(step)
                inst_hi.append(step)
        data["instructions_en"] = inst_en
        data["instructions_hi"] = inst_hi

    # Tips
    if "tips" in data and isinstance(data["tips"], list) and not data.get("chef_tips_en"):
        tip_en, tip_hi = [], []
        for tip in data["tips"]:
            if isinstance(tip, dict):
                tip_en.append(tip.get("en", ""))
                tip_hi.append(tip.get("hi", ""))
            elif isinstance(tip, str):
                tip_en.append(tip)
                tip_hi.append(tip)
        data["chef_tips_en"] = tip_en
        data["chef_tips_hi"] = tip_hi

    # Tags
    if not data.get("tags") or not isinstance(data.get("tags"), list):
        data["tags"] = []

    return data

def load_all_recipes():
    recipes = []
    for filepath in glob.glob(os.path.join(RECIPES_DIR, "*.json")):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                recipes.append(normalize_recipe(data))
        except Exception as e:
            print(f"Error loading {filepath}: {e}")
    # Sort by ID or title
    recipes.sort(key=lambda x: (x.get("title_en") or x.get("id") or "").lower())
    return recipes

@app.route("/")
def index():
    recipes = load_all_recipes()
    return render_template("index.html", recipes=recipes)

@app.route("/googlecccccdc404ce1a05.html")
def google_verification():
    return "google-site-verification: googlecccccdc404ce1a05.html", 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/sitemap.xml")
def sitemap():
    base_url = request.host_url.rstrip("/")
    recipes = load_all_recipes()
    today = datetime.now().strftime("%Y-%m-%d")
    
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]
    
    # Homepage
    xml_lines.append('  <url>')
    xml_lines.append(f'    <loc>{base_url}/</loc>')
    xml_lines.append(f'    <lastmod>{today}</lastmod>')
    xml_lines.append('    <changefreq>daily</changefreq>')
    xml_lines.append('    <priority>1.0</priority>')
    xml_lines.append('  </url>')
    
    # All Recipes
    for r in recipes:
        r_id = r.get("id")
        if r_id:
            xml_lines.append('  <url>')
            xml_lines.append(f'    <loc>{base_url}/recipe/{r_id}</loc>')
            xml_lines.append(f'    <lastmod>{today}</lastmod>')
            xml_lines.append('    <changefreq>weekly</changefreq>')
            xml_lines.append('    <priority>0.8</priority>')
            xml_lines.append('  </url>')
            
    xml_lines.append('</urlset>')
    return "\n".join(xml_lines), 200, {'Content-Type': 'application/xml; charset=utf-8'}

@app.route("/robots.txt")
def robots():
    base_url = request.host_url.rstrip("/")
    content = f"User-agent: *\nAllow: /\n\nSitemap: {base_url}/sitemap.xml\n"
    return content, 200, {'Content-Type': 'text/plain; charset=utf-8'}

@app.route("/recipe/<recipe_id>")
def view_recipe(recipe_id):
    filepath = os.path.join(RECIPES_DIR, f"{recipe_id}.json")
    if not os.path.exists(filepath):
        return redirect(url_for("index"))
    with open(filepath, "r", encoding="utf-8") as f:
        recipe = normalize_recipe(json.load(f))
    return render_template("recipe.html", recipe=recipe)

@app.route("/studio")
def studio():
    return render_template("studio.html")

# API Endpoints
@app.route("/api/recipes")
def api_recipes():
    return jsonify(load_all_recipes())

@app.route("/api/recipes/<recipe_id>")
def api_get_recipe(recipe_id):
    filepath = os.path.join(RECIPES_DIR, f"{recipe_id}.json")
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            return jsonify(normalize_recipe(json.load(f)))
    return jsonify({"error": "Recipe not found"}), 404

@app.route("/api/extract", methods=["POST"])
def api_extract():
    data = request.get_json() or {}
    url = data.get("url", "").strip()
    if not url:
        return jsonify({"error": "Please provide a valid YouTube URL"}), 400

    extracted = extract_recipe_from_video(url)
    if "error" in extracted:
        return jsonify(extracted), 400

    return jsonify(extracted)

@app.route("/api/save-recipe", methods=["POST"])
def api_save_recipe():
    data = request.get_json() or {}
    recipe_id = data.get("id") or slugify(data.get("title_en", "recipe"))
    data["id"] = recipe_id

    # Fallbacks and sanitization
    if not data.get("image_url") and data.get("youtube_id"):
        data["image_url"] = f"https://img.youtube.com/vi/{data['youtube_id']}/hqdefault.jpg"

    filepath = os.path.join(RECIPES_DIR, f"{recipe_id}.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return jsonify({
        "status": "success",
        "id": recipe_id,
        "url": f"/recipe/{recipe_id}"
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
