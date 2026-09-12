import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useVoice } from './context/VoiceContext';
import { Navbar } from './components/Navbar';
import { SplashScreen } from './components/SplashScreen';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { GeoMapPage } from './pages/GeoMapPage';
import { DownloadAgentPage } from './pages/DownloadAgentPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { Loader2 } from 'lucide-react';

export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const { user, token, isLoading } = useAuth();
  const { currentTranscript } = useVoice();

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authView, setAuthView] = useState('landing'); // 'landing', 'login', 'signup'
  const [stats, setStats] = useState(null);

  // Poll stats for navbar
  useEffect(() => {
    if (!token) return;
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/v1/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {}
    };

    fetchStats();
    const int = setInterval(fetchStats, 10000);
    return () => clearInterval(int);
  }, [token]);

  // Voice Navigation Integration: "Go to incidents", "Open map", "Show agent", "Dashboard"
  useEffect(() => {
    if (!currentTranscript || !token) return;
    const text = currentTranscript.toLowerCase();

    if (text.includes('incident') || text.includes('threats')) {
      setActiveTab('incidents');
    } else if (text.includes('map') || text.includes('radar') || text.includes('global')) {
      setActiveTab('geomap');
    } else if (text.includes('agent') || text.includes('download')) {
      setActiveTab('download');
    } else if (text.includes('audit') || text.includes('log')) {
      setActiveTab('audit');
    } else if (text.includes('setting')) {
      setActiveTab('settings');
    } else if (text.includes('dashboard') || text.includes('command center') || text.includes('home')) {
      setActiveTab('dashboard');
    }
  }, [currentTranscript, token]);

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cyber-950 flex items-center justify-center text-cyber-green font-mono">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        <span>Initializing ShieldX Secure Enclave...</span>
      </div>
    );
  }

  // Unauthenticated Flow
  if (!token) {
    if (authView === 'login') {
      return (
        <LoginPage
          onSwitchToSignup={() => setAuthView('signup')}
          onBackToLanding={() => setAuthView('landing')}
        />
      );
    }
    if (authView === 'signup') {
      return (
        <SignupPage
          onSwitchToLogin={() => setAuthView('login')}
          onBackToLanding={() => setAuthView('landing')}
        />
      );
    }
    return (
      <LandingPage
        onGetStarted={() => setAuthView('signup')}
        onLogin={() => setAuthView('login')}
      />
    );
  }

  // Authenticated Command Center Flow
  return (
    <div className="min-h-screen bg-cyber-950 text-cyber-text flex flex-col selection:bg-cyber-green selection:text-black">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} stats={stats} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pt-6">
        {activeTab === 'dashboard' && <DashboardPage onNavigateTab={setActiveTab} />}
        {activeTab === 'incidents' && <IncidentsPage />}
        {activeTab === 'geomap' && <GeoMapPage />}
        {activeTab === 'download' && <DownloadAgentPage />}
        {activeTab === 'audit' && <AuditLogPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}

export default App;
