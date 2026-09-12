import React, { useState, useEffect } from 'react';
import { MapPin, Globe, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GeoIncidentMap } from '../components/GeoIncidentMap';

export const GeoMapPage = () => {
  const { token } = useAuth();
  const [incidents, setIncidents] = useState([]);

  const fetchIncidents = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/incidents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchIncidents();
  }, [token]);

  const handleApprove = async (id, actor) => {
    try {
      await fetch(`/api/v1/incidents/${id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'APPROVE', actor })
      });
      fetchIncidents();
    } catch (e) {}
  };

  const handleDownloadPdf = (id) => {
    window.open(`/api/v1/incidents/${id}/report.pdf`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-cyber-cyan mb-1">
            <Globe className="w-4 h-4" />
            <span>GEOGRAPHIC ADVERSARY RADAR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Global Threat Telemetry Map
          </h1>
          <p className="text-xs text-cyber-muted font-mono mt-1">
            Plots approximate origin coordinates for both real incoming threat telemetry and simulation drills.
          </p>
        </div>

        <button
          onClick={fetchIncidents}
          className="px-3 py-1.5 rounded-lg bg-cyber-850 hover:bg-cyber-800 text-xs font-mono text-cyber-muted hover:text-white border border-cyber-border flex items-center space-x-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Pins</span>
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-cyber-border bg-cyber-900/60 p-2">
        <GeoIncidentMap
          incidents={incidents}
          onApprove={handleApprove}
          onDownloadPdf={handleDownloadPdf}
        />
      </div>
    </div>
  );
};
