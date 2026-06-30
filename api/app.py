import os
import sys
import importlib.util

from flask import Flask, request, jsonify

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

app = Flask(__name__)

@app.route('/check', methods=['GET'])
def check():
    drug_a = request.args.get('drug_a')
    drug_b = request.args.get('drug_b')
    if not drug_a or not drug_b:
        return jsonify({"error": "provide drug_a and drug_b as query params"}), 400
    result = check_interaction(drug_a, drug_b)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
