import React, { useState } from 'react';
import { Play, Flame, Search, ArrowUpRight, Skull, ShieldCheck } from 'lucide-react';

export const SimulatedAttackControls = ({ onSimulate, isSimulating }) => {
  const attacks = [
    { type: 'BRUTE_FORCE', label: 'Brute Force', icon: Flame, color: 'hover:border-cyber-red text-cyber-red' },
    { type: 'PORT_SCAN', label: 'Port Scan', icon: Search, color: 'hover:border-cyber-amber text-cyber-amber' },
    { type: 'DATA_EXFILTRATION', label: 'Data Exfil', icon: ArrowUpRight, color: 'hover:border-orange-500 text-orange-400' },
    { type: 'RANSOMWARE', label: 'Ransomware', icon: Skull, color: 'hover:border-pink-500 text-pink-400' },
    { type: 'BENIGN', label: 'Benign Traffic', icon: ShieldCheck, color: 'hover:border-cyber-green text-cyber-green' },
  ];

  return (
    <div className="bg-cyber-900/60 border border-cyber-border rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Play className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Attack Simulation Range (Drills)
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
          Clearly Labeled "Simulated"
        </span>
      </div>

      <p className="text-xs text-cyber-muted font-mono mb-3">
        Trigger simulated attack scenarios to test real-time detection, AI analysis, and voice containment:
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {attacks.map((att) => {
          const Icon = att.icon;
          return (
            <button
              key={att.type}
              onClick={() => onSimulate(att.type)}
              disabled={isSimulating}
              className={`flex flex-col items-center justify-center p-3 rounded-lg bg-cyber-950/80 border border-cyber-border/70 transition-all group disabled:opacity-50 cursor-pointer ${att.color}`}
            >
              <Icon className="w-5 h-5 mb-1.5 transition-transform group-hover:scale-110" />
              <span className="text-xs font-bold text-white mb-0.5">{att.label}</span>
              <span className="text-[9px] font-mono text-purple-300 uppercase">[Simulated]</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
