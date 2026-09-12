import React, { useState } from 'react';
import { 
  Settings, Globe, Mic, Shield, Key, CheckCircle2, 
  RotateCcw, ExternalLink, Smartphone, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';

export const SettingsPage = () => {
  const { user, updateSettings } = useAuth();
  const { 
    language, 
    setLanguage, 
    isLiveMode, 
    setIsLiveMode, 
    continuousListening, 
    toggleContinuousListening 
  } = useVoice();

  const [savedStatus, setSavedStatus] = useState(false);

  const handleLanguageChange = async (newLang) => {
    setLanguage(newLang);
    await updateSettings({ voice_language: newLang });
    showSavedNotification();
  };

  const handleLiveModeToggle = async () => {
    const nextVal = !isLiveMode;
    setIsLiveMode(nextVal);
    await updateSettings({ live_voice_enabled: nextVal });
    showSavedNotification();
  };

  const showSavedNotification = () => {
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      <div>
        <div className="inline-flex items-center space-x-2 text-xs font-mono text-cyber-green mb-1">
          <Settings className="w-4 h-4" />
          <span>OPERATOR CONFIGURATION</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          System & Voice Assistant Settings
        </h1>
        <p className="text-xs text-cyber-muted font-mono mt-1">
          Customize Aegis voice parameters, live conversation streaming, and tenant security policies.
        </p>
      </div>

      {savedStatus && (
        <div className="p-3 rounded-xl bg-cyber-green/10 border border-cyber-green/30 text-cyber-green text-xs font-mono flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings successfully synchronized.</span>
        </div>
      )}

      {/* 1. Voice Assistant Language Settings */}
      <div className="bg-cyber-900/80 border border-cyber-border rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-cyber-border">
          <Globe className="w-5 h-5 text-cyber-cyan" />
          <div>
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              1. Aegis Multi-Language Voice Support
            </h3>
            <p className="text-xs text-cyber-muted font-mono">
              Configures both speech recognition intake and synthesized vocal briefing output.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[
            { id: 'en', title: 'English (US / Global)', sample: '"Alert: Threat detected"' },
            { id: 'ta', title: 'Tamil (தமிழ்)', sample: '"அச்சுறுத்தல் கண்டறியப்பட்டது"' },
            { id: 'hi', title: 'Hindi (हिन्दी)', sample: '"खतरा पहचाना गया है"' },
          ].map(langOption => (
            <button
              key={langOption.id}
              onClick={() => handleLanguageChange(langOption.id)}
              className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                language === langOption.id
                  ? 'bg-cyber-850 border-cyber-green text-white shadow-[0_0_15px_rgba(0,255,157,0.15)]'
                  : 'bg-cyber-950 border-cyber-border text-cyber-muted hover:border-cyber-border/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold text-white">{langOption.title}</span>
                {language === langOption.id && <CheckCircle2 className="w-4 h-4 text-cyber-green" />}
              </div>
              <div className="text-[11px] font-mono text-cyber-muted italic">
                {langOption.sample}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Voice Tier Modes */}
      <div className="bg-cyber-900/80 border border-cyber-border rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-cyber-border">
          <Mic className="w-5 h-5 text-cyber-green" />
          <div>
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              2. Voice Interaction Tiers
            </h3>
            <p className="text-xs text-cyber-muted font-mono">
              Toggle continuous voice commands and low-latency live conversational mode.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          
          {/* Continuous Listening Switch */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-cyber-950 border border-cyber-border">
            <div>
              <div className="font-mono text-xs font-bold text-white">
                Continuous Voice Listening Mode
              </div>
              <p className="text-xs text-cyber-muted font-mono mt-0.5">
                Keeps Aegis listening in the background so no keyboard typing is needed post-login.
              </p>
            </div>
            <button
              onClick={toggleContinuousListening}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                continuousListening ? 'bg-cyber-green' : 'bg-cyber-border'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                continuousListening ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Live Voice Chat Mode Switch */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-cyber-950 border border-cyber-border">
            <div>
              <div className="font-mono text-xs font-bold text-white flex items-center space-x-2">
                <span>Enhanced Live Voice Chat Mode</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Gemini Live WebSocket
                </span>
              </div>
              <p className="text-xs text-cyber-muted font-mono mt-0.5">
                Low-latency, interruptible bidirectional audio stream. Gracefully falls back to Web Speech if offline.
              </p>
            </div>
            <button
              onClick={handleLiveModeToggle}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                isLiveMode ? 'bg-purple-500' : 'bg-cyber-border'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                isLiveMode ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

        </div>
      </div>

      {/* 3. OAuth Identity & Authentication */}
      <div className="bg-cyber-900/80 border border-cyber-border rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-cyber-border">
          <Shield className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              3. Identity & OAuth Providers
            </h3>
            <p className="text-xs text-cyber-muted font-mono">
              Verified identity credentials. ShieldX never stores your OAuth passwords.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono">
          <div className="p-3 rounded-xl bg-cyber-950 border border-cyber-border">
            <div className="text-cyber-muted mb-1">Authenticated Account</div>
            <div className="text-white font-bold truncate">{user?.email}</div>
            <div className="text-[10px] text-cyber-green mt-1">Provider: {user?.oauth_provider.toUpperCase()}</div>
          </div>

          <div className="p-3 rounded-xl bg-cyber-950 border border-cyber-border">
            <div className="text-cyber-muted mb-1">Multi-Tenant Isolation</div>
            <div className="text-white font-bold">Tenant ID: #{user?.id}</div>
            <div className="text-[10px] text-cyber-cyan mt-1">Status: Cryptographically Scoped</div>
          </div>
        </div>
      </div>

      {/* 4. AES-256 Field Encryption & Key Rotation Policy */}
      <div className="bg-cyber-900/80 border border-cyber-border rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-cyber-border">
          <Key className="w-5 h-5 text-cyber-amber" />
          <div>
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              4. AES-256 Encryption & Automatic Key Rotation Policy
            </h3>
            <p className="text-xs text-cyber-muted font-mono">
              Field-level encryption for per-user API keys and OAuth tokens with 30-day rotation policy.
            </p>
          </div>
        </div>

        <div className="bg-cyber-950 p-4 rounded-xl border border-cyber-border text-xs font-mono space-y-2">
          <p className="text-cyber-muted">
            ShieldX enforces automatic AES-256 Fernet key rotation. To re-encrypt database keys and refresh secrets:
          </p>
          <pre className="bg-cyber-900 p-2.5 rounded text-cyber-amber overflow-x-auto text-[11px]">
            python backend/scripts/rotate_keys.py
          </pre>
          <p className="text-[11px] text-cyber-muted">
            All records in <code className="text-white">devices.api_key_encrypted</code> and <code className="text-white">users.oauth_access_token_encrypted</code> are re-encrypted automatically with an immutable audit entry in <code className="text-white">key_rotation_audits</code>.
          </p>
        </div>
      </div>

    </div>
  );
};
