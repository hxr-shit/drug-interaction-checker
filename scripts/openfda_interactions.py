import re
import requests
import os
import sys
sys.path.append(os.path.dirname(__file__))
from db import get_connection

SEVERITY_KEYWORDS = {
    "high": ["contraindicated", "avoid", "do not use", "fatal", "life-threatening", "serious bleeding", "major"],
    "moderate": ["caution", "monitor closely", "reduce dose", "significant", "moderate"],
    "low": ["minor", "monitor", "observe", "minimal"]
}

def fetch_openfda_interactions_text(drug_name):
    """Fetch drug_interactions field from OpenFDA for a given drug."""
    url = "https://api.fda.gov/drug/label.json"
    params = {
        "search": f'openfda.generic_name:"{drug_name}"',
        "limit": 5
    }
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code != 200:
            return None
        data = response.json()
        if "results" not in data or not data["results"]:
            return None
        
        best = None
        for result in data["results"]:
            if result.get("drug_interactions"):
                best = result
                break
        if best is None:
            best = data["results"][0]
        
        return best.get("drug_interactions", [""])[0] or None
    except:
        return None

def extract_relevant_paragraph(interactions_text, drug_b_name):
    """Find the paragraph mentioning drug_b in drug_a's interactions text."""
    if not interactions_text:
        return None
    
    # try to find drug_b name in the text (case insensitive)
    pattern = re.compile(re.escape(drug_b_name), re.IGNORECASE)
    if not pattern.search(interactions_text):
        return None
    
    # split into sentences and find the ones mentioning drug_b
    sentences = re.split(r'(?<=[.!?])\s+', interactions_text)
    relevant = [s for s in sentences if pattern.search(s)]
    
    if not relevant:
        return None
    
    return " ".join(relevant[:3])  # max 3 sentences

def infer_severity(text):
    """Infer severity from keyword matching."""
    text_lower = text.lower()
    for severity, keywords in SEVERITY_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            return severity
    return "moderate"  # default if no keywords match

def get_or_create_drug_id(cursor, drug_name):
    cursor.execute(
        "SELECT id FROM drugs WHERE LOWER(name) = LOWER(%s)", (drug_name,)
    )
    row = cursor.fetchone()
    if row:
        return row[0]
    cursor.execute(
        "INSERT IGNORE INTO drugs (name) VALUES (%s)", (drug_name.lower(),)
    )
    return cursor.lastrowid

def query_openfda_interaction(drug_a, drug_b):
    """
    Main function — check OpenFDA drug_interactions text for drug_b mention in drug_a's label.
    Returns structured result dict or None.
    Saves to interactions table with source attribution if found.
    """
    # try drug_a's label mentioning drug_b
    text_a = fetch_openfda_interactions_text(drug_a)
    relevant = extract_relevant_paragraph(text_a, drug_b) if text_a else None
    source_drug = drug_a
    
    # if not found, try drug_b's label mentioning drug_a
    if not relevant:
        text_b = fetch_openfda_interactions_text(drug_b)
        relevant = extract_relevant_paragraph(text_b, drug_a) if text_b else None
        source_drug = drug_b
    
    if not relevant:
        return None
    
    severity = infer_severity(relevant)
    
    # save to interactions table for future lookups
    connect, cursor = get_connection()
    id_a = get_or_create_drug_id(cursor, drug_a)
    id_b = get_or_create_drug_id(cursor, drug_b)
    
    if id_a and id_b and id_a != id_b:
        cursor.execute(
            """INSERT IGNORE INTO interactions 
               (drug_a_id, drug_b_id, severity, mechanism, raw_text) 
               VALUES (%s, %s, %s, %s, %s)""",
            (id_a, id_b, severity, relevant, f"openfda:{source_drug}")
        )
        connect.commit()
    
    cursor.close()
    connect.close()
    
    return {
        "found": True,
        "severity": severity,
        "mechanism": relevant,
        "raw_text": f"openfda:{source_drug}",
        "source": "openfda"
    }

if __name__ == "__main__":
    a = input("Drug A: ")
    b = input("Drug B: ")
    result = query_openfda_interaction(a, b)
    print(result)