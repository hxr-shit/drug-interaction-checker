import requests
import os
from db import get_connection

#drug= input("Enter the drug name: ")
def check_db(drug_name):
    connect, cursor= get_connection()
    cursor.execute(
        "SELECT generic_name FROM brand_mapping WHERE brand_name= %s",
        (drug_name.lower(),)
    )

    result= cursor.fetchone()
    cursor.close()
    connect.close()

    if result:
        return result[0]
    return None

def save_mapping(brand_name, generic_name, source):
    connect, cursor= get_connection()
    cursor.execute(
        "INSERT IGNORE INTO brand_mapping (brand_name, generic_name, source) VALUES (%s, %s, %s)",
        (brand_name.lower(), generic_name.lower(), source)
    )
    connect.commit()
    cursor.close()
    connect.close()

def gemini_extract(drug_name, snippet):
    from google import genai

    # reads GEMINI_API_KEY from env automatically
    client= genai.Client(api_key= os.getenv("GEMINI_API_KEY"))
    prompt = f"""Based on this search result text about the medicine "{drug_name}":

{snippet}

What is the generic/scientific name of the active ingredient(s) in this medicine?
Respond with ONLY the generic name(s), nothing else.
If multiple active ingredients, separate with " + " (e.g. "Paracetamol + Caffeine").
If the text is not about a real medicine, or doesn't clearly state the composition, respond with exactly: UNKNOWN"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents= prompt
    )
    
    result = response.text.strip()
    return None if result == "UNKNOWN" else result

def web_scrape(drug_name):
#01df487768b07aacec318c29c7ee0762b4db6e7d
    url= "https://google.serper.dev/search"
    headers= {
        "X-API-KEY": os.getenv("SERPER_API_KEY"),
        "Content-Type": "application/json"
    }

    payload= {
        "q": f"{drug_name} generic name composition"
    }
    response= requests.post(url, headers= headers, json= payload)
    data= response.json()
    print("DEBUG - full response:", data)   # ADD THIS
    print("DEBUG - API key loaded:", os.getenv("SERPER_API_KEY"))

    if "answerBox" in data and "snippet" in data["answerBox"]:
        snippet= data["answerBox"]["snippet"]
    else:
        snippet= " ".join([r.get("snippet", "") for r in data.get("organic", [])[:3]])
    print("DEBUG - snippet:", snippet)   # ADD THIS

    if not snippet:
        return None
    generic_name= gemini_extract(drug_name, snippet)
    print("DEBUG - gemini result:", generic_name)   # ADD THIS

    return generic_name

def normalize(drug_name):
    result= check_db(drug_name)
    if result:
        return result
    
    result= web_scrape(drug_name)
    if result:
        save_mapping(drug_name, result, "web_scrape")
        return result
    return None
