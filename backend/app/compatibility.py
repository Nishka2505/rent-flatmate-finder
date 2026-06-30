import os
import json
from groq import Groq
from app import models

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


def rule_based_score(tenant: models.TenantProfile, listing: models.RoomListing) -> dict:
    """Fallback scoring when LLM is unavailable."""
    score = 0

    # Location match (case-insensitive substring match) — worth 50 points
    if tenant.preferred_location.lower() in listing.location.lower() or \
       listing.location.lower() in tenant.preferred_location.lower():
        score += 50

    # Budget match — worth 50 points
    if tenant.budget_min <= listing.rent <= tenant.budget_max:
        score += 50
    elif listing.rent < tenant.budget_min:
        # cheaper than budget, still decent
        score += 30
    else:
        # over budget — partial credit if not too far off
        overage_ratio = (listing.rent - tenant.budget_max) / tenant.budget_max
        if overage_ratio <= 0.2:
            score += 15

    explanation = (
        f"Rule-based score: location {'matches' if score >= 50 else 'does not match'} "
        f"preference, rent ₹{listing.rent} vs budget ₹{tenant.budget_min}-{tenant.budget_max}."
    )

    return {"score": score, "explanation": explanation}


def llm_compatibility_score(tenant: models.TenantProfile, listing: models.RoomListing) -> dict:
    """Use Groq LLM to compute compatibility score. Falls back to rule-based on any failure."""
    if not client:
        return rule_based_score(tenant, listing)

    tenant_info = {
        "preferred_location": tenant.preferred_location,
        "budget_min": tenant.budget_min,
        "budget_max": tenant.budget_max,
        "move_in_date": str(tenant.move_in_date),
    }
    listing_info = {
        "location": listing.location,
        "rent": listing.rent,
        "available_from": str(listing.available_from),
        "room_type": listing.room_type,
        "furnishing_status": listing.furnishing_status,
    }

    prompt = (
        f"Given this room listing: {json.dumps(listing_info)} "
        f"and this tenant profile: {json.dumps(tenant_info)}, "
        f"compute a compatibility score from 0 to 100 based on budget and location match. "
        f"Return ONLY valid JSON in this exact format with no other text: "
        f'{{"score": number, "explanation": string}}'
    )

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=200,
        )
        content = response.choices[0].message.content.strip()

        # Strip markdown code fences if the model wraps JSON in ```json ... ```
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        result = json.loads(content)
        score = float(result["score"])
        explanation = str(result["explanation"])

        # Clamp score to valid range
        score = max(0, min(100, score))

        return {"score": score, "explanation": explanation}

    except Exception as e:
        print(f"Groq LLM scoring failed, falling back to rule-based: {e}")
        return rule_based_score(tenant, listing)