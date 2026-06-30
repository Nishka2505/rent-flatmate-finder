import os
import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("EMAIL_API_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM", "onboarding@resend.dev")


def send_interest_notification_email(owner_email: str, listing, tenant_profile, score: float):
    if not resend.api_key:
        print(f"[EMAIL SKIPPED - no API key] Would notify {owner_email} (score: {score})")
        return
    try:
        resend.Emails.send({
            "from": EMAIL_FROM,
            "to": owner_email,
            "subject": f"High-compatibility interest in your listing ({score:.0f}% match)",
            "html": f"""
                <h2>You have a new high-compatibility interest!</h2>
                <p>A tenant with a <strong>{score:.0f}% compatibility score</strong> has expressed interest in your listing at <strong>{listing.location}</strong> (₹{listing.rent}/month).</p>
                <p>Tenant's preferred location: {tenant_profile.preferred_location}<br>
                Budget range: ₹{tenant_profile.budget_min} - ₹{tenant_profile.budget_max}</p>
                <p>Log in to your dashboard to accept or decline this request.</p>
            """
        })
    except Exception as e:
        print(f"[EMAIL FAILED] {e}")


def send_status_update_email(tenant_email: str, listing, status: str):
    if not resend.api_key:
        print(f"[EMAIL SKIPPED - no API key] Would notify {tenant_email} (status: {status})")
        return
    try:
        resend.Emails.send({
            "from": EMAIL_FROM,
            "to": tenant_email,
            "subject": f"Your interest request was {status}",
            "html": f"""
                <h2>Update on your room interest</h2>
                <p>Your interest in the listing at <strong>{listing.location}</strong> (₹{listing.rent}/month) was <strong>{status}</strong> by the owner.</p>
                {'<p>You can now chat with the owner in real time via your dashboard!</p>' if status == 'accepted' else ''}
            """
        })
    except Exception as e:
        print(f"[EMAIL FAILED] {e}")