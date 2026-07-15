from db import get_connection
from groq_client import groq_complete
# The 27 MedDRA SOC names — same as what you seeded into organs table
MEDDRA_SOCS = [
    "Blood and lymphatic system disorders",
    "Cardiac disorders",
    "Congenital, familial and genetic disorders",
    "Ear and labyrinth disorders",
    "Endocrine disorders",
    "Eye disorders",
    "Gastrointestinal disorders",
    "General disorders and administration site conditions",
    "Hepatobiliary disorders",
    "Immune system disorders",
    "Infections and infestations",
    "Injury, poisoning and procedural complications",
    "Investigations",
    "Metabolism and nutrition disorders",
    "Musculoskeletal and connective tissue disorders",
    "Neoplasms benign, malignant and unspecified",
    "Nervous system disorders",
    "Pregnancy, puerperium and perinatal conditions",
    "Psychiatric disorders",
    "Renal and urinary disorders",
    "Reproductive system and breast disorders",
    "Respiratory, thoracic and mediastinal disorders",
    "Skin and subcutaneous tissue disorders",
    "Social circumstances",
    "Surgical and medical procedures",
    "Vascular disorders",
    "Product issues"
]

def get_organ_id(cursor, organ_name):
    cursor.execute("SELECT id FROM organs WHERE name = %s", (organ_name,))
    row = cursor.fetchone()
    return row[0] if row else None

def get_drugs_id(cursor, drug_name):
    cursor.execute("SELECT id FROM drugs WHERE name = LOWER(%s)", (drug_name,))
    row = cursor.fetchone()
    return row[0] if row else None

def parse_meddra_from_text(raw_text):
    """
    Try to extract MedDRA SOC names directly from raw text.
    Returns list of dicts: [{organ, effect, frequency}] or empty list if fails.
    """
    results = []
    for soc in MEDDRA_SOCS:
        if soc.lower() in raw_text.lower():
            # SOC name found — extract text after it until next SOC or end
            idx = raw_text.lower().find(soc.lower())
            chunk = raw_text[idx + len(soc):idx + len(soc) + 300]
            # crude extraction — take first sentence after the SOC name
            effects_text = chunk.split('.')[0].strip(': \n')
            if effects_text:
                results.append({
                    "organ": soc,
                    "effect": effects_text[:255],  # VARCHAR(255) limit
                    "frequency": "unknown"
                })
    return results

def groq_extract_side_effects(drug_name, raw_text):
    from groq_client import groq_complete
    import json
    
    prompt = f"""Extract side effects from this drug label for "{drug_name}":

{raw_text[:3000]}

Return ONLY a JSON array. Each item must have:
- "organ_system": use ONLY MedDRA SOC names like "Gastrointestinal disorders", "Nervous system disorders" etc.
- "effect": specific side effect
- "frequency": one of "very common", "common", "rare", "unknown"

Return max 15 items. No other text, just the JSON array."""

    try:
        text = groq_complete(prompt)
        text = text.replace('```json', '').replace('```', '').strip()
        return json.loads(text)
    except Exception as e:
        print(f"Groq parse error for {drug_name}: {e}")
        return []

def parse_json_socs(raw_output):
    """
    Parse Groq's JSON response into the same shape the rest of this
    function expects: [{"organ_system": ..., "effect": ..., "frequency": ...}, ...]
    Returns [] on any parse failure rather than raising, so one bad
    response doesn't kill the bulk loop.
    """
    import json
    if not raw_output:
        return []
    text = raw_output.strip()
    text = text.replace('```json', '').replace('```', '').strip()
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        print(f"Could not parse Groq response as JSON: {text[:200]}")
        return []

    if not isinstance(parsed, list):
        return []

    # Defensive: if the model ignores instructions and returns plain
    # strings instead of dicts, don't crash the downstream .get() calls.
    cleaned = []
    for item in parsed:
        if isinstance(item, dict):
            cleaned.append(item)
        elif isinstance(item, str):
            cleaned.append({"organ_system": item, "effect": "", "frequency": "unknown"})
    return cleaned

def extract_and_save_side_effects(drug_name, raw_adverse_text, meddra_only=False):
    """Main function — MedDRA parse first, Gemini fallback."""
    connect, cursor = get_connection()
    
    drugs_id = get_drugs_id(cursor, drug_name)
    if not drugs_id:
        print(f"Drug '{drug_name}' not found in drugs table")
        cursor.close(); connect.close()
        return
    
    # try MedDRA parsing first
    extracted = parse_meddra_from_text(raw_adverse_text)
    source = "meddra_parse"

    if not extracted:
        if meddra_only:
            print(f"Skipping {drug_name} - no MedDRA SOCs found")
            cursor.close(); connect.close()
            return
        source = "groq_fallback"
        prompt = f"""Extract side effects from this drug label for "{drug_name}":

{raw_adverse_text[:3000]}

Return ONLY a JSON array. Each item must have:
- "organ_system": use ONLY one of these exact names: {', '.join(MEDDRA_SOCS)}
- "effect": specific side effect (max 50 words)
- "frequency": one of "very common", "common", "rare", "unknown"

Return max 15 items. No other text, just the JSON array."""
        raw_output = groq_complete(prompt)
        extracted = parse_json_socs(raw_output)
    print(f"Extracted {len(extracted)} side effects for {drug_name} via {source}")
    
    for item in extracted:
        organ_name = item.get("organ_system") or item.get("organ")
        effect = item.get("effect", "")
        frequency = item.get("frequency", "unknown")
        
        # map frequency to your ENUM values
        freq_map = {
            "very common": "very common",
            "common": "common",
            "rare": "rare",
            "unknown": "rare"  # default unknown to rare
        }
        frequency = freq_map.get(frequency.lower(), "rare")
        
        organ_id = get_organ_id(cursor, organ_name)
        if not organ_id:
            # try case-insensitive match
            cursor.execute(
                "SELECT id FROM organs WHERE LOWER(name) = LOWER(%s)", 
                (organ_name,)
            )
            row = cursor.fetchone()
            organ_id = row[0] if row else None
        
        if organ_id and effect:
            cursor.execute(
                "INSERT IGNORE INTO side_effects (drugs_id, organ_id, effect, frequency) VALUES (%s, %s, %s, %s)",
                (drugs_id, organ_id, effect[:255], frequency)
            )
    
    connect.commit()
    cursor.close()
    connect.close()











    #else:
    ##       extracted = gemini_extract_side_effects(drug_name, raw_adverse_text)
      #      source = "gemini"