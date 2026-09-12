import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, Check, X, FileText, ChevronDown, ChevronUp, 
  MapPin, Cpu, Clock, AlertOctagon, Terminal
} from 'lucide-react';

export const ThreatCard = ({ incident, onApprove, onReject, onDownloadPdf }) => {
  const [showMitre, setShowMitre] = useState(false);

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-cyber-red/20 text-cyber-red border-cyber-red/50 shadow-[0_0_10px_rgba(255,0,85,0.3)]';
      case 'HIGH': return 'bg-cyber-red/15 text-cyber-red border-cyber-red/40';
      case 'MEDIUM': return 'bg-cyber-amber/15 text-cyber-amber border-cyber-amber/40';
      default: return 'bg-cyber-green/15 text-cyber-green border-cyber-green/40';
    }
  };

  const getDetectionSourceBadge = () => {
    if (incident.is_simulated) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
          Simulated Drill
        </span>
      );
    }
    if (incident.is_anomaly) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30">
          Anomaly — unclassified pattern
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-cyber-green/20 text-cyber-green border border-cyber-green/30">
        Real Telemetry
      </span>
    );
  };

  const isResolved = incident.status === 'CONTAINED' || incident.status === 'REJECTED';

  return (
    <div className={`border rounded-xl p-5 transition-all relative overflow-hidden backdrop-blur-sm ${
      incident.status === 'CONTAINED'
        ? 'bg-cyber-900/40 border-cyber-green/30'
        : incident.status === 'REJECTED'
        ? 'bg-cyber-900/30 border-cyber-border opacity-70'
        : incident.severity === 'CRITICAL'
        ? 'bg-cyber-900/90 border-cyber-red/60 shadow-[0_0_20px_rgba(255,0,85,0.15)]'
        : 'bg-cyber-900/80 border-cyber-border hover:border-cyber-border/80'
    }`}>
      
      {/* Top Bar: Incident ID, Badges & Severity */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-xs font-bold text-cyber-muted">
            SX-INC-{incident.id.toString().padStart(5, '0')}
          </span>
          {getDetectionSourceBadge()}
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSeverityBadge(incident.severity)}`}>
            {incident.severity}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-cyber-muted">
          <Clock className="w-3.5 h-3.5" />
          <span>{new Date(incident.created_at).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Title & Description */}
      <h3 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
        {incident.severity === 'CRITICAL' ? (
          <AlertOctagon className="w-5 h-5 text-cyber-red shrink-0" />
        ) : (
          <ShieldAlert className="w-5 h-5 text-cyber-amber shrink-0" />
        )}
        <span>{incident.title}</span>
      </h3>

      {/* AI Explanation Box (Gemini / Aegis Engine) */}
      <div className="bg-cyber-950/90 border border-cyber-border/80 rounded-lg p-3.5 mb-3 text-xs">
        <div className="flex items-center space-x-1.5 text-cyber-cyan font-mono font-bold mb-1.5">
          <Terminal className="w-3.5 h-3.5" />
          <span>AEGIS THREAT ASSESSMENT</span>
        </div>
        <p className="text-cyber-text leading-relaxed font-sans">
          {incident.ai_explanation}
        </p>
      </div>

      {/* Telemetry metadata: Target asset, Source IP, Geo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-cyber-muted mb-3 bg-cyber-850/40 p-2.5 rounded-lg border border-cyber-border/40">
        <div className="flex items-center space-x-1.5 truncate">
          <Cpu className="w-3.5 h-3.5 text-cyber-green shrink-0" />
          <span className="text-gray-400">Target:</span>
          <span className="text-white truncate">{incident.target_asset || 'Local Device'}</span>
        </div>
        <div className="flex items-center space-x-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-cyber-cyan shrink-0" />
          <span className="text-gray-400">Source:</span>
          <span className="text-white truncate">
            {incident.source_ip || 'Internal'} ({incident.geo_city}, {incident.geo_country})
          </span>
        </div>
      </div>

      {/* MITRE ATT&CK Mapping Accordion */}
      {incident.mitre_id && (
        <div className="mb-4">
          <button
            onClick={() => setShowMitre(!showMitre)}
            className="flex items-center justify-between w-full text-xs font-mono px-3 py-1.5 rounded-md bg-cyber-850/60 hover:bg-cyber-800 text-cyber-muted hover:text-white border border-cyber-border/40 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <span className="text-cyber-amber font-bold">{incident.mitre_id}</span>
              <span>&bull;</span>
              <span>{incident.mitre_technique}</span>
            </div>
            {showMitre ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showMitre && (
            <div className="mt-2 p-3 bg-cyber-950 border border-cyber-border/60 rounded-md text-xs font-mono space-y-1">
              <div className="text-cyber-muted">
                <strong className="text-white">Tactic:</strong> {incident.mitre_tactic}
              </div>
              <div className="text-cyber-muted">
                <strong className="text-white">Telemetry Signature:</strong> {incident.description}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Actions: Fallback on-screen buttons (Voice is primary post-login) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-cyber-border/40">
        
        {/* Recommended Action Display */}
        <div className="text-xs font-mono">
          <span className="text-cyber-muted">Recommended: </span>
          <span className="text-cyber-green font-semibold">{incident.recommended_action}</span>
        </div>

        {/* Buttons (Accessible Fallback) */}
        <div className="flex items-center space-x-2">
          {!isResolved ? (
            <>
              <button
                onClick={() => onApprove(incident.id, 'UI')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyber-green hover:bg-cyber-green/90 text-black font-bold text-xs font-mono transition-all shadow-[0_0_12px_rgba(0,255,157,0.25)] cursor-pointer"
                title="Voice equivalent: say 'Approve'"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Approve Action</span>
              </button>
              <button
                onClick={() => onReject(incident.id, 'UI')}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-cyber-800 hover:bg-cyber-700 text-cyber-muted hover:text-white text-xs font-mono transition-colors cursor-pointer"
                title="Voice equivalent: say 'Reject'"
              >
                <X className="w-3.5 h-3.5" />
                <span>Dismiss</span>
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <span className={`text-xs font-mono flex items-center space-x-1 ${
                incident.status === 'CONTAINED' ? 'text-cyber-green' : 'text-cyber-muted'
              }`}>
                {incident.status === 'CONTAINED' && <ShieldCheck className="w-4 h-4" />}
                <span>
                  {incident.status} (via {incident.approver || 'VOICE'})
                </span>
              </span>

              {/* PDF Incident Report Download */}
              <button
                onClick={() => onDownloadPdf(incident.id)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-cyber-800 hover:bg-cyber-700 text-cyber-cyan border border-cyber-cyan/30 text-xs font-mono transition-colors"
                title="Download immutable PDF Incident Audit Report"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
