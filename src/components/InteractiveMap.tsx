import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, ChevronRight } from 'lucide-react';

interface InteractiveMapProps {
  tall?: boolean;
}

interface Pin {
  id: string;
  title: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  location: string;
  lat: number;
  lng: number;
}

interface District {
  id: string;
  nameEn: string;
  nameTa: string;
  total: number;
  activeCritical: number;
  lat: number;
  lng: number;
  pins: Pin[];
}

const DISTRICTS: District[] = [
  {
    id: 'Chennai', nameEn: 'Chennai District', nameTa: 'சென்னை மாவட்டம்', total: 480, activeCritical: 8, lat: 13.0827, lng: 80.2707,
    pins: [
      { id: 'GRV-2026-00124', title: 'Damaged Street Lights', priority: 'Medium', location: 'Triplicane, Marina', lat: 13.0569, lng: 80.2759 },
      { id: 'GRV-2026-00125', title: 'Water Main Leakage & Flooding', priority: 'High', location: 'Anna Nagar 4th Avenue', lat: 13.0850, lng: 80.2101 },
    ],
  },
  {
    id: 'Madurai', nameEn: 'Madurai District', nameTa: 'மதுரை மாவட்டம்', total: 240, activeCritical: 4, lat: 9.9252, lng: 78.1198,
    pins: [{ id: 'GRV-2026-00126', title: 'Garbage Dump Overflow', priority: 'Medium', location: 'Simmakkal Market', lat: 9.9242, lng: 78.1235 }],
  },
  {
    id: 'Coimbatore', nameEn: 'Coimbatore District', nameTa: 'கோயம்புத்தூர் மாவட்டம்', total: 310, activeCritical: 3, lat: 11.0168, lng: 76.9558,
    pins: [{ id: 'GRV-2026-00128', title: 'Dangerous Pothole on Flyover', priority: 'Critical', location: 'Avinashi Road', lat: 11.0183, lng: 77.0094 }],
  },
  {
    id: 'Tiruchirappalli', nameEn: 'Trichy District', nameTa: 'திருச்சிராப்பள்ளி மாவட்டம்', total: 175, activeCritical: 2, lat: 10.7905, lng: 78.7047,
    pins: [{ id: 'GRV-2026-00129', title: 'Open Sewage Manhole', priority: 'High', location: 'Thillai Nagar', lat: 10.8185, lng: 78.6860 }],
  },
  {
    id: 'Salem', nameEn: 'Salem District', nameTa: 'சேலம் மாவட்டம்', total: 135, activeCritical: 1, lat: 11.6643, lng: 78.146,
    pins: [{ id: 'GRV-2026-00130', title: 'Drainage Canal Blockage', priority: 'Low', location: 'Suramangalam Main Rd', lat: 11.6850, lng: 78.1130 }],
  },
];

const PRIORITY_COLOR: Record<Pin['priority'], string> = {
  Critical: '#dc2626',
  High: '#f97316',
  Medium: '#f59e0b',
  Low: '#10b981',
};

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

let leafletPromise: Promise<any> | null = null;

function loadLeaflet(): Promise<any> {
  const w = window as any;
  if (w.L) return Promise.resolve(w.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => resolve((window as any).L);
    script.onerror = () => {
      leafletPromise = null;
      reject(new Error('Failed to load Leaflet'));
    };
    document.body.appendChild(script);
  });
  return leafletPromise;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ tall = false }) => {
  const { language, navigateToTrack } = useApp();
  const [activeDistrict, setActiveDistrict] = useState<string>('Chennai');
  const [mapError, setMapError] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const navRef = useRef(navigateToTrack);
  navRef.current = navigateToTrack;

  const current = DISTRICTS.find((d) => d.id === activeDistrict) || DISTRICTS[0];

  // Initialise the Leaflet map once
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([10.9, 78.4], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        DISTRICTS.forEach((d) => {
          // District marker
          L.circleMarker([d.lat, d.lng], {
            radius: 10 + Math.min(d.activeCritical, 8),
            color: '#0b2545',
            weight: 2,
            fillColor: '#1d4ed8',
            fillOpacity: 0.35,
          })
            .addTo(map)
            .bindTooltip(`${d.id} • ${d.total}`, { direction: 'top' })
            .on('click', () => setActiveDistrict(d.id));

          // Incident pins
          d.pins.forEach((p) => {
            const marker = L.circleMarker([p.lat, p.lng], {
              radius: 7,
              color: '#ffffff',
              weight: 2,
              fillColor: PRIORITY_COLOR[p.priority],
              fillOpacity: 0.95,
            }).addTo(map);

            const box = document.createElement('div');
            const idEl = document.createElement('strong');
            idEl.textContent = p.id;
            const titleEl = document.createElement('div');
            titleEl.textContent = p.title;
            const locEl = document.createElement('div');
            locEl.textContent = `${p.location} • ${p.priority}`;
            locEl.style.fontSize = '11px';
            locEl.style.color = '#64748b';
            const btn = document.createElement('button');
            btn.textContent = 'Track →';
            btn.style.cssText = 'margin-top:6px;color:#1d4ed8;font-weight:600;cursor:pointer;background:none;border:none;padding:0';
            btn.onclick = () => navRef.current(p.id);
            box.append(idEl, titleEl, locEl, btn);
            marker.bindPopup(box);
          });
        });

        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 100);
      })
      .catch(() => setMapError(true));

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Fly to the selected district
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo([current.lat, current.lng], 10, { duration: 0.8 });
    }
  }, [current.id]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-navy flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-ai" />
            <span>
              {language === 'ta' ? 'தமிழ்நாடு நேரலை குறைதீர்ப்பு வரைபடம்' : 'Tamil Nadu Live Grievance Map'}
            </span>
          </h3>
          <p className="text-xs text-slate-500">OpenStreetMap + Leaflet • district hotspots and pinned incidents</p>
        </div>
        <div className="flex items-center space-x-3 text-xs text-slate-600">
          {(Object.keys(PRIORITY_COLOR) as Pin['priority'][]).map((k) => (
            <span key={k} className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: PRIORITY_COLOR[k] }} />
              <span>{k}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 relative rounded-2xl overflow-hidden border border-slate-200">
          <div ref={containerRef} className={`w-full ${tall ? 'h-[560px]' : 'h-[380px]'} bg-slate-100 z-0`} />
          {mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-sm text-slate-500 p-6 text-center">
              Map could not be loaded. Check your internet connection and try again.
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {DISTRICTS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setActiveDistrict(d.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  activeDistrict === d.id
                    ? 'bg-navy text-white border-navy'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-navy hover:text-navy'
                }`}
              >
                {d.id}
              </button>
            ))}
          </div>

          <div className="bg-sky-tint p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Selected District</span>
            <h4 className="text-base font-bold text-navy mt-0.5">
              {language === 'ta' ? current.nameTa : current.nameEn}
            </h4>
            <div className="flex items-center space-x-3 mt-2 text-xs">
              <span className="font-semibold text-slate-700">{current.total} Total Registered</span>
              <span>•</span>
              <span className="font-bold text-red-600">{current.activeCritical} Critical Active</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Active Incidents</span>
            {current.pins.map((pin) => (
              <div
                key={pin.id}
                onClick={() => navigateToTrack(pin.id)}
                className="p-3 bg-slate-50 hover:bg-sky-tint rounded-xl border border-slate-200 transition-colors cursor-pointer flex justify-between items-center text-xs group"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-navy">{pin.id}</span>
                    <span
                      className="text-[10px] font-bold px-1.5 rounded text-white"
                      style={{ background: PRIORITY_COLOR[pin.priority] }}
                    >
                      {pin.priority}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium mt-0.5">{pin.title}</p>
                  <p className="text-[11px] text-slate-500">{pin.location}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-navy group-hover:translate-x-1 transition-transform" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
