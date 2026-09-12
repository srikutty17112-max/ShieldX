import React, { useState, useEffect } from 'react';
import { Terminal, Filter, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThreatCard } from '../components/ThreatCard';

export const IncidentsPage = () => {
  const { token } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [token]);

  const handleAction = async (id, act, actor = 'UI') => {
    try {
      const res = await fetch(`/api/v1/incidents/${id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: act, actor })
      });
      if (res.ok) fetchIncidents();
    } catch (e) {}
  };

  const handleDownloadPdf = (id) => {
    window.open(`/api/v1/incidents/${id}/report.pdf`, '_blank');
  };

  const filteredIncidents = incidents.filter(i => {
    if (filter === 'DETECTED' && i.status !== 'DETECTED') return false;
    if (filter === 'CONTAINED' && i.status !== 'CONTAINED') return false;
    if (filter === 'ANOMALY' && !i.is_anomaly) return false;
    if (filter === 'SIMULATED' && !i.is_simulated) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        i.title.toLowerCase().includes(q) ||
        (i.source_ip && i.source_ip.toLowerCase().includes(q)) ||
        (i.mitre_id && i.mitre_id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-cyber-green mb-1">
            <Terminal className="w-4 h-4" />
            <span>INCIDENT FORENSICS & ARCHIVE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Threat Intelligence & Containment Feed
          </h1>
        </div>

        <button
          onClick={fetchIncidents}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-cyber-850 hover:bg-cyber-800 text-xs font-mono text-cyber-muted hover:text-white border border-cyber-border flex items-center space-x-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-cyber-900/60 p-3 rounded-xl border border-cyber-border">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-cyber-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search IP, MITRE ID, or title..."
            className="w-full bg-cyber-950 border border-cyber-border focus:border-cyber-green rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-cyber-muted font-mono outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto text-xs font-mono">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'DETECTED', label: 'Pending Approval' },
            { id: 'CONTAINED', label: 'Neutralized' },
            { id: 'ANOMALY', label: 'Anomalies' },
            { id: 'SIMULATED', label: 'Simulations' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filter === btn.id
                  ? 'bg-cyber-green text-black font-bold'
                  : 'bg-cyber-950 text-cyber-muted hover:text-white border border-cyber-border'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

      </div>

      {/* Incident List */}
      {filteredIncidents.length === 0 ? (
        <div className="bg-cyber-900/40 border border-dashed border-cyber-border/70 rounded-xl p-12 text-center">
          <p className="text-xs font-mono text-cyber-muted">
            No incidents matched your active filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredIncidents.map(inc => (
            <ThreatCard
              key={inc.id}
              incident={inc}
              onApprove={(id, actor) => handleAction(id, 'APPROVE', actor)}
              onReject={(id, actor) => handleAction(id, 'REJECT', actor)}
              onDownloadPdf={handleDownloadPdf}
            />
          ))}
        </div>
      )}

    </div>
  );
};
