from db import get_connection
from normalize import normalize
from explain import build_explanation, groq_explain, save_explanation, get_organ_effects, ORGAN_PLAIN_LANGUAGE


def get_drug_id(cursor, name):
    cursor.execute("SELECT id FROM drugs WHERE LOWER(name) = LOWER(%s)", (name,))
    row = cursor.fetchone()
    cursor.fetchall()
    return row[0] if row else None

def get_drug_organs(cursor, drug_id):
    cursor.execute("""
        SELECT DISTINCT o.name, se.effect
        FROM side_effects se
        JOIN organs o ON se.organ_id = o.id
        WHERE se.drugs_id = %s
        ORDER BY o.name, se.effect
    """, (drug_id,))
    rows = cursor.fetchall()
    organs = {}
    for organ, effect in rows:
        organs.setdefault(organ, []).append(effect)
    return [{"organ": organ, "effects": effects} for organ, effects in organs.items()]

def check_interaction(drug_a, drug_b, explain_mode="template"):
    connect, cursor = get_connection()
    
    id_a = get_drug_id(cursor, drug_a)
    id_b = get_drug_id(cursor, drug_b)

    if id_a is None:
        normalized = normalize(drug_a)
        if normalized:
            id_a = get_drug_id(cursor, normalized)
    if id_b is None:
        normalized = normalize(drug_b)
        if normalized:
            id_b = get_drug_id(cursor, normalized)
    
    if id_a is None or id_b is None:
        cursor.close(); connect.close()
        return {"found": False, "reason": "one or both drugs not recognized"}
    
    cursor.execute(
        """SELECT id, severity, mechanism, raw_text, explanation 
           FROM interactions 
           WHERE (drug_a_id=%s AND drug_b_id=%s) OR (drug_a_id=%s AND drug_b_id=%s)""",
        (id_a, id_b, id_b, id_a)
    )
    result = cursor.fetchone()
    cursor.fetchall()

    # DDInter missed — try OpenFDA fallback
    if not result:
        from openfda_interactions import query_openfda_interaction
        openfda_result = query_openfda_interaction(drug_a, drug_b)
        if openfda_result:
            result = (
                None,                           # id
                openfda_result["severity"],     # severity
                openfda_result["mechanism"],    # mechanism
                openfda_result["raw_text"],     # raw_text
                None                            # cached explanation
            )

    # Groq fallback if DDInter and OpenFDA both missed
    if not result:
        from groq_client import groq_complete
        import json

        prompt = f"""Drug interaction between {drug_a} and {drug_b}.

Respond with ONLY this exact JSON, no nesting, no extra fields:
{{"severity": "low", "mechanism": "one sentence explanation"}}

severity must be exactly one of: high, moderate, low, none
mechanism must be a single plain sentence."""

        try:
            response = groq_complete(prompt, max_tokens=150)
            response = response.replace('```json', '').replace('```', '').strip()
            groq_data = json.loads(response)
        
            severity = groq_data.get("severity", "moderate")
            mechanism = groq_data.get("mechanism", "")
            if not severity or not mechanism:
        # dig into nested structure
                for v in groq_data.values():
                    if isinstance(v, dict):
                        for v2 in v.values():
                            if isinstance(v2, dict):
                                for v3 in v2.values():
                                    if isinstance(v3, dict):
                                        severity = severity or v3.get("severity")
                                        mechanism = mechanism or v3.get("mechanism")
    
            severity = severity or "moderate"
            mechanism = mechanism or ""

            if mechanism:  # ADD THIS BLOCK
                connect2, cursor2 = get_connection()
                cursor2.execute(
                    """INSERT IGNORE INTO interactions 
                    (drug_a_id, drug_b_id, severity, mechanism, raw_text)
                    VALUES (%s, %s, %s, %s, %s)""",
                    (id_a, id_b, severity, mechanism, "groq:generated")
                )
                connect2.commit()
                cursor2.close()
                connect2.close()
            
                result = (None, severity, mechanism, "groq:generated", None)
    
        except Exception as e:
            print(f"Groq interaction fallback failed: {e}")

    drug_a_organs = get_drug_organs(cursor, id_a)
    drug_b_organs = get_drug_organs(cursor, id_b)

    a_names = {item["organ"] for item in drug_a_organs}
    b_names = {item["organ"] for item in drug_b_organs}
    shared_organs = sorted(list(a_names & b_names))

    shared_organ_details = []
    for organ in shared_organs:
        effects_a = get_organ_effects(cursor, id_a, organ)
        effects_b = get_organ_effects(cursor, id_b, organ)
        shared_organ_details.append({
            "organ": organ,
            "plain_name": ORGAN_PLAIN_LANGUAGE.get(organ, organ),
            drug_a: effects_a,
            drug_b: effects_b
        })
    
    cursor.close(); connect.close()
    
    if result:
        interaction_id = result[0]
        severity = result[1]
        cached_explanation = result[4]

        if explain_mode == "groq":
            if cached_explanation:
                explanation = cached_explanation
                explanation_source = "cached"
            else:
                explanation = groq_explain(drug_a, drug_b, severity, shared_organ_details)
                save_explanation(interaction_id, explanation)
                explanation_source = "groq"
        else:
            explanation = build_explanation(drug_a, drug_b, severity, shared_organ_details)
            explanation_source = "template"

        return {
            "found": True,
            "severity": severity,
            "mechanism": result[2],
            "raw_text": result[3],
            "drug_a_organs": drug_a_organs,
            "drug_b_organs": drug_b_organs,
            "shared_organs": shared_organs,
            "shared_organ_details": shared_organ_details,
            "explanation": explanation,
            "explanation_source": explanation_source
        }

    explanation = build_explanation(drug_a, drug_b, "none", shared_organ_details)

    
    return {
        "found": False,
        "reason": "no known interaction in database",
        "drug_a_organs": drug_a_organs,
        "drug_b_organs": drug_b_organs,
        "shared_organs": shared_organs,
        "shared_organ_details": shared_organ_details,
        "explanation": explanation,
        "explanation_source": "template"
    }

if __name__ == "__main__":
    a = input("Drug A: ")
    b = input("Drug B: ")
    print(check_interaction(a, b))