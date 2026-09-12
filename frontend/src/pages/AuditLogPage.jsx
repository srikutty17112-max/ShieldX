import React, { useState, useEffect } from 'react';
import { Radio, Shield, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuditLogPage = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/audit', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-cyber-green mb-1">
            <Radio className="w-4 h-4" />
            <span>IMMUTABLE COMPLIANCE AUDIT RECORD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Cryptographic Containment Audit Trail
          </h1>
          <p className="text-xs text-cyber-muted font-mono mt-1">
            Every voice command, UI approval, drill simulation, and detection trigger is recorded permanently.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3 py-1.5 rounded-lg bg-cyber-850 hover:bg-cyber-800 text-xs font-mono text-cyber-muted hover:text-white border border-cyber-border flex items-center space-x-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-cyber-900/80 border border-cyber-border rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-cyber-950/80 border-b border-cyber-border text-cyber-muted uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/40">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-cyber-muted">
                    No audit records registered yet.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-cyber-850/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-cyber-muted">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.actor === 'VOICE'
                          ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30'
                          : log.actor === 'UI'
                          ? 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/30'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      }`}>
                        {log.actor}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`flex items-center space-x-1 font-bold ${
                        log.result === 'SUCCESS' ? 'text-cyber-green' :
                        log.result === 'REJECTED' ? 'text-cyber-muted' : 'text-cyber-red'
                      }`}>
                        {log.result === 'SUCCESS' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : log.result === 'REJECTED' ? (
                          <XCircle className="w-3.5 h-3.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                        <span>{log.result}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-cyber-muted truncate max-w-xs" title={log.details}>
                      {log.details || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
