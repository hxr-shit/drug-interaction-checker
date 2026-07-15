from db import get_connection
from normalize import normalize

def get_drug_id(cursor, name):
    cursor.execute("SELECT id FROM drugs WHERE name = LOWER(%s)", (name,))
    row = cursor.fetchone()
    cursor.fetchall()
    return row[0] if row else None

def get_drug_organs(cursor, drug_id):
    cursor.execute("""
        SELECT
            o.name,
            se.effect
        FROM side_effects se
        JOIN organs o
            ON se.organ_id = o.id
        WHERE se.drugs_id = %s
        ORDER BY o.name, se.effect
    """, (drug_id,))

    rows = cursor.fetchall()

    organs = {}

    for organ, effect in rows:
        organs.setdefault(organ, []).append(effect)

    return [
        {
            "organ": organ,
            "effects": effects
        }
        for organ, effects in organs.items()
    ]

def check_interaction(drug_a, drug_b):
    connect, cursor = get_connection()
    
    id_a = get_drug_id(cursor, drug_a)
    id_b = get_drug_id(cursor, drug_b)

    # try normalizing if not found directly
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
        "SELECT severity, mechanism, raw_text FROM interactions WHERE (drug_a_id=%s AND drug_b_id=%s) OR (drug_a_id=%s AND drug_b_id=%s)",
        (id_a, id_b, id_b, id_a)
    )
    result = cursor.fetchone()
    cursor.fetchall()
    
    drug_a_organs = get_drug_organs(cursor, id_a)
    drug_b_organs = get_drug_organs(cursor, id_b)

    a_names = {
        item["organ"]
        for item in drug_a_organs
    }

    b_names = {
        item["organ"]
        for item in drug_b_organs
    }

    shared_organs = sorted(
        list(a_names & b_names)
    )

    cursor.close(); connect.close()
    
    if result:
        return {"found": True,
        "severity": result[0],
        "mechanism": result[1],
        "raw_text": result[2],
        "drug_a_organs": drug_a_organs,
        "drug_b_organs": drug_b_organs,
        "shared_organs": shared_organs}    
    return {"found": False, "reason": "no known interaction in database", "drug_a_organs": drug_a_organs,
    "drug_b_organs": drug_b_organs,
    "shared_organs": shared_organs}

if __name__ == "__main__":
    a = input("Drug A: ")
    b = input("Drug B: ")
    print(check_interaction(a, b))
