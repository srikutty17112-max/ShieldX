import React from 'react';
import { Shield, Radio, Volume2, Mic, MicOff, Globe, LogOut, Terminal, MapPin, Activity, Settings, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';

export const Navbar = ({ activeTab, setActiveTab, stats }) => {
  const { user, logout } = useAuth();
  const {
    assistantState,
    language,
    setLanguage,
    continuousListening,
    toggleContinuousListening,
    requestBriefing
  } = useVoice();

  const getStatusColor = () => {
    switch (assistantState) {
      case 'listening': return 'text-cyber-green border-cyber-green/40 shadow-[0_0_10px_rgba(0,255,157,0.3)]';
      case 'thinking': return 'text-cyber-amber border-cyber-amber/40 animate-pulse';
      case 'speaking': return 'text-cyber-cyan border-cyber-cyan/40 animate-bounce';
      default: return 'text-cyber-muted border-cyber-border';
    }
  };

  const threatColor = stats?.overall_threat_level === 'CRITICAL' ? 'bg-cyber-red/20 text-cyber-red border-cyber-red/40'
    : stats?.overall_threat_level === 'ELEVATED' ? 'bg-cyber-amber/20 text-cyber-amber border-cyber-amber/40'
    : 'bg-cyber-green/20 text-cyber-green border-cyber-green/40';

  return (
    <header className="sticky top-0 z-40 bg-cyber-900/90 backdrop-blur-md border-b border-cyber-border px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Live Threat Badge */}
        <div className="flex items-center space-x-4">
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="relative">
              <Shield className="w-8 h-8 text-cyber-green transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-cyber-green/20 blur-md rounded-full -z-10" />
            </div>
            <span className="text-xl font-bold tracking-wider font-mono text-white">
              SHIELD<span className="text-cyber-green">X</span>
            </span>
          </div>

          {stats && (
            <div className={`hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono border ${threatColor}`}>
              <span className="w-2 h-2 rounded-full bg-current animate-ping" />
              <span>DEFENSE: {stats.overall_threat_level}</span>
              {stats.active_threats > 0 && (
                <span className="font-bold">({stats.active_threats} ACTIVE)</span>
              )}
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {[
            { id: 'dashboard', label: 'Command Center', icon: Activity },
            { id: 'incidents', label: 'Threats', icon: Terminal },
            { id: 'geomap', label: 'Global Radar', icon: MapPin },
            { id: 'download', label: 'Agent', icon: Download },
            { id: 'audit', label: 'Audit Log', icon: Radio },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  active 
                    ? 'bg-cyber-800 text-cyber-green border border-cyber-green/30 shadow-[0_0_12px_rgba(0,255,157,0.15)]' 
                    : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-850'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Persistent Voice Assistant Status & Quick Controls */}
        <div className="flex items-center space-x-3">
          
          {/* Spoken Briefing Trigger */}
          <button
            onClick={requestBriefing}
            title="Request Voice Briefing from Aegis"
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-cyber-800/80 hover:bg-cyber-700 text-cyber-cyan border border-cyber-cyan/30 text-xs font-mono transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Briefing</span>
          </button>

          {/* Persistent Voice State Pill */}
          <div 
            onClick={toggleContinuousListening}
            title={continuousListening ? "Voice Active: Aegis is continuously listening" : "Voice Paused: Click to resume listening"}
            className={`cursor-pointer flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-mono transition-all ${getStatusColor()}`}
          >
            {continuousListening ? (
              <Mic className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <MicOff className="w-3.5 h-3.5 text-cyber-muted" />
            )}
            <span className="font-semibold tracking-wide">
              AEGIS: {assistantState.toUpperCase()}
            </span>
          </div>

          {/* Language Selector */}
          <div className="flex items-center bg-cyber-850 border border-cyber-border rounded-lg p-0.5 text-xs font-mono">
            {['en', 'ta', 'hi'].map(l => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`px-2 py-0.5 rounded uppercase font-medium transition-colors ${
                  language === l
                    ? 'bg-cyber-green text-black font-bold'
                    : 'text-cyber-muted hover:text-cyber-text'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-cyber-muted hover:text-cyber-red hover:bg-cyber-850 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
