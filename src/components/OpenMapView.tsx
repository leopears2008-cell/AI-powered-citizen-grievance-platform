import React from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { getDistrictCoordinates } from '../data/tnDistrictCoordinates';

type PublicTransparency = Awaited<ReturnType<typeof api.getPublicTransparency>>;
type LatLng = [number, number];

// Minimal typings for the subset of Leaflet we use, loaded at runtime from a pinned CDN build.
interface LeafletLayerGroup {
  addTo(map: LeafletMap): LeafletLayerGroup;
  clearLayers(): void;
}
interface LeafletMarker {
  bindPopup(content: HTMLElement): LeafletMarker;
  addTo(group: LeafletLayerGroup): LeafletMarker;
}
interface LeafletMap {
  setView(center: LatLng, zoom: number): LeafletMap;
  remove(): void;
}
interface LeafletNamespace {
  map(element: HTMLElement, options: { scrollWheelZoom: boolean }): LeafletMap;
  tileLayer(url: string, options: { attribution: string; maxZoom: number }): { addTo(map: LeafletMap): unknown };
  layerGroup(): LeafletLayerGroup;
  circleMarker(
    center: LatLng,
    options: { radius: number; color: string; fillColor: string; fillOpacity: number; weight: number },
  ): LeafletMarker;
}

declare global {
  interface Window {
    L?: LeafletNamespace;
  }
}

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_CSS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

let leafletPromise: Promise<LeafletNamespace> | null = null;

// Loads Leaflet once per page. The promise is reset on failure so a retry is possible.
const loadLeaflet = (): Promise<LeafletNamespace> => {
  if (window.L) return Promise.resolve(window.L);
  if (!leafletPromise) {
    leafletPromise = new Promise<LeafletNamespace>((resolve, reject) => {
      if (!document.querySelector(`link[href="${LEAFLET_CSS_URL}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = LEAFLET_CSS_URL;
        document.head.appendChild(link);
      }
      const script = document.createElement('script');
      script.src = LEAFLET_JS_URL;
      script.async = true;
      script.onload = () => {
        if (window.L) resolve(window.L);
        else reject(new Error('Leaflet did not initialise'));
      };
      script.onerror = () => {
        script.remove();
        leafletPromise = null;
        reject(new Error('Leaflet failed to load'));
      };
      document.head.appendChild(script);
    });
  }
  return leafletPromise;
};

const TN_CENTER: LatLng = [11.1, 78.66];
const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const REFRESH_MS = 60000;

export const OpenMapView: React.FC = () => {
  const { language } = useApp();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<LeafletMap | null>(null);
  const layerRef = React.useRef<LeafletLayerGroup | null>(null);
  const leafletRef = React.useRef<LeafletNamespace | null>(null);
  const [data, setData] = React.useState<PublicTransparency | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [mapReady, setMapReady] = React.useState(false);
  const [mapError, setMapError] = React.useState(false);

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
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current) return;
        const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(TN_CENTER, 7);
        L.tileLayer(OSM_TILES, { attribution: OSM_ATTRIBUTION, maxZoom: 18 }).addTo(map);
        mapRef.current = map;
        leafletRef.current = L;
        layerRef.current = L.layerGroup().addTo(map);
        setMapReady(true);
      })
      .catch(() => {
        if (!cancelled) setMapError(true);
      });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  // Redraw district markers whenever fresh aggregated data arrives or the map becomes ready.
  React.useEffect(() => {
    const L = leafletRef.current;
    const layer = layerRef.current;
    if (!L || !layer || !data) return;
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
  }, [data, mapReady]);

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
              ? 'மொத்த பகுதித் தரவு மட்டும்; தனிப்பட்ட முகவரிகள் காட்டப்படாது.'
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

      {mapError && (
        <p className="text-xs text-amber-300" role="status">
          {language === 'ta' ? 'வரைபடம் ஏற்ற முடியவில்லை. இணைய இணைப்பை சரிபார்க்கவும்.' : 'The map could not load. Check your internet connection.'}
        </p>
      )}
      {!mapError && !data && !loading && (
        <p className="text-xs text-amber-300" role="status">
          {language === 'ta' ? 'வரைபடத் தரவு தற்காலிகமாகக் கிடைக்கவில்லை.' : 'Map data is temporarily unavailable.'}
        </p>
      )}
    </section>
  );
};
