import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const VoiceContext = createContext(null);

export const VoiceProvider = ({ children }) => {
  const { user, token } = useAuth();

  // Assistant State: 'idle' | 'listening' | 'thinking' | 'speaking'
  const [assistantState, setAssistantState] = useState('idle');
  const [language, setLanguage] = useState('en'); // 'en', 'ta', 'hi'
  const [isLiveMode, setIsLiveMode] = useState(false); // Enhanced WebSocket mode
  const [continuousListening, setContinuousListening] = useState(true);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastAegisReply, setLastAegisReply] = useState('');
  const [proactiveAlertQueue, setProactiveAlertQueue] = useState([]);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis || null);
  const socketRef = useRef(null);
  const isSpeakingRef = useRef(false);

  // Sync language with user profile preference
  useEffect(() => {
    if (user?.voice_language) {
      setLanguage(user.voice_language);
    }
    if (user?.live_voice_enabled !== undefined) {
      setIsLiveMode(user.live_voice_enabled);
    }
  }, [user]);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported on this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Set speech recognition language code
    if (language === 'hi') {
      recognition.lang = 'hi-IN';
    } else if (language === 'ta') {
      recognition.lang = 'ta-IN';
    } else {
      recognition.lang = 'en-US';
    }

    recognition.onstart = () => {
      if (!isSpeakingRef.current) {
        setAssistantState('listening');
      }
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (interim) {
        setCurrentTranscript(interim);
      }

      if (finalTranscript.trim()) {
        const query = finalTranscript.trim();
        setCurrentTranscript(query);
        handleVoiceQuery(query);
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.warn('Speech recognition warning:', event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart if continuous listening is enabled and user is logged in
      if (continuousListening && token && !isSpeakingRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // already started
        }
      } else if (!isSpeakingRef.current) {
        setAssistantState('idle');
      }
    };

    recognitionRef.current = recognition;

    if (token && continuousListening) {
      try {
        recognition.start();
      } catch (e) {}
    }

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [language, continuousListening, token]);

  // Enhanced Live Voice Chat WebSocket mode
  useEffect(() => {
    if (isLiveMode && token) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/v1/voice/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[Live Voice Chat] WebSocket connected.');
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.spoken_text) {
            speakText(data.spoken_text, data.sentiment_urgency);
            setLastAegisReply(data.reply_text);
          }
        } catch (e) {}
      };

      socketRef.current = ws;
      return () => {
        ws.close();
      };
    }
  }, [isLiveMode, token]);

  // Proactive Spoken Alerts Poller (Feature 2)
  useEffect(() => {
    if (!token) return;

    const checkAlerts = async () => {
      try {
        const res = await fetch('/api/v1/voice/proactive-alerts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.alerts && data.alerts.length > 0) {
            const topAlert = data.alerts[0];
            // Check if already spoken
            if (!proactiveAlertQueue.includes(topAlert.incident_id)) {
              setProactiveAlertQueue(prev => [...prev, topAlert.incident_id]);
              speakText(topAlert.spoken_alert, true);
              setLastAegisReply(topAlert.spoken_alert);
            }
          }
        }
      } catch (e) {}
    };

    const interval = setInterval(checkAlerts, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [token, proactiveAlertQueue, language]);

  // Speech Synthesis Output
  const speakText = (text, isUrgent = false) => {
    if (!synthRef.current) return;

    // Pause recognition while speaking to prevent feedback echo
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    synthRef.current.cancel(); // Stop any pending speech
    isSpeakingRef.current = true;
    setAssistantState('speaking');

    const utterance = new SpeechSynthesisUtterance(text);

    // Feature 1: Multi-language voice selection
    if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (language === 'ta') {
      utterance.lang = 'ta-IN';
    } else {
      utterance.lang = 'en-US';
    }

    // Feature 6: Sentiment-aware pitch and speed adjustment
    if (isUrgent) {
      // Reassuring, calm, steady tone
      utterance.rate = 0.95;
      utterance.pitch = 0.95;
    } else {
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
    }

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setAssistantState('idle');
      if (continuousListening && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setAssistantState('idle');
      if (continuousListening && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
    };

    synthRef.current.speak(utterance);
  };

  // Main voice query handler (Baseline & Live)
  const handleVoiceQuery = async (transcriptText, explicitIncidentId = null) => {
    if (!transcriptText || !token) return;

    setAssistantState('thinking');

    // Feature 5: Emergency Voice Override Detection
    const lower = transcriptText.toLowerCase();
    if (lower.includes('stop') || lower.includes('halt') || lower.includes('emergency')) {
      setIsEmergencyActive(true);
    }

    try {
      // If in Live WebSocket mode, send via socket
      if (isLiveMode && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          transcript: transcriptText,
          language: language
        }));
        return;
      }

      // Baseline HTTP Voice Chat Dispatch
      const res = await fetch('/api/v1/voice/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transcript: transcriptText,
          incident_id: explicitIncidentId,
          language: language
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLastAegisReply(data.reply_text);
        speakText(data.spoken_text, data.sentiment_urgency);
      } else {
        setAssistantState('idle');
      }
    } catch (e) {
      console.error('Voice command error:', e);
      setAssistantState('idle');
    }
  };

  // Feature 3: Request Spoken Daily Briefing
  const requestBriefing = async () => {
    if (!token) return;
    setAssistantState('thinking');
    try {
      const res = await fetch('/api/v1/voice/briefing', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLastAegisReply(data.briefing_text);
        speakText(data.spoken_text, false);
      }
    } catch (e) {
      setAssistantState('idle');
    }
  };

  const toggleContinuousListening = () => {
    setContinuousListening(prev => {
      const nextVal = !prev;
      if (!nextVal && recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        setAssistantState('idle');
      } else if (nextVal && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
      return nextVal;
    });
  };

  return (
    <VoiceContext.Provider value={{
      assistantState,
      language,
      setLanguage,
      isLiveMode,
      setIsLiveMode,
      continuousListening,
      toggleContinuousListening,
      currentTranscript,
      lastAegisReply,
      handleVoiceQuery,
      speakText,
      requestBriefing,
      isEmergencyActive
    }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => useContext(VoiceContext);
