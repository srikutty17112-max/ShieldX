import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Sparkles, AlertTriangle, Send, Radio } from 'lucide-react';
import { useVoice } from '../context/VoiceContext';

export const VoiceAssistantOrb = ({ onVoiceActionComplete }) => {
  const {
    assistantState,
    continuousListening,
    toggleContinuousListening,
    currentTranscript,
    lastAegisReply,
    handleVoiceQuery,
    isLiveMode,
    isEmergencyActive
  } = useVoice();

  const [textInput, setTextInput] = useState('');

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    handleVoiceQuery(textInput.trim());
    setTextInput('');
  };

  const getOrbGlow = () => {
    switch (assistantState) {
      case 'listening': return 'border-cyber-green shadow-[0_0_35px_rgba(0,255,157,0.4)] text-cyber-green';
      case 'thinking': return 'border-cyber-amber shadow-[0_0_35px_rgba(255,183,3,0.4)] text-cyber-amber animate-pulse';
      case 'speaking': return 'border-cyber-cyan shadow-[0_0_40px_rgba(0,240,255,0.5)] text-cyber-cyan';
      default: return 'border-cyber-border text-cyber-muted';
    }
  };

  return (
    <div className="bg-cyber-900/80 border border-cyber-border rounded-xl p-5 relative overflow-hidden backdrop-blur-md">
      
      {/* Background Radar Grid Sweep */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-cyber-green/5 rounded-full blur-3xl pointer-events-none" />

      {/* Emergency Alert Banner */}
      {isEmergencyActive && (
        <div className="mb-4 p-2.5 rounded-lg bg-cyber-red/20 border border-cyber-red text-cyber-red text-xs font-mono flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-bold uppercase tracking-wider">Emergency Protocol Armed</span>
          </div>
          <span>Say "STOP" to freeze all assets</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        
        {/* Left: The Aegis Interactive Orb */}
        <div className="flex items-center space-x-5">
          <div className="relative group">
            
            {/* Animated Rotating Radar Rings */}
            <div className={`absolute -inset-2 rounded-full border border-dashed opacity-50 transition-colors ${
              assistantState === 'listening' ? 'border-cyber-green animate-spin' : 
              assistantState === 'speaking' ? 'border-cyber-cyan animate-pulse' : 'border-cyber-border'
            }`} style={{ animationDuration: '8s' }} />

            {/* Core Orb */}
            <button
              onClick={toggleContinuousListening}
              className={`w-16 h-16 rounded-full flex items-center justify-center border-2 bg-cyber-950 transition-all cursor-pointer ${getOrbGlow()}`}
              title="Aegis Voice Core - Click to toggle microphone"
            >
              {assistantState === 'speaking' ? (
                <Volume2 className="w-7 h-7 animate-bounce" />
              ) : assistantState === 'listening' ? (
                <Mic className="w-7 h-7 animate-pulse" />
              ) : assistantState === 'thinking' ? (
                <Sparkles className="w-7 h-7 animate-spin" />
              ) : (
                <MicOff className="w-7 h-7" />
              )}
            </button>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono font-bold text-white tracking-wider">AEGIS AI ASSISTANT</span>
              {isLiveMode && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  LIVE CHAT
                </span>
              )}
            </div>
            <div className="text-xs text-cyber-muted font-mono flex items-center space-x-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${
                assistantState === 'listening' ? 'bg-cyber-green animate-ping' :
                assistantState === 'thinking' ? 'bg-cyber-amber animate-pulse' :
                assistantState === 'speaking' ? 'bg-cyber-cyan animate-bounce' : 'bg-cyber-muted'
              }`} />
              <span className="capitalize">{assistantState}</span>
              <span>&bull;</span>
              <span className="text-cyber-green/80">Voice-Operable</span>
            </div>
          </div>
        </div>

        {/* Center: Live Transcript & Speech Display */}
        <div className="flex-1 max-w-xl w-full">
          <div className="bg-cyber-950 border border-cyber-border/70 rounded-lg p-3 min-h-[64px] flex flex-col justify-center">
            {currentTranscript ? (
              <div className="flex items-start space-x-2 text-xs font-mono">
                <span className="text-cyber-green font-bold shrink-0">[Operator]:</span>
                <span className="text-white italic">"{currentTranscript}"</span>
              </div>
            ) : lastAegisReply ? (
              <div className="flex items-start space-x-2 text-xs font-mono">
                <span className="text-cyber-cyan font-bold shrink-0">[Aegis]:</span>
                <span className="text-cyber-text">"{lastAegisReply}"</span>
              </div>
            ) : (
              <div className="text-xs font-mono text-cyber-muted flex items-center space-x-2">
                <Radio className="w-3.5 h-3.5 text-cyber-green animate-pulse" />
                <span>Speak commands naturally: "Approve threat", "Status briefing", "Emergency stop"</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Accessibility Text Fallback (Buttons remain visible fallback) */}
        <div className="w-full md:w-auto shrink-0">
          <form onSubmit={handleManualSubmit} className="flex items-center space-x-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Or type command..."
              className="bg-cyber-950 border border-cyber-border focus:border-cyber-green rounded-lg px-3 py-1.5 text-xs text-white placeholder-cyber-muted font-mono outline-none w-44"
            />
            <button
              type="submit"
              className="p-1.5 rounded-lg bg-cyber-800 hover:bg-cyber-700 text-cyber-green border border-cyber-green/30 text-xs font-mono transition-colors"
              title="Execute command"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
