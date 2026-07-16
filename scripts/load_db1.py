import time
import requests
import sys
import os
sys.path.append(os.path.dirname(__file__))

from db import get_connection
from side_effects import extract_and_save_side_effects
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

CHECKPOINT_EVERY = 100  # write failed list to disk every N drugs processed


# ---------------------------------------------------------------------
# Checkpoint helpers — shared by all three modes
# ---------------------------------------------------------------------

def load_failed_set(path):
    """Read a failed-drugs file into a lowercased set for fast skip-checks.
    Returns empty set if the file doesn't exist yet."""
    if not os.path.exists(path):
        return set()
    with open(path) as f:
        return {line.strip().lower() for line in f if line.strip()}

def save_failed_list(path, failed_names):
    """Overwrite the failed file with the current (deduped) full list.
    Called periodically mid-run, not just at the end, so a crash or
    quota exhaustion doesn't lose everything since the last write."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        for name in sorted(set(failed_names)):
            f.write(name + "\n")


# ---------------------------------------------------------------------

def get_all_drugs():
    connect, cursor = get_connection()
    cursor.execute("SELECT id, name FROM drugs")
    rows = cursor.fetchall()
    cursor.close()
    connect.close()
    return rows

def bulk_load_zero_side_effects():
    failed_path = "data/failed_zero_side_effects.txt"
    already_failed = load_failed_set(failed_path)

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

    # skip anything we already know failed on a previous run
    before = len(rows)
    rows = [(drug_id, name) for (drug_id, name) in rows if name.lower() not in already_failed]
    skipped_known_failed = before - len(rows)

    print(f"Found {before} drugs with 0 side effects "
          f"({skipped_known_failed} already known-failed, skipping; {len(rows)} to attempt), processing with Groq...")

    success = 0
    failed = []

    for i, (drug_id, drug_name) in enumerate(rows):
        if i % 50 == 0:
            print(f"Progress: {i}/{len(rows)} ({success} success, {len(failed)} failed)")

        # periodic checkpoint so a mid-run crash/quota-exhaustion doesn't lose the list
        if i > 0 and i % CHECKPOINT_EVERY == 0:
            save_failed_list(failed_path, list(already_failed) + failed)
            print(f"  [checkpoint] saved {len(failed)} new failures to {failed_path}")

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

    # final save
    save_failed_list(failed_path, list(already_failed) + failed)
    print(f"\nDone. Success: {success}, Failed: {len(failed)}")
    print(f"Failed drugs logged to {failed_path}")

def bulk_load_failed():
    failed_path = "data/failed_drugs.txt"
    still_failed_path = "data/still_failed.txt"

    try:
        with open(failed_path) as f:
            failed_names = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print(f"No {failed_path} found")
        return

    print(f"Retrying {len(failed_names)} failed drugs...")
    success = 0
    still_failed = []

    for i, drug_name in enumerate(failed_names):
        if i % 50 == 0:
            print(f"Progress: {i}/{len(failed_names)}")

        if i > 0 and i % CHECKPOINT_EVERY == 0:
            save_failed_list(still_failed_path, still_failed)
            print(f"  [checkpoint] saved {len(still_failed)} still-failing to {still_failed_path}")

        adverse_text = fetch_adverse_reactions(drug_name)
        if not adverse_text:
            still_failed.append(drug_name)
            time.sleep(0.3)
            continue

        try:
            extract_and_save_side_effects(drug_name, adverse_text, meddra_only=False)
            success += 1
        except Exception as e:
            print(f"Error for {drug_name}: {e}")
            still_failed.append(drug_name)

        time.sleep(0.3)

    save_failed_list(still_failed_path, still_failed)
    print(f"\nDone. Success: {success}, Still failed: {len(still_failed)}")
    print(f"Still-failing drugs logged to {still_failed_path}")

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
            print(f"  [OpenFDA] {drug_name}: HTTP {response.status_code} - {response.text[:150]}")
            return None
        data = response.json()
        if "results" not in data or not data["results"]:
            print(f"  [OpenFDA] {drug_name}: no results for generic_name match")
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
        if not adverse:
            print(f"  [OpenFDA] {drug_name}: matched but no adverse_reactions field")
        return adverse if adverse else None
    
    except Exception as e:
        print(f"  [OpenFDA] {drug_name}: EXCEPTION {type(e).__name__}: {e}")
        return None

def bulk_load():
    failed_path = "data/failed_drugs.txt"
    already_failed = load_failed_set(failed_path)

    drugs = get_all_drugs()

    before = len(drugs)
    drugs = [(drug_id, name) for (drug_id, name) in drugs if name.lower() not in already_failed]
    skipped_known_failed = before - len(drugs)

    total = len(drugs)
    success = 0
    skipped = 0
    failed = []

    print(f"Starting bulk load for {total} drugs "
          f"({skipped_known_failed} already known-failed, skipping)...")

    for i, (drug_id, drug_name) in enumerate(drugs):
        # progress indicator
        if i % 50 == 0:
            print(f"Progress: {i}/{total} ({success} success, {len(failed)} failed)")

        # periodic checkpoint
        if i > 0 and i % CHECKPOINT_EVERY == 0:
            save_failed_list(failed_path, list(already_failed) + failed)
            print(f"  [checkpoint] saved {len(failed)} new failures to {failed_path}")

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

    # final save — cumulative with whatever was already known-failed
    save_failed_list(failed_path, list(already_failed) + failed)

    print(f"\nDone. Success: {success}, Skipped: {skipped}, Failed: {len(failed)}")
    print(f"Failed drugs logged to {failed_path}")

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