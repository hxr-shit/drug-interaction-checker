from db import get_connection
from normalize import normalize

def get_drug_id(cursor, name):
    cursor.execute("SELECT id FROM drugs WHERE name = %s", (name.lower(),))
    row = cursor.fetchone()
    cursor.fetchall()
    return row[0] if row else None

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
    cursor.close(); connect.close()
    
    if result:
        return {"found": True, "severity": result[0], "mechanism": result[1], "raw_text": result[2]}
    return {"found": False, "reason": "no known interaction in database"}

if __name__ == "__main__":
    a = input("Drug A: ")
    b = input("Drug B: ")
    print(check_interaction(a, b))
