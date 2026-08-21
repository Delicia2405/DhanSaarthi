import requests
from flask import current_app


def get_recommendations(profile):
    url, key = current_app.config.get("AI_API_URL"), current_app.config.get("AI_API_KEY")
    if not url or not key:
        return ["Add more transactions to receive personalized recommendations."]
    response = requests.post(url, headers={"Authorization": f"Bearer {key}"}, json={"prompt": f"Give three concise financial recommendations for: {profile}"}, timeout=15)
    response.raise_for_status()
    data = response.json()
    return data.get("recommendations", data.get("choices", []))
