import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

// Custom tactical radar icon
const createTacticalIcon = (severity, isAnomaly) => {
  const color = isAnomaly ? '#00f0ff' : severity === 'CRITICAL' ? '#ff0055' : severity === 'HIGH' ? '#ff0055' : '#ffb703';
  return L.divIcon({
    className: 'tactical-marker',
    html: `
      <div style="position: relative; width: 24px; height: 24px;">
        <div style="position: absolute; inset: 0; border-radius: 50%; background: ${color}; opacity: 0.3; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; inset: 4px; border-radius: 50%; background: ${color}; border: 2px solid #ffffff; box-shadow: 0 0 10px ${color};"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

export const GeoIncidentMap = ({ incidents, onApprove, onDownloadPdf }) => {
  const defaultCenter = [25.0, 10.0];

  return (
    <div className="bg-cyber-900/70 border border-cyber-border rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-cyber-cyan" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Global Threat Telemetry Radar
          </span>
        </div>
        <span className="text-xs font-mono text-cyber-muted">
          {incidents.length} Threat Nodes Plotted
        </span>
      </div>

      <div className="h-80 w-full rounded-lg overflow-hidden border border-cyber-border/60 relative">
        <MapContainer
          center={defaultCenter}
          zoom={2}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {incidents.map((inc) => {
            const lat = inc.geo_lat || 20.0;
            const lon = inc.geo_lon || 0.0;
            return (
              <Marker
                key={inc.id}
                position={[lat, lon]}
                icon={createTacticalIcon(inc.severity, inc.is_anomaly)}
              >
                <Popup className="tactical-popup">
                  <div className="p-2 text-xs font-mono bg-cyber-950 text-white rounded border border-cyber-border max-w-xs">
                    <div className="flex items-center justify-between font-bold text-cyber-green mb-1">
                      <span>SX-INC-{inc.id}</span>
                      <span className={inc.severity === 'CRITICAL' ? 'text-cyber-red' : 'text-cyber-amber'}>
                        {inc.severity}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-200 mb-1">{inc.title}</div>
                    <div className="text-[10px] text-cyber-muted mb-2">
                      Source: {inc.source_ip} ({inc.geo_city}, {inc.geo_country})
                    </div>
                    <div className="flex items-center space-x-2 pt-1 border-t border-cyber-border">
                      {inc.status === 'DETECTED' ? (
                        <button
                          onClick={() => onApprove(inc.id, 'UI')}
                          className="px-2 py-0.5 bg-cyber-green/20 hover:bg-cyber-green/30 text-cyber-green border border-cyber-green/40 rounded text-[10px]"
                        >
                          Approve Containment
                        </button>
                      ) : (
                        <span className="text-cyber-green flex items-center space-x-1 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{inc.status}</span>
                        </span>
                      )}
                      {onDownloadPdf && (
                        <button
                          onClick={() => onDownloadPdf(inc.id)}
                          className="px-2 py-0.5 bg-cyber-800 hover:bg-cyber-700 text-cyber-cyan rounded text-[10px] flex items-center space-x-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>PDF</span>
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
