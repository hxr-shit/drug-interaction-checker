import os
import sys
import importlib.util

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = os.path.join(ROOT_DIR, "scripts")

if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

query_interactions_path = os.path.join(SCRIPTS_DIR, "query_interactions.py")
spec = importlib.util.spec_from_file_location("query_interactions", query_interactions_path)
if spec is None or spec.loader is None:
    raise ImportError(f"Could not load {query_interactions_path}")

query_interactions = importlib.util.module_from_spec(spec)
spec.loader.exec_module(query_interactions)
check_interaction = query_interactions.check_interaction

@app.route("/")
def home():
    return jsonify({
        "status": "running",
        "message": "Drug Interaction Checker API"
    })


@app.route("/check", methods=["GET", "POST"])
def check():

    if request.method == "POST":
        data = request.get_json(silent=True) or {}

        drug_a = data.get("drug_a")
        drug_b = data.get("drug_b")
        explain_mode = data.get("explain", "template")

    else:
        drug_a = request.args.get("drug_a")
        drug_b = request.args.get("drug_b")
        explain_mode = request.args.get("explain", "template")

    if not drug_a or not drug_b:
        return jsonify({"error": "provide drug_a and drug_b"}), 400

    result = check_interaction(
        drug_a,
        drug_b,
        explain_mode=explain_mode
    )

    return jsonify(result)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)