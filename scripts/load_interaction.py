from db import get_connection

def get_or_create_drug_id(cursor, name):
    cursor.execute("SELECT id FROM drugs WHERE name = %s", (name.lower(),))
    row = cursor.fetchone()
    if row:
        return row[0]
    cursor.execute("INSERT IGNORE INTO drugs (name) VALUES (%s)", (name.lower(),))
    return get_or_create_drug_id(cursor, name)  # re-select after insert

def map_severity(level):
    level = level.strip().lower()
    if level in ("major",): return "high"
    if level in ("moderate",): return "moderate"
    if level in ("minor",): return "low"
    return "none"

def migrate():
    connect, cursor = get_connection()
    cursor.execute("SELECT drug_a, drug_b, level FROM ddinter_raw")
    rows = cursor.fetchall()
    for drug_a, drug_b, level in rows:
        id_a = get_or_create_drug_id(cursor, drug_a)
        id_b = get_or_create_drug_id(cursor, drug_b)
        if id_a == id_b:
            continue  # skip self-pairs, your schema has a CHECK constraint against this
        severity = map_severity(level)
        #print(id_a, id_b, severity, level)
        cursor.execute(
            "INSERT IGNORE INTO interactions (drug_a_id, drug_b_id, severity, raw_text) VALUES (%s, %s, %s, %s)",
            (id_a, id_b, severity, level)
        )
    connect.commit()
    cursor.close()
    connect.close()

if __name__ == "__main__":
    migrate()