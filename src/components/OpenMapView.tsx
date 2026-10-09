import React from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { getDistrictCoordinates } from '../data/tnDistrictCoordinates';

type PublicTransparency = Awaited<ReturnType<typeof api.getPublicTransparency>>;

const TN_CENTER: L.LatLngExpression = [11.1, 78.66];
const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const REFRESH_MS = 60000;

export const OpenMapView: React.FC = () => {
  const { language } = useApp();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const layerRef = React.useRef<L.LayerGroup | null>(null);
  const [data, setData] = React.useState<PublicTransparency | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(() => {
    setLoading(true);
    api.getPublicTransparency()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  // Create the map once and destroy it on unmount to avoid leaks.
  React.useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(TN_CENTER, 7);
    L.tileLayer(OSM_TILES, { attribution: OSM_ATTRIBUTION, maxZoom: 18 }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Redraw district markers whenever fresh aggregated data arrives.
  React.useEffect(() => {
    const layer = layerRef.current;
    if (!layer || !data) return;
    layer.clearLayers();
    data.districts.forEach((d) => {
      const coords = getDistrictCoordinates(d.district);
      if (!coords) return;
      const marker = L.circleMarker(coords, {
        radius: Math.min(28, 8 + d.total * 2),
        color: '#f97316',
        fillColor: '#f97316',
        fillOpacity: 0.5,
        weight: 2,
      });
      // Build popup with textContent so district names from the server are never parsed as HTML.
      const popup = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = d.district;
      const stats = document.createElement('div');
      stats.textContent = `${d.total} total · ${d.active} active · ${d.resolved} resolved`;
      popup.append(title, stats);
      marker.bindPopup(popup);
      marker.addTo(layer);
    });
  }, [data]);

  return (
    <section aria-labelledby="open-map-title" className="bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-lg p-4 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="open-map-title" className="text-base font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-400" />
            {language === 'ta' ? 'திறந்த வரைபடம்' : 'Open Map'}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {language === 'ta'
              ? 'மாவட்ட அளவிலான மொத்தத் தரவு மட்டும். தனிப்பட்ட முகவரிகள் காட்டப்படாது.'
              : 'District-level aggregated activity only. Individual citizen addresses are never shown.'}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="p-2 rounded-xl border border-slate-700 hover:bg-slate-800"
          aria-label="Refresh map data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="relative isolate">
        <div
          ref={containerRef}
          role="region"
          aria-label="Map of grievance activity by district"
          className="h-[420px] sm:h-[480px] w-full rounded-xl overflow-hidden border border-slate-800"
        />
      </div>

      {!data && !loading && (
        <p className="text-xs text-amber-300" role="status">
          {language === 'ta' ? 'வரைபடத் தரவு தற்காலிகமாகக் கிடைக்கவில்லை.' : 'Map data is temporarily unavailable.'}
        </p>
      )}
    </section>
  );
};
