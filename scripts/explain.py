import re
import os
import sys
sys.path.append(os.path.dirname(__file__))
from db import get_connection

ORGAN_PLAIN_LANGUAGE = {
    "Vascular disorders": "blood vessels and circulation",
    "Gastrointestinal disorders": "stomach and digestive system",
    "Hepatobiliary disorders": "liver and bile ducts",
    "Cardiac disorders": "heart",
    "Nervous system disorders": "brain and nerves",
    "Renal and urinary disorders": "kidneys and urinary tract",
    "Respiratory, thoracic and mediastinal disorders": "lungs and breathing",
    "Skin and subcutaneous tissue disorders": "skin",
    "Blood and lymphatic system disorders": "blood and immune cells",
    "Musculoskeletal and connective tissue disorders": "muscles and joints",
    "Immune system disorders": "immune system",
    "Psychiatric disorders": "mental health and mood",
    "Ear and labyrinth disorders": "ears and balance",
    "Eye disorders": "eyes and vision",
    "Endocrine disorders": "hormones and glands",
    "Reproductive system and breast disorders": "reproductive organs",
    "Metabolism and nutrition disorders": "metabolism and nutrition",
    "Investigations": "lab test abnormalities",
    "General disorders and administration site conditions": "general body symptoms",
    "Infections and infestations": "infections",
    "Neoplasms benign, malignant and unspecified": "tumors and growths",
    "Injury, poisoning and procedural complications": "injury and complications",
    "Pregnancy, puerperium and perinatal conditions": "pregnancy-related effects",
    "Social circumstances": "social factors",
    "Surgical and medical procedures": "surgical effects",
    "Product issues": "medication quality issues",
}

def get_organ_effects(cursor, drug_id, organ_name):
    cursor.execute("""
        SELECT se.effect
        FROM side_effects se
        JOIN organs o ON se.organ_id = o.id
        WHERE se.drugs_id = %s AND o.name = %s
    """, (drug_id, organ_name))
    return [row[0] for row in cursor.fetchall()]

def clean_effect(effect_text):
    match = re.search(r'\s+[A-Z][a-z]+ (disorders|conditions|system):', effect_text)
    if match:
        effect_text = effect_text[:match.start()]
    return effect_text.strip()

def build_explanation(drug_a, drug_b, severity, shared_organ_details):
    """Offline template-based explanation — no API calls."""
    if not shared_organ_details:
        return (f"{drug_a.title()} and {drug_b.title()} have a {severity} severity interaction "
                f"with no overlapping organ effects identified in our database.")
    
    organ_summaries = []
    for item in shared_organ_details:
        plain = item["plain_name"]
        effects_a = clean_effect(", ".join(item.get(drug_a, [])[:2])) or "some effects"
        effects_b = clean_effect(", ".join(item.get(drug_b, [])[:2])) or "some effects"
        organ_summaries.append(
            f"your {plain} ({drug_a.title()}: {effects_a}; {drug_b.title()}: {effects_b})"
        )
    
    organs_text = ", ".join(organ_summaries)
    
    return {
        "high": f"⚠️ Taking {drug_a.title()} and {drug_b.title()} together is HIGH RISK. Both drugs affect {organs_text}. Do not combine without medical supervision.",
        "moderate": f"⚠️ Use caution when taking {drug_a.title()} and {drug_b.title()} together. Both affect {organs_text}. Consult your doctor.",
        "low": f"ℹ️ {drug_a.title()} and {drug_b.title()} have a low-risk interaction. Both affect {organs_text}. Monitor for symptoms.",
        "none": f"ℹ️ No significant interaction found between {drug_a.title()} and {drug_b.title()}, but both affect {organs_text}."
    }.get(severity, f"Consult your doctor before combining {drug_a.title()} and {drug_b.title()}.")

def groq_explain(drug_a, drug_b, severity, shared_organ_details):
    """Groq-powered natural language explanation."""
    from groq_client import groq_complete
    
    organ_summary = []
    for item in shared_organ_details:
        plain = item["plain_name"]
        effects_a = clean_effect(", ".join(item.get(drug_a, [])[:2])) or "some effects"
        effects_b = clean_effect(", ".join(item.get(drug_b, [])[:2])) or "some effects"
        organ_summary.append(f"{plain}: {drug_a} causes {effects_a}; {drug_b} causes {effects_b}")
    
    prompt = f"""Write a 2-3 sentence plain language explanation for a patient about this drug interaction.

Drug A: {drug_a}
Drug B: {drug_b}
Severity: {severity}
Shared organ effects:
{chr(10).join(organ_summary)}

Rules:
- No medical jargon
- Be specific about which organs are affected
- Tell them what to do
- Sound like a caring pharmacist, not a robot
- Max 3 sentences"""

    return groq_complete(prompt, max_tokens=150)

def save_explanation(interaction_id, explanation_text):
    """Cache Groq explanation to DB so same pair never hits Groq twice."""
    connect, cursor = get_connection()
    cursor.execute(
        "UPDATE interactions SET explanation = %s WHERE id = %s",
        (explanation_text, interaction_id)
    )
    connect.commit()
    cursor.close()
    connect.close()