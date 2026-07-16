import os
import time
from groq import Groq

_client = None

def get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=os.environ["GROQ_API_KEY"])
    return _client
#llama-3.3-70b-versatile
#llama-3.1-8b-instant
def groq_complete(prompt, model="llama-3.1-8b-instant", max_tokens=512, temperature=0, retries=2):
    """Simple wrapper with basic 429 backoff for the bulk run."""
    client = get_client()
    for attempt in range(retries + 1):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return response.choices[0].message.content
        except Exception as e:
            if "rate_limit" in str(e).lower() and attempt < retries:
                time.sleep(3 * (attempt + 1))
                continue
            raise