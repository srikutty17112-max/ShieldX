import React, { useState } from 'react';
import { Upload, FileCode, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LogUploader = ({ onUploadSuccess }) => {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatusMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !token) return;
    setIsUploading(true);
    setStatusMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/telemetry/upload-log', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }

      const data = await res.json();
      setStatusMsg({
        type: 'success',
        text: `Log parsed: ${data.threats_detected} threat(s) & ${data.anomalies_detected} anomaly flagged.`
      });
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-cyber-900/60 border border-cyber-border rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center space-x-2 mb-2">
        <Upload className="w-4 h-4 text-cyber-cyan" />
        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
          Manual Security Log Ingestion (.json / .csv)
        </span>
      </div>
      <p className="text-xs text-cyber-muted font-mono mb-3">
        Alternative to running the agent: upload OS authentication or firewall logs for immediate AI analysis.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <label className="flex-1 w-full flex items-center justify-center px-4 py-2 rounded-lg border border-dashed border-cyber-border hover:border-cyber-green/50 bg-cyber-950 cursor-pointer text-xs font-mono text-cyber-muted transition-colors">
          <FileCode className="w-4 h-4 mr-2 text-cyber-green" />
          <span className="truncate">{file ? file.name : "Select .json or .csv log file..."}</span>
          <input
            type="file"
            accept=".json,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-cyber-800 hover:bg-cyber-700 text-cyber-green border border-cyber-green/30 text-xs font-mono font-bold transition-all disabled:opacity-40 flex items-center justify-center space-x-1.5 shrink-0"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" />
              <span>Ingest Log</span>
            </>
          )}
        </button>
      </div>

      {statusMsg && (
        <div className={`mt-3 p-2 rounded-md text-xs font-mono flex items-center space-x-2 ${
          statusMsg.type === 'success' ? 'bg-cyber-green/10 text-cyber-green border border-cyber-green/30' : 'bg-cyber-red/10 text-cyber-red border border-cyber-red/30'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}
    </div>
  );
};
