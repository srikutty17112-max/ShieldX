import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Activity, Cpu, Radio, 
  Terminal, AlertTriangle, Play, RefreshCw 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import { VoiceAssistantOrb } from '../components/VoiceAssistantOrb';
import { NetworkFlowGraph } from '../components/NetworkFlowGraph';
import { ThreatCard } from '../components/ThreatCard';
import { SimulatedAttackControls } from '../components/SimulatedAttackControls';
import { LogUploader } from '../components/LogUploader';

export const DashboardPage = ({ onNavigateTab }) => {
  const { token } = useAuth();
  const { handleVoiceQuery } = useVoice();

  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      const [statsRes, incRes] = await Promise.all([
        fetch('/api/v1/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/v1/incidents', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (statsRes.ok && incRes.ok) {
        const statsData = await statsRes.json();
        const incData = await incRes.json();
        setStats(statsData);
        setIncidents(incData);
      }
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000); // Live poll every 8s
    return () => clearInterval(interval);
  }, [token]);

  // Handle Response Action (Voice or UI)
  const handleIncidentAction = async (incidentId, actionType = 'APPROVE', actor = 'UI') => {
    try {
      const res = await fetch(`/api/v1/incidents/${incidentId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: actionType, actor: actor })
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (e) {
      console.error('Failed to execute incident containment:', e);
    }
  };

  // Trigger Simulated Attack Drill
  const handleSimulate = async (threatType) => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/v1/incidents/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ threat_type: threatType })
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (e) {
      console.error('Simulation error:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  // Download PDF Incident Report
  const handleDownloadPdf = (incidentId) => {
    window.open(`/api/v1/incidents/${incidentId}/report.pdf`, '_blank');
  };

  const activeIncidents = incidents.filter(i => i.status === 'DETECTED');
  const recentResolved = incidents.filter(i => i.status !== 'DETECTED').slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Threat Counter & Posture Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Active Threats Counter */}
        <div className="bg-cyber-900/80 border border-cyber-border rounded-xl p-4 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-cyber-muted">LIVE ACTIVE THREATS</span>
            <ShieldAlert className={`w-4 h-4 ${stats?.active_threats > 0 ? 'text-cyber-red animate-pulse' : 'text-cyber-green'}`} />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-bold font-mono ${stats?.active_threats > 0 ? 'text-cyber-red' : 'text-cyber-green'}`}>
              {stats?.active_threats ?? 0}
            </span>
            <span className="text-[10px] font-mono text-cyber-muted">Awaiting Authorization</span>
          </div>
        </div>

        {/* Blocked / Contained Threats */}
        <div className="bg-cyber-900/80 border border-cyber-border rounded-xl p-4 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-cyber-muted">NEUTRALIZED THREATS</span>
            <ShieldCheck className="w-4 h-4 text-cyber-green" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-mono text-cyber-green">
              {stats?.blocked_threats ?? 0}
            </span>
            <span className="text-[10px] font-mono text-cyber-muted">Voice / UI Approved</span>
          </div>
        </div>

        {/* Anomalies Detected */}
        <div className="bg-cyber-900/80 border border-cyber-border rounded-xl p-4 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-cyber-muted">STATISTICAL ANOMALIES</span>
            <Activity className="w-4 h-4 text-cyber-cyan" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-mono text-cyber-cyan">
              {stats?.anomalies_detected ?? 0}
            </span>
            <span className="text-[10px] font-mono text-cyber-muted">Unclassified Deviations</span>
          </div>
        </div>

        {/* Connected Monitoring Devices */}
        <div className="bg-cyber-900/80 border border-cyber-border rounded-xl p-4 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-cyber-muted">MONITORED ENDPOINTS</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-mono text-purple-400">
              {stats?.active_devices ?? 0}
            </span>
            <span className="text-[10px] font-mono text-cyber-muted">Read-Only Agents</span>
          </div>
        </div>

      </div>

      {/* Aegis Voice Assistant Persistent Orb */}
      <VoiceAssistantOrb onVoiceActionComplete={fetchDashboardData} />

      {/* Network Activity Visualization & Drill Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NetworkFlowGraph networkData={stats} />
        </div>
        <div>
          <SimulatedAttackControls onSimulate={handleSimulate} isSimulating={isSimulating} />
        </div>
      </div>

      {/* Manual Log Uploader alternative */}
      <LogUploader onUploadSuccess={fetchDashboardData} />

      {/* Live Threat Action Feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-cyber-green" />
            <h2 className="text-base font-bold font-mono text-white tracking-wide">
              LIVE THREAT CONTAINMENT QUEUE
            </h2>
          </div>
          <button
            onClick={fetchDashboardData}
            className="text-xs font-mono text-cyber-muted hover:text-white flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {activeIncidents.length === 0 ? (
          <div className="bg-cyber-900/40 border border-dashed border-cyber-border/70 rounded-xl p-8 text-center">
            <ShieldCheck className="w-10 h-10 text-cyber-green mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-bold font-mono text-white">All Clear & Protected</h3>
            <p className="text-xs text-cyber-muted font-mono mt-1">
              No active threats detected. Launch a simulation drill or run your agent to stream live telemetry.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeIncidents.map(inc => (
              <ThreatCard
                key={inc.id}
                incident={inc}
                onApprove={(id, actor) => handleIncidentAction(id, 'APPROVE', actor)}
                onReject={(id, actor) => handleIncidentAction(id, 'REJECT', actor)}
                onDownloadPdf={handleDownloadPdf}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Contained Threats */}
      {recentResolved.length > 0 && (
        <div className="pt-6 border-t border-cyber-border/60">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyber-muted mb-3">
            Recently Neutralized Incident Records
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {recentResolved.map(inc => (
              <ThreatCard
                key={inc.id}
                incident={inc}
                onApprove={() => {}}
                onReject={() => {}}
                onDownloadPdf={handleDownloadPdf}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
