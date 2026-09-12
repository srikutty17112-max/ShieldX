import re
from typing import Dict, Any, Optional, Tuple, List
from datetime import datetime

# Short-term in-memory conversation context per user
# user_id -> {"last_incident_id": int, "last_action": str, "turn_count": int, "history": list}
CONVERSATION_CONTEXT: Dict[int, Dict[str, Any]] = {}

STRESS_KEYWORDS = [
    "urgent", "panic", "emergency", "help", "hurry", "scared", "attacked", "hacked",
    "quick", "fast", "danger", "immediately", "oh no", "what happened", "stop it"
]

APPROVE_KEYWORDS = [
    "approve", "accept", "yes", "isolate", "block", "proceed", "authorize", "execute",
    "do it", "confirm", "take action", "हाँ", "स्वीकार", "சரி", "அங்கீகரி"
]

REJECT_KEYWORDS = [
    "reject", "deny", "no", "dismiss", "ignore", "cancel", "don't", "false alarm",
    "नहीं", "खारिज", "இல்லை", "நிராகரி"
]

STOP_KEYWORDS = [
    "stop", "halt", "emergency stop", "freeze", "kill", "shut down", "block immediately",
    "रुकें", "बंद करो", "நிறுத்து"
]

BRIEFING_KEYWORDS = [
    "briefing", "summary", "report", "what happened", "status", "overview", "daily update",
    "weekly update", "security report", "संक्षेप", "விளக்கம்"
]

class VoiceService:
    """
    Aegis Voice Engine powering:
    1. Multi-language processing (English, Tamil, Hindi)
    2. Proactive spoken alerts
    3. Daily/weekly spoken briefings
    4. Context-aware short-term follow-up memory
    5. Emergency voice override validation
    6. Sentiment-aware tone calming
    """

    @staticmethod
    def get_user_context(user_id: int) -> Dict[str, Any]:
        if user_id not in CONVERSATION_CONTEXT:
            CONVERSATION_CONTEXT[user_id] = {
                "last_incident_id": None,
                "last_action": None,
                "history": []
            }
        return CONVERSATION_CONTEXT[user_id]

    @staticmethod
    def detect_sentiment_urgency(text: str) -> bool:
        lower = text.lower()
        if "!" in text:
            return True
        return any(k in lower for k in STRESS_KEYWORDS)

    @staticmethod
    def parse_voice_command(
        transcript: str,
        user_id: int,
        active_incident_id: Optional[int] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        context = VoiceService.get_user_context(user_id)
        lower = transcript.strip().lower()
        is_stressed = VoiceService.detect_sentiment_urgency(transcript)

        # Context resolution: use explicitly passed incident_id or previous context
        target_incident_id = active_incident_id or context.get("last_incident_id")

        detected_action = None
        reply_text = ""
        spoken_text = ""
        action_taken = None

        # 1. Emergency Voice Override
        if any(k in lower for k in STOP_KEYWORDS):
            detected_action = "EMERGENCY_STOP"
            action_taken = "CONTAIN_ALL"
            if language == "hi":
                reply_text = "आपातकालीन ओवरराइड सक्रिय! सभी नेटवर्क कनेक्शन ब्लॉक कर दिए गए हैं और डिवाइस को सुरक्षित कर दिया गया है।"
            elif language == "ta":
                reply_text = "அவசரகால மேலெழுதல் செயல்படுத்தப்பட்டது! அனைத்து நெட்வொர்க் இணைப்புகளும் உடனடியாக முடக்கப்பட்டுள்ளன."
            else:
                reply_text = "EMERGENCY OVERRIDE ACTIVATED. Immediate defensive freeze executed. All outbound traffic halted and endpoints isolated."
            spoken_text = reply_text

        # 2. Approve Command
        elif any(k in lower for k in APPROVE_KEYWORDS):
            detected_action = "APPROVE"
            action_taken = "ISOLATE_AND_BLOCK"
            if language == "hi":
                reply_text = f"स्वीकृत। घटना {target_incident_id or ''} के लिए सुरक्षात्मक प्रतिक्रिया शुरू की जा रही है।"
            elif language == "ta":
                reply_text = f"அங்கீகரிக்கப்பட்டது. சம்பவம் {target_incident_id or ''} க்கான பாதுகாப்பு நடவடிக்கை செயல்படுத்தப்படுகிறது."
            else:
                prefix = "Understood, stay calm. " if is_stressed else "Voice authorization confirmed. "
                reply_text = f"{prefix}Executing containment protocol for incident #{target_incident_id or 'active'}. Endpoint isolated."
            spoken_text = reply_text

        # 3. Reject Command
        elif any(k in lower for k in REJECT_KEYWORDS):
            detected_action = "REJECT"
            action_taken = "DISMISSED"
            if language == "hi":
                reply_text = f"अलर्ट खारिज कर दिया गया। घटना {target_incident_id or ''} को बंद कर दिया गया है।"
            elif language == "ta":
                reply_text = f"எச்சரிக்கை நிராகரிக்கப்பட்டது. சம்பவம் {target_incident_id or ''} மூடப்பட்டது."
            else:
                reply_text = f"Incident #{target_incident_id or 'active'} dismissed by voice. Standing down alert."
            spoken_text = reply_text

        # 4. Spoken Briefing Command
        elif any(k in lower for k in BRIEFING_KEYWORDS):
            detected_action = "BRIEFING"
            if language == "hi":
                reply_text = "शील्डएक्स सुरक्षा स्थिति: सक्रिय निगरानी चालू है। सभी प्रणालियाँ नियंत्रण में हैं।"
            elif language == "ta":
                reply_text = "ShieldX பாதுகாப்பு நிலை: நேரடி கண்காணிப்பு செயலில் உள்ளது. அனைத்து அமைப்புகளும் கட்டுப்பாட்டில் உள்ளன."
            else:
                reply_text = "Aegis Command Briefing: All monitoring agents operational. Live detection telemetry active."
            spoken_text = reply_text

        # 5. Follow-up Context Questions (e.g., "What was the IP?", "Why is this critical?", "What device?")
        elif "ip" in lower or "address" in lower:
            detected_action = "QUERY"
            reply_text = f"The source IP involved in incident #{target_incident_id or 'active'} is recorded in telemetry and pinned on your tactical map."
            spoken_text = reply_text

        elif "why" in lower or "explain" in lower:
            detected_action = "QUERY"
            reply_text = f"This incident flagged suspicious patterns matching MITRE attack vectors. The risk requires containment approval."
            spoken_text = reply_text

        else:
            detected_action = "QUERY"
            calm_intro = "I am with you. " if is_stressed else "Aegis listening. "
            if language == "hi":
                reply_text = f"{calm_intro}कमांड प्राप्त हुआ: '{transcript}'. आप अनुमोदन, अस्वीकृति या आपातकालीन स्टॉप कह सकते हैं।"
            elif language == "ta":
                reply_text = f"{calm_intro}கட்டளை பெறப்பட்டது: '{transcript}'. நீங்கள் அங்கீகரிக்கலாம் அல்லது நிராகரிக்கலாம்."
            else:
                reply_text = f"{calm_intro}Heard: '{transcript}'. You can say 'Approve', 'Reject', 'Briefing', or 'Emergency Stop'."
            spoken_text = reply_text

        # Update context
        if target_incident_id:
            context["last_incident_id"] = target_incident_id
        context["last_action"] = detected_action
        context["history"].append({"user": transcript, "aegis": reply_text, "timestamp": datetime.utcnow().isoformat()})
        if len(context["history"]) > 10:
            context["history"] = context["history"][-10:]

        return {
            "reply_text": reply_text,
            "spoken_text": spoken_text,
            "language": language,
            "detected_action": detected_action,
            "incident_id": target_incident_id,
            "sentiment_urgency": is_stressed,
            "action_taken": action_taken
        }

    @staticmethod
    def format_proactive_alert(incident: Any, language: str = "en") -> str:
        """Generates unprompted spoken alert for high/critical threats."""
        sev = incident.severity.upper()
        title = incident.title
        rec = incident.recommended_action or "Isolate Host"

        if language == "hi":
            return f"चेतावनी! {sev} गंभीरता का खतरा पहचाना गया: {title}। क्या आप '{rec}' को मंजूरी देना चाहते हैं? कहें 'हाँ' या 'नहीं'।"
        elif language == "ta":
            return f"எச்சரிக்கை! {sev} தீவிர அச்சுறுத்தல் கண்டறியப்பட்டது: {title}। '{rec}' நடவடிக்கையை அங்கீகரிக்கவா? 'சரி' அல்லது 'இல்லை' என்று சொல்லுங்கள்."
        else:
            return f"Alert. {sev} threat detected: {title}. Recommended containment action is {rec}. Say APPROVE to execute or REJECT to dismiss."

    @staticmethod
    def format_briefing(total_events: int, flagged: int, blocked: int, active_devices: int, language: str = "en") -> str:
        """Spoken daily summary briefing."""
        if language == "hi":
            return f"दैनिक सुरक्षा रिपोर्ट: पिछले 24 घंटों में ShieldX ने {active_devices} सक्रिय उपकरणों की निगरानी की, {flagged} खतरों को चिह्नित किया, और {blocked} हमलों को सफलतापूर्वक रोका।"
        elif language == "ta":
            return f"ShieldX தினசரி பாதுகாப்பு சுருக்கம்: கடந்த 24 மணிநேரத்தில் {active_devices} சாதனங்கள் கண்காணிக்கப்பட்டன, {flagged} அச்சுறுத்தல்கள் கண்டறியப்பட்டு {blocked} தாக்குதல்கள் தடுக்கப்பட்டன."
        else:
            return f"Daily Security Briefing: In the last 24 hours, ShieldX monitored {active_devices} connected devices, flagged {flagged} security events, and successfully neutralized {blocked} confirmed threats. Defense status is optimal."
