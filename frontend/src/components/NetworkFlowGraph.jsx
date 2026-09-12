import React, { useEffect, useRef } from 'react';
import { Activity, ShieldAlert, Cpu, Server } from 'lucide-react';

export const NetworkFlowGraph = ({ networkData }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.null || canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let offset = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Node coordinates
      const nodes = [
        { id: 'gateway', x: canvas.width / 2, y: canvas.height / 2, label: 'ShieldX Core Gateway', type: 'core' },
        { id: 'cloud', x: canvas.width * 0.85, y: canvas.height / 2, label: 'Encrypted Cloud', type: 'cloud' },
        { id: 'agent1', x: canvas.width * 0.2, y: canvas.height * 0.25, label: 'Agent Endpoint 1', type: 'agent' },
        { id: 'agent2', x: canvas.width * 0.2, y: canvas.height * 0.75, label: 'Agent Endpoint 2', type: 'agent' },
        { id: 'threat', x: canvas.width * 0.5, y: canvas.height * 0.12, label: 'Inbound Threat Source', type: 'threat' },
      ];

      const edges = [
        { from: nodes[2], to: nodes[0], threat: false, color: '#00ff9d' },
        { from: nodes[3], to: nodes[0], threat: false, color: '#00ff9d' },
        { from: nodes[0], to: nodes[1], threat: false, color: '#00f0ff' },
        { from: nodes[4], to: nodes[0], threat: true, color: '#ff0055' },
      ];

      // Draw Edges with animated flowing pulses
      edges.forEach((edge) => {
        ctx.beginPath();
        ctx.moveTo(edge.from.x, edge.from.y);
        ctx.lineTo(edge.to.x, edge.to.y);
        ctx.strokeStyle = edge.threat ? 'rgba(255, 0, 85, 0.4)' : 'rgba(31, 46, 77, 0.8)';
        ctx.lineWidth = edge.threat ? 2.5 : 1.5;
        ctx.stroke();

        // Draw animated data particle along edge
        const dx = edge.to.x - edge.from.x;
        const dy = edge.to.y - edge.from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const particleCount = edge.threat ? 4 : 2;
        for (let i = 0; i < particleCount; i++) {
          const progress = ((offset + (i * dist) / particleCount) % dist) / dist;
          const px = edge.from.x + dx * progress;
          const py = edge.from.y + dy * progress;

          ctx.beginPath();
          ctx.arc(px, py, edge.threat ? 4 : 2.5, 0, Math.PI * 2);
          ctx.fillStyle = edge.color;
          ctx.shadowBlur = edge.threat ? 10 : 6;
          ctx.shadowColor = edge.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw Nodes
      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.type === 'core' ? 22 : 14, 0, Math.PI * 2);
        ctx.fillStyle = node.type === 'threat' ? '#250811' : node.type === 'core' ? '#0d1d2d' : '#0a1424';
        ctx.strokeStyle = node.type === 'threat' ? '#ff0055' : node.type === 'core' ? '#00f0ff' : '#00ff9d';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Label
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + (node.type === 'core' ? 36 : 26));
      });

      offset += 1.2;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [networkData]);

  return (
    <div className="bg-cyber-900/60 border border-cyber-border rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-cyber-green" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Live Telemetry Topology & Flow
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-mono text-cyber-muted">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-cyber-green" />
            <span>Telemetry</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-cyber-red animate-ping" />
            <span>Attack Inbound</span>
          </span>
        </div>
      </div>

      <div className="relative w-full h-56 rounded-lg bg-cyber-950 border border-cyber-border/40 overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={700}
          height={220}
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};
