import logging
import urllib.parse
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("rekishi.twilio")

class TwilioService:
    """
    Twilio Telephony & Voice Assistant Service for Case-Based Witness Coordination.
    - Automated telephone dispatch for witness/contact follow-up
    - TwiML generation using male voice ('man' / 'Polly.Matthew')
    - Interactive DTMF Gather callback handler (Press 1 for Callback, Press 2 for Unavailable)
    - Resilient simulation mode when API credentials are pending configuration
    """

    def __init__(self):
        self.account_sid = settings.TWILIO_ACCOUNT_SID
        self.auth_token = settings.TWILIO_AUTH_TOKEN
        self.from_number = settings.TWILIO_PHONE_NUMBER
        self.base_url = settings.TWILIO_WEBHOOK_BASE_URL.rstrip("/")
        self._client = None

    def is_configured(self) -> bool:
        return bool(self.account_sid and self.auth_token and self.from_number)

    def get_client(self):
        if not self.is_configured():
            return None
        if not self._client:
            try:
                from twilio.rest import Client
                self._client = Client(self.account_sid, self.auth_token)
            except Exception as e:
                logger.error(f"[Twilio] Failed to initialize client: {e}")
                return None
        return self._client

    def generate_initial_twiml(self, contact_name: str, contact_id: str, case_id: str) -> str:
        """
        Generates court-compliant TwiML greeting using male voice:
        1. Identifies as Rekishi Forensics automated case coordination assistant
        2. Inquires availability of contact without disclosing sensitive details
        3. Prompts user for callback or appointment slot via DTMF keypad
        """
        clean_name = contact_name or "Citizen"
        callback_url = f"{self.base_url}/api/twilio/gather-callback?contact_id={urllib.parse.quote(contact_id)}&case_id={urllib.parse.quote(case_id)}"
        
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="man" language="en-IN">
        Hello. This is the automated investigation coordination assistant from Rekishi Forensics. Am I speaking with {clean_name}?
    </Say>
    <Pause length="1"/>
    <Gather numDigits="1" action="{callback_url}" method="POST" timeout="10">
        <Say voice="man" language="en-IN">
            An official traffic accident investigator wishes to schedule a brief follow-up regarding an incident coordination report.
            To request an investigator callback or schedule an appointment slot, press 1.
            If you are currently busy or unavailable, press 2.
        </Say>
    </Gather>
    <Say voice="man" language="en-IN">
        We did not receive your input. An investigator will follow up with you at a later time. Thank you, goodbye.
    </Say>
</Response>"""
        return twiml

    def generate_gather_twiml(self, digit: str) -> str:
        """
        Generates dynamic response according to DTMF key pressed by contact.
        """
        if digit == "1":
            twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="man" language="en-IN">
        Thank you. Your request for an investigator callback has been logged in the official case dossier. An authorized officer will contact you during preferred hours. Goodbye.
    </Say>
    <Hangup/>
</Response>"""
        elif digit == "2":
            twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="man" language="en-IN">
        Thank you for letting us know. We have noted that you are currently unavailable and will attempt contact at another time. Goodbye.
    </Say>
    <Hangup/>
</Response>"""
        else:
            twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="man" language="en-IN">
        Invalid selection received. An investigator will follow up with you directly. Thank you, goodbye.
    </Say>
    <Hangup/>
</Response>"""
        return twiml

    def initiate_call(
        self,
        contact_id: str,
        case_id: str,
        to_number: str,
        contact_name: str,
        host_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Triggers cellular network call via Twilio Voice API.
        If Twilio credentials are not yet entered, runs realistic simulation.
        """
        client = self.get_client()
        base_url = (host_override or self.base_url).rstrip("/")
        voice_url = f"{base_url}/api/twilio/voice-webhook?contact_id={urllib.parse.quote(contact_id)}&case_id={urllib.parse.quote(case_id)}&name={urllib.parse.quote(contact_name)}"
        status_url = f"{base_url}/api/twilio/status-callback?contact_id={urllib.parse.quote(contact_id)}&case_id={urllib.parse.quote(case_id)}"

        if not client or not self.from_number:
            logger.info(f"[Twilio] Credentials not active in backend/.env. Executing realistic simulation call to {to_number} for {contact_name}.")
            return {
                "success": True,
                "mode": "simulated",
                "contactId": contact_id,
                "caseId": case_id,
                "toNumber": to_number,
                "contactName": contact_name,
                "callSid": f"SIM_CA{contact_id[-6:]}_{case_id[-4:]}",
                "status": "queued",
                "voice": "man (en-IN)",
                "webhookUrl": voice_url,
                "message": (
                    f"Automated voice call simulated for {contact_name} ({to_number}). "
                    f"To dispatch live cellular network calls, add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, "
                    f"and TWILIO_PHONE_NUMBER into backend/.env."
                )
            }

        try:
            # Normalize telephone format
            clean_to = to_number.strip().replace(" ", "").replace("-", "")
            if not clean_to.startswith("+"):
                clean_to = f"+91{clean_to}" if len(clean_to) == 10 else f"+{clean_to}"

            call = client.calls.create(
                to=clean_to,
                from_=self.from_number,
                url=voice_url,
                status_callback=status_url,
                status_callback_event=["initiated", "ringing", "answered", "completed"],
                status_callback_method="POST"
            )

            logger.info(f"[Twilio] Live call dispatched successfully! Call SID: {call.sid}")
            return {
                "success": True,
                "mode": "live",
                "contactId": contact_id,
                "caseId": case_id,
                "toNumber": clean_to,
                "fromNumber": self.from_number,
                "callSid": call.sid,
                "status": call.status,
                "voice": "man (en-IN)",
                "webhookUrl": voice_url,
                "message": f"Twilio voice call dispatched to {clean_to}. Call SID: {call.sid}."
            }
        except Exception as e:
            logger.error(f"[Twilio] Failed to dispatch live call to {to_number}: {e}")
            return {
                "success": False,
                "mode": "error",
                "error": str(e),
                "message": f"Twilio dispatch error: {e}. Check number formatting (+91...) or verify verified caller ID."
            }

twilio_service = TwilioService()
