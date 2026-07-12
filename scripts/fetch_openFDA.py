import sys
import requests
from db import get_connection
from normalize import normalize
from side_effects import extract_and_save_side_effects
def fetch_drug_label(drug_name, attempt=1, max_attempts=3):
    if attempt > max_attempts:
        print(f"Max attempts reached for drug: {drug_name}")
        return None

    connect, cursor= get_connection()

    url= "https://api.fda.gov/drug/label.json"
    #https://api.fda.gov/drug/label.json?search=openfda.generic_name:"warfarin"&limit=1

    params= {
        "search": f'openfda.generic_name:"{drug_name}"',
        "limit": 5
    }
    response= requests.get(url, params= params)

    if response.status_code == 404:
        normalized_name = normalize(drug_name)
        
        if not normalized_name:
            print("No normalized name found for", drug_name)
            return None
        if normalized_name.lower() == drug_name.lower():
            print(f"Normalized name same as before: {normalized_name}")
            return None
        
        if " + " in normalized_name:
            components= [c.strip() for c in normalized_name.split(" + ")]
            print(f"Multiple components found: {components}")
            results=[]
            for component in components:
                result= fetch_drug_label(component, attempt= attempt +1, max_attempts= max_attempts)
                results.append(result)
            return results
        else:
            return fetch_drug_label(normalized_name, attempt=attempt + 1, max_attempts=max_attempts)

    

    if response.status_code != 200:
        print("API error:", response.status_code, response.text)
        sys.exit(1)

    data= response.json()

    if "results" not in data or not data["results"]:
        print("No drug results found for", drug_name)
        normalized_name= normalize(drug_name)
        if normalized_name:
            print(f"Normalized name found: {normalized_name}")
            return fetch_drug_label(normalized_name)
        else:
            print("No normalized name found for", drug_name)
            return None
    
    best_result= None
    for result in data["results"]:
        interactions = result.get("drug_interactions")
        if interactions is not None and len(interactions) > 0:
            best_result = result
            break
    
    if best_result is None:
        best_result = data["results"][0]
    print(f"Drug Name: {drug_name} (Result found: {best_result is not None})")
    print("Brand name:", best_result.get("openfda", {}).get("brand_name", ["N/A"])[0])
    print("Generic name:", best_result.get("openfda", {}).get("generic_name", ["N/A"])[0])
    print("Purpose:", best_result.get("purpose", ["N/A"])[0])
    print("Warnings:", best_result.get("warnings", ["N/A"])[0])
    print("Drug Interactions:", best_result.get("drug_interactions", ["N/A"])[0])
    print("Adverse Reactions:", best_result.get("adverse_reactions", ["N/A"])[0])
    adverse_text = best_result.get("adverse_reactions", [""])[0]
    if adverse_text:
        extract_and_save_side_effects(drug_name, adverse_text)
    

    cursor.execute(
        "INSERT IGNORE INTO drugs (name) VALUES (%s)",
        (drug_name,)
    )
    print(best_result.keys())

    connect.commit()
    cursor.close()
    connect.close()

if __name__== "__main__":
    drug= input("Enter the drug name: ")
    fetch_drug_label(drug)
