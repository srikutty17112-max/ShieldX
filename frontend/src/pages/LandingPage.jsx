import React from 'react';
import { Shield, Mic, Activity, Lock, Terminal, Cpu, ArrowRight, Zap, CheckCircle2, ChevronRight } from 'lucide-react';
import { Footer } from '../components/Footer';

export const LandingPage = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-cyber-950 text-cyber-text flex flex-col justify-between selection:bg-cyber-green selection:text-black">
      
      {/* Navigation Header */}
      <header className="border-b border-cyber-border/60 bg-cyber-900/60 backdrop-blur-md sticky top-0 z-50 px-6 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Shield className="w-8 h-8 text-cyber-green" />
              <div className="absolute inset-0 bg-cyber-green/20 blur-md rounded-full -z-10" />
            </div>
            <span className="text-xl font-bold font-mono tracking-wider text-white">
              SHIELD<span className="text-cyber-green">X</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onLogin}
              className="text-xs font-mono text-cyber-muted hover:text-white transition-colors px-3 py-1.5"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="text-xs font-mono font-bold bg-cyber-green hover:bg-cyber-green/90 text-black px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)] flex items-center space-x-1.5"
            >
              <span>Deploy ShieldX</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-20 pb-24 px-6 lg:px-12 overflow-hidden">
          <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyber-green/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyber-850 border border-cyber-green/30 text-xs font-mono text-cyber-green mb-8 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyber-green" />
              <span>Voice-First AI Threat Defense & Containment</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
              Detect. Explain with AI.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-green via-cyber-cyan to-teal-300">
                Contain by Voice Alone.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-cyber-muted mb-10 leading-relaxed">
              ShieldX empowers security engineers with real-time, read-only endpoint monitoring, MITRE ATT&CK mapping, and <strong>Aegis</strong> — an AI voice companion that briefs you in plain language and requires explicit voice authorization before taking action.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-cyber-green hover:bg-cyber-green/90 text-black font-bold font-mono text-sm transition-all shadow-[0_0_20px_rgba(0,255,157,0.35)] flex items-center justify-center space-x-2"
              >
                <span>Launch Command Center</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
              <button
                onClick={onLogin}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-cyber-900 hover:bg-cyber-850 border border-cyber-border text-white font-mono text-sm transition-colors"
              >
                Sign In With Google / Apple
              </button>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-20 px-6 lg:px-12 border-t border-cyber-border/60 bg-cyber-900/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-xs font-mono uppercase tracking-widest text-cyber-green mb-3">
                Architectural Superiority
              </h2>
              <h3 className="text-3xl font-bold text-white tracking-tight">
                Autonomous AI Defense, Human-in-the-Loop Control
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-cyber-900/60 border border-cyber-border hover:border-cyber-green/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-cyber-green/10 border border-cyber-green/30 flex items-center justify-center text-cyber-green mb-5">
                  <Mic className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Voice-First Interaction</h4>
                <p className="text-xs text-cyber-muted leading-relaxed font-sans">
                  Continuous listening with Web Speech & Gemini Live. Multi-language (English, Tamil, Hindi), proactive spoken alerts, daily briefings, and instant emergency override.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-cyber-900/60 border border-cyber-border hover:border-cyber-cyan/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center text-cyber-cyan mb-5">
                  <Cpu className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Dual Detection Engine</h4>
                <p className="text-xs text-cyber-muted leading-relaxed font-sans">
                  Combines rule-based detection for known CVE attack patterns (brute force, ransomware, exfil) with statistical anomaly baseline learning for zero-day behaviors.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-cyber-900/60 border border-cyber-border hover:border-cyber-amber/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-cyber-amber/10 border border-cyber-amber/30 flex items-center justify-center text-cyber-amber mb-5">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Strictly Read-Only Agent</h4>
                <p className="text-xs text-cyber-muted leading-relaxed font-sans">
                  Cross-platform Python script (Windows, Linux, macOS) reads only standard OS auth logs. Zero host execution or modification privileges required.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Security & Encryption Section */}
        <section id="security" className="py-20 px-6 lg:px-12 border-t border-cyber-border/60">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
            <div>
              <div className="inline-flex items-center space-x-2 text-xs font-mono text-cyber-cyan mb-3">
                <Shield className="w-4 h-4" />
                <span>ENTERPRISE-GRADE SECURITY</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                AES-256 Field Encryption & Key Rotation Policy
              </h3>
              <p className="text-xs text-cyber-muted leading-relaxed mb-6 font-sans">
                Every per-user API key and OAuth token is encrypted with AES-256 Fernet at the database field level. Automated 30-day key rotation utility guarantees cryptographic freshness.
              </p>
              <ul className="space-y-2.5 text-xs font-mono text-cyber-text">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyber-green shrink-0" />
                  <span>Bcrypt password salting; OAuth passwords never stored</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyber-green shrink-0" />
                  <span>Strict multi-tenant cryptographic isolation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyber-green shrink-0" />
                  <span>Immutable PDF incident reports with MITRE ATT&CK certification</span>
                </li>
              </ul>
            </div>

            <div className="w-full md:w-80 p-5 rounded-xl bg-cyber-900 border border-cyber-border font-mono text-xs text-cyber-muted space-y-2">
              <div className="text-cyber-green font-bold flex items-center space-x-1.5 pb-2 border-b border-cyber-border">
                <Terminal className="w-4 h-4" />
                <span>SHIELDX_AGENT.PY</span>
              </div>
              <div>Platform: Windows / Linux / macOS</div>
              <div>Mode: STRICTLY_READ_ONLY</div>
              <div>Auth: Per-User Encrypted Key</div>
              <div>Telemetry: HTTPS / Every 30s</div>
              <div className="text-cyber-cyan pt-2">Status: VERIFIED SAFE</div>
            </div>
          </div>
        </section>

      </main>

      {/* Cursor.com Style Multi-Column Footer */}
      <Footer />

    </div>
  );
};
