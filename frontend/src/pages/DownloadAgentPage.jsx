import React, { useState, useEffect } from 'react';
import { 
  Download, Terminal, Shield, CheckCircle2, Copy, 
  Cpu, RefreshCw, Trash2, Key, HelpCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DownloadAgentPage = () => {
  const { token } = useAuth();
  const [devices, setDevices] = useState([]);
  const [deviceName, setDeviceName] = useState('My Workstation');
  const [osType, setOsType] = useState('windows');
  const [loading, setLoading] = useState(false);
  const [provisionedConfig, setProvisionedConfig] = useState(null);

  const fetchDevices = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/agents/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (e) {
      console.error('Failed to load devices:', e);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [token]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!token || !deviceName.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/v1/agents/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          device_name: deviceName,
          os_type: osType
        })
      });

      if (res.ok) {
        const data = await res.json();
        setProvisionedConfig(data);
        fetchDevices();
      }
    } catch (e) {
      console.error('Failed to register device:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (deviceId) => {
    try {
      const res = await fetch(`/api/v1/agents/revoke/${deviceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDevices();
      }
    } catch (e) {}
  };

  const handleDownloadConfigFile = (deviceId) => {
    window.open(`/api/v1/agents/config/${deviceId}`, '_blank');
  };

  const handleDownloadAgentScript = () => {
    window.open('/api/v1/agents/download-agent', '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 text-xs font-mono text-cyber-green mb-2">
          <Terminal className="w-4 h-4" />
          <span>ZERO-PRIVILEGE TELEMETRY SENSOR</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Provision Cross-Platform Monitoring Agent
        </h1>
        <p className="text-xs sm:text-sm text-cyber-muted font-mono mt-1">
          Deploy the single-file <code className="text-cyber-green">shieldx_agent.py</code> on Windows, Linux, or macOS. It reads only standard OS authentication logs with zero elevation required.
        </p>
      </div>

      {/* Provisioning Form */}
      <div className="bg-cyber-900/80 border border-cyber-border rounded-2xl p-6 backdrop-blur-sm">
        <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Key className="w-4 h-4 text-cyber-green" />
          <span>1. Provision Endpoint & Generate Bundled API Key</span>
        </h3>

        <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-mono text-cyber-muted mb-1">DEVICE IDENTIFIER</label>
            <input
              type="text"
              required
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g. Workstation-Win11"
              className="w-full bg-cyber-950 border border-cyber-border focus:border-cyber-green rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-cyber-muted mb-1">OPERATING SYSTEM</label>
            <select
              value={osType}
              onChange={(e) => setOsType(e.target.value)}
              className="w-full bg-cyber-950 border border-cyber-border focus:border-cyber-green rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
            >
              <option value="windows">Windows (Event Log 4625/4624)</option>
              <option value="linux">Linux (/var/log/auth.log / journalctl)</option>
              <option value="darwin">macOS (log show Unified Log)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg bg-cyber-green hover:bg-cyber-green/90 text-black font-bold font-mono text-xs transition-all shadow-[0_0_12px_rgba(0,255,157,0.25)] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{loading ? "Generating Key..." : "Provision Device"}</span>
            </button>
          </div>
        </form>

        {provisionedConfig && (
          <div className="p-4 rounded-xl bg-cyber-950 border border-cyber-green/40 mt-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-cyber-green font-bold">
              <span>Endpoint Successfully Provisioned: {provisionedConfig.device_name}</span>
              <span>AES-256 Key Encrypted</span>
            </div>
            
            <p className="text-xs text-cyber-muted font-mono">
              Download your zero-configuration bundle below. No manual key copy-pasting is required — the API key and server endpoint are pre-embedded in <code className="text-white">shieldx_config.json</code>.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => handleDownloadConfigFile(provisionedConfig.device_id)}
                className="px-4 py-2 rounded-lg bg-cyber-green text-black font-bold font-mono text-xs flex items-center space-x-2 transition-all shadow-[0_0_12px_rgba(0,255,157,0.3)] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Download shieldx_config.json</span>
              </button>

              <button
                onClick={handleDownloadAgentScript}
                className="px-4 py-2 rounded-lg bg-cyber-800 hover:bg-cyber-700 text-white font-mono text-xs border border-cyber-border flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyber-cyan" />
                <span>Download shieldx_agent.py</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Setup Instructions */}
      <div className="bg-cyber-900/80 border border-cyber-border rounded-2xl p-6 backdrop-blur-sm">
        <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-cyber-cyan" />
          <span>2. Deployment Instructions (Zero External Dependencies)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          
          <div className="bg-cyber-950 p-4 rounded-xl border border-cyber-border/80">
            <div className="font-bold text-white mb-2 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-cyber-green" />
              <span>Windows</span>
            </div>
            <p className="text-cyber-muted mb-3 font-sans text-[11px]">
              Place both files in the same folder and launch PowerShell or Command Prompt:
            </p>
            <pre className="bg-cyber-900 p-2.5 rounded text-cyber-green overflow-x-auto text-[11px]">
              python shieldx_agent.py
            </pre>
          </div>

          <div className="bg-cyber-950 p-4 rounded-xl border border-cyber-border/80">
            <div className="font-bold text-white mb-2 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-cyber-cyan" />
              <span>Linux</span>
            </div>
            <p className="text-cyber-muted mb-3 font-sans text-[11px]">
              Standard Python 3 environment. Zero pip packages required:
            </p>
            <pre className="bg-cyber-900 p-2.5 rounded text-cyber-cyan overflow-x-auto text-[11px]">
              python3 shieldx_agent.py
            </pre>
          </div>

          <div className="bg-cyber-950 p-4 rounded-xl border border-cyber-border/80">
            <div className="font-bold text-white mb-2 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>macOS</span>
            </div>
            <p className="text-cyber-muted mb-3 font-sans text-[11px]">
              Reads failed auth events via unified logging:
            </p>
            <pre className="bg-cyber-900 p-2.5 rounded text-purple-300 overflow-x-auto text-[11px]">
              python3 shieldx_agent.py
            </pre>
          </div>

        </div>
      </div>

      {/* Your Connected Devices */}
      <div className="bg-cyber-900/80 border border-cyber-border rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Active Tenant Devices ({devices.length})</span>
          </h3>
          <button
            onClick={fetchDevices}
            className="text-xs font-mono text-cyber-muted hover:text-white flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {devices.length === 0 ? (
          <p className="text-xs font-mono text-cyber-muted text-center py-6">
            No devices provisioned yet. Use the form above to generate your first agent key.
          </p>
        ) : (
          <div className="divide-y divide-cyber-border/40">
            {devices.map(d => (
              <div key={d.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div>
                  <div className="font-bold text-white flex items-center space-x-2">
                    <span>{d.device_name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-850 text-cyber-muted border border-cyber-border uppercase">
                      {d.os_type}
                    </span>
                    {d.is_active ? (
                      <span className="text-cyber-green text-[10px] flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-ping" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="text-cyber-red text-[10px]">Revoked</span>
                    )}
                  </div>
                  <div className="text-[10px] text-cyber-muted mt-0.5">
                    Key Prefix: {d.api_key_prefix} &bull; Last Seen: {new Date(d.last_seen).toLocaleTimeString()}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {d.is_active && (
                    <button
                      onClick={() => handleDownloadConfigFile(d.id)}
                      className="px-2.5 py-1 rounded bg-cyber-850 hover:bg-cyber-800 text-cyber-cyan border border-cyber-border text-xs transition-colors flex items-center space-x-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Config JSON</span>
                    </button>
                  )}
                  {d.is_active && (
                    <button
                      onClick={() => handleRevoke(d.id)}
                      className="p-1 rounded text-cyber-muted hover:text-cyber-red hover:bg-cyber-850 transition-colors"
                      title="Revoke Device"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
