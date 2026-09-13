import os
import logging
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("shieldx.gemini")

# Fallback explanations for offline / demo mode
OFFLINE_EXPLANATIONS = {
    "BRUTE_FORCE": {
        "en": "ShieldX detected repeated authentication failures targeting your system. An attacker or automated credential stuffer is attempting password combinations to gain unauthorized access.",
        "hi": "ShieldX ने आपके सिस्टम को लक्षित करने वाले बार-बार प्रमाणीकरण विफलताओं का पता लगाया। कोई हमलावर या बॉट अनधिकृत पहुंच प्राप्त करने के लिए पासवर्ड संयोजनों का प्रयास कर रहा है।",
        "ta": "உங்கள் கணினியை இலக்காகக் கொண்டு மீண்டும் மீண்டும் அங்கீகார தோல்விகளை ShieldX கண்டறிந்துள்ளது. அங்கீகரிக்கப்படாத அணுகலைப் பெற கடவுச்சொல் சேர்க்கைகளை ஒரு தாக்குபவர் முயற்சிக்கிறார்."
    },
    "PORT_SCAN": {
        "en": "A reconnaissance scan probed multiple service ports on your network. The remote entity is seeking exposed entry points or unpatched software before launching an exploit.",
        "hi": "एक टोही स्कैन ने आपके नेटवर्क पर कई सर्विस पोर्ट की जांच की। रिमोट इकाई किसी शोषण को शुरू करने से पहले खुले प्रवेश बिंदुओं की तलाश कर रही है।",
        "ta": "ஒரு உளவு ஸ்கேன் உங்கள் நெட்வொர்க்கில் உள்ள பல போர்ட்களை ஆய்வு செய்தது. சுரண்டலைத் தொடங்குவதற்கு முன் வெளிப்படும் நுழைவுப் புள்ளிகளை அது தேடுகிறது."
    },
    "DATA_EXFILTRATION": {
        "en": "An unusually large volume of data was streamed to an unclassified external endpoint. This pattern strongly indicates unauthorized data exfiltration or credential leakage.",
        "hi": "एक अज्ञात बाहरी एंडपॉइंट पर असामान्य रूप से बड़ी मात्रा में डेटा भेजा गया। यह अनधिकृत डेटा चोरी या लीक का स्पष्ट संकेत देता है।",
        "ta": "வகைப்படுத்தப்படாத வெளிப்புற முனையத்திற்கு வழக்கத்திற்கு மாறாக அதிக அளவு தரவு அனுப்பப்பட்டது. இது அங்கீகரிக்கப்படாத தரவு திருட்டை தெளிவாகக் குறிக்கிறது."
    },
    "RANSOMWARE": {
        "en": "CRITICAL: Suspicious commands executed attempting to delete Volume Shadow Copies and alter files en masse. This matches the known signature of impending ransomware encryption.",
        "hi": "गंभीर चेतावनी: वॉल्यूम शैडो कॉपीज को हटाने और फाइलों को बड़े पैमाने पर बदलने के संदिग्ध कमांड निष्पादित किए गए। यह रैनसमवेयर एन्क्रिप्शन का स्पष्ट संकेत है।",
        "ta": "முக்கிய எச்சரிக்கை: வால்யூம் ஷேடோ நகல்களை நீக்கவும் கோப்புகளை பெருமளவில் மாற்றவும் சந்தேகத்திற்கிடமான கட்டளைகள் இயக்கப்பட்டன. இது ரான்சம்வேர் குறியாக்கத்துடன் பொருந்துகிறது."
    },
    "ANOMALY": {
        "en": "ShieldX machine baseline detected an unclassified statistical anomaly. Your device is establishing connections at an intensity more than 3 standard deviations above its historical baseline.",
        "hi": "ShieldX मशीन बेसलाइन ने एक अनिर्धारित विसंगति का पता लगाया। आपका डिवाइस सामान्य बेसलाइन से 3 गुना अधिक तीव्रता से कनेक्शन स्थापित कर रहा है।",
        "ta": "ShieldX மெஷின் பேஸ்லைன் வகைப்படுத்தப்படாத புள்ளியியல் முரண்பாட்டைக் கண்டறிந்துள்ளது. உங்கள் சாதனம் வரலாற்று அளவை விட 3 மடங்கு அதிக தீவிரத்தில் இணைப்புகளை நிறுவுகிறது."
    },
    "BENIGN": {
        "en": "Routine system telemetry verified. No unauthorized activity, malicious payloads, or anomalous connection spikes were identified.",
        "hi": "नियमित सिस्टम टेलीमेट्री सत्यापित। कोई अनधिकृत गतिविधि या दुर्भावनापूर्ण पेलोड नहीं पाया गया।",
        "ta": "வழக்கமான சிஸ்டம் டெலிமெட்ரி சரிபார்க்கப்பட்டது. அங்கீகரிக்கப்படாத செயல்பாடு எதுவும் கண்டறியப்படவில்லை."
    }
}

async def generate_threat_explanation(
    threat_type: str,
    title: str,
    description: str,
    mitre_info: Dict[str, Any],
    language: str = "en"
) -> str:
    """
    Generate an AI-powered plain-language explanation using Google Gemini.
    Falls back gracefully to offline explanation engine if GEMINI_API_KEY is not configured.
    """
    lang = language if language in ["en", "ta", "hi"] else "en"

    # Check for Gemini API key
    api_key = settings.GEMINI_API_KEY.strip()
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = f"""You are Aegis, an elite voice-first AI cybersecurity assistant for ShieldX.
Explain this security threat in 2-3 concise, clear, and reassuring sentences.
The user might be listening to your response via voice.

Threat Details:
- Type: {threat_type}
- Title: {title}
- Description: {description}
- MITRE Technique: {mitre_info.get('id', '')} - {mitre_info.get('technique', '')}

Language requirement: Respond strictly in {lang.upper()} (where 'en'=English, 'hi'=Hindi, 'ta'=Tamil).
Do not use markdown formatting or asterisks since this will be spoken aloud.
"""
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            logger.warning(f"Gemini API call failed, using offline fallback engine: {e}")

    # Offline rule-based fallback
    category = threat_type.upper()
    if category in OFFLINE_EXPLANATIONS:
        return OFFLINE_EXPLANATIONS[category].get(lang, OFFLINE_EXPLANATIONS[category]["en"])

    return OFFLINE_EXPLANATIONS["ANOMALY"].get(lang, OFFLINE_EXPLANATIONS["ANOMALY"]["en"])
