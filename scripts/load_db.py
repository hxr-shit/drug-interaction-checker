import time
import requests
import sys
import os
sys.path.append(os.path.dirname(__file__))

from db import get_connection
from side_effects import extract_and_save_side_effects
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

def get_all_drugs():
    connect, cursor = get_connection()
    cursor.execute("SELECT id, name FROM drugs")
    rows = cursor.fetchall()
    cursor.close()
    connect.close()
    return rows

def bulk_load_zero_side_effects():
    connect, cursor = get_connection()
    cursor.execute("""
        SELECT d.id, d.name 
        FROM drugs d
        LEFT JOIN side_effects se ON d.id = se.drugs_id
        WHERE se.id IS NULL
    """)
    rows = cursor.fetchall()
    cursor.close()
    connect.close()
    
    print(f"Found {len(rows)} drugs with 0 side effects, processing with Groq...")
    success = 0
    failed = []
    
    for i, (drug_id, drug_name) in enumerate(rows):
        if i % 50 == 0:
            print(f"Progress: {i}/{len(rows)} ({success} success, {len(failed)} failed)")
        
        adverse_text = fetch_adverse_reactions(drug_name)
        if not adverse_text:
            failed.append(drug_name)
            time.sleep(0.3)
            continue
        
        try:
            extract_and_save_side_effects(drug_name, adverse_text, meddra_only=False)
            success += 1
        except Exception as e:
            print(f"Error for {drug_name}: {e}")
            failed.append(drug_name)
        
        time.sleep(0.3)
    
    print(f"\nDone. Success: {success}, Failed: {len(failed)}")

def bulk_load_failed():
    try:
        with open("data/failed_drugs.txt") as f:
            failed_names = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print("No failed_drugs.txt found")
        return
    
    print(f"Retrying {len(failed_names)} failed drugs...")
    success = 0
    still_failed = []
    
    for i, drug_name in enumerate(failed_names):
        if i % 50 == 0:
            print(f"Progress: {i}/{len(failed_names)}")
        
        adverse_text = fetch_adverse_reactions(drug_name)
        if not adverse_text:
            still_failed.append(drug_name)
            time.sleep(0.3)
            continue
        
        try:
            extract_and_save_side_effects(drug_name, adverse_text, meddra_only=False)
            success += 1
        except Exception as e:
            still_failed.append(drug_name)
        
        time.sleep(0.3)
    
    print(f"\nDone. Success: {success}, Still failed: {len(still_failed)}")
    
def already_has_side_effects(drug_id):
    connect, cursor = get_connection()
    cursor.execute(
        "SELECT COUNT(*) FROM side_effects WHERE drugs_id = %s", 
        (drug_id,)
    )
    count = cursor.fetchone()[0]
    cursor.close()
    connect.close()
    return count > 0

def fetch_adverse_reactions(drug_name):
    """Fetch from OpenFDA, return raw adverse_reactions text or None."""
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
        
        # pick best result — prefer one with drug_interactions populated
        best = None
        for result in data["results"]:
            if result.get("drug_interactions"):
                best = result
                break
        if best is None:
            best = data["results"][0]
        
        adverse = best.get("adverse_reactions", [""])[0]
        return adverse if adverse else None
    
    except Exception as e:
        return None

def bulk_load():
    drugs = get_all_drugs()
    total = len(drugs)
    success = 0
    skipped = 0
    failed = []

    print(f"Starting bulk load for {total} drugs...")

    for i, (drug_id, drug_name) in enumerate(drugs):
        # progress indicator
        if i % 50 == 0:
            print(f"Progress: {i}/{total} ({success} success, {len(failed)} failed)")
        
        # skip if already processed
        if already_has_side_effects(drug_id):
            skipped += 1
            continue
        
        adverse_text = fetch_adverse_reactions(drug_name)
        
        if not adverse_text:
            failed.append(drug_name)
            time.sleep(0.3)  # still rate limit even on failure
            continue
        
        try:
            extract_and_save_side_effects(drug_name, adverse_text, meddra_only=True)
            success += 1
        except Exception as e:
            print(f"Error saving side effects for {drug_name}: {e}")
            failed.append(drug_name)
        
        time.sleep(0.3)  # ~200 requests/min, safely under OpenFDA limit

    # write failures to log
    with open("data/failed_drugs.txt", "w") as f:
        for name in failed:
            f.write(name + "\n")

    print(f"\nDone. Success: {success}, Skipped: {skipped}, Failed: {len(failed)}")
    print(f"Failed drugs logged to data/failed_drugs.txt")

if __name__ == "__main__":
    print("Select mode:")
    print("1 - Full bulk load (MedDRA only, no Gemini/Groq)")
    print("2 - Fix drugs with 0 side effects (uses Groq)")
    print("3 - Retry failed drugs (uses Groq)")
    mode = input("Enter 1, 2 or 3: ").strip()
    
    if mode == "1":
        bulk_load()
    elif mode == "2":
        bulk_load_zero_side_effects()
    elif mode == "3":
        bulk_load_failed()
    else:
        print("Invalid mode")