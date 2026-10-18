'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function MapSelector({
  locationName,
  direccion,
  onLocationSelect,
  onUbigeoFound
}: {
  locationName: string;
  direccion?: string;
  onLocationSelect: (lat: number, lng: number) => void;
  onUbigeoFound?: (dept: string, prov: string, dist: string, ubigeoCode: string, ubigeoId: string) => void;
}) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const markerRef = React.useRef<any>(null);
  const [map, setMap] = React.useState<any>(null);
  const [coords, setCoords] = React.useState({ lat: -12.0464, lng: -77.0428 });
  const [geocoder, setGeocoder] = React.useState<any>(null);

  React.useEffect(() => {
    if (!mapRef.current || map) return;

    const script = document.createElement('script');
    const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!mapsKey) {
        console.error('NEXT_PUBLIC_GOOGLE_MAPS_KEY is not configured');
        return;
    }
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&v=3.51`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      const googleMap = new (window as any).google.maps.Map(mapRef.current, {
        zoom: 15,
        center: { lat: coords.lat, lng: coords.lng },
        mapTypeId: 'roadmap',
      });

      const googleMarker = new (window as any).google.maps.Marker({
        position: { lat: coords.lat, lng: coords.lng },
        map: googleMap,
        title: locationName,
      });

      const newGeocoder = new (window as any).google.maps.Geocoder();
      setGeocoder(newGeocoder);

      googleMap.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        googleMarker.setPosition({ lat, lng });
        setCoords({ lat, lng });
        onLocationSelect(lat, lng);
        searchUbigeo(lat, lng);
      });

      markerRef.current = googleMarker;
      setMap(googleMap);
    };

    document.head.appendChild(script);
  }, [mapRef, coords, locationName, onLocationSelect]);

  const searchUbigeo = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/ubigeo/nearest?lat=${lat}&lng=${lng}`);
      const ubigeo = await res.json();
      if (ubigeo && onUbigeoFound) {
        onUbigeoFound(ubigeo.department, ubigeo.province, ubigeo.district, ubigeo.ubigeoCode, ubigeo.id);
      }
    } catch (error) {
      console.error('Error searching ubigeo:', error);
    }
  };

  React.useEffect(() => {
    if (!geocoder || !map) return;

    if (!direccion || !direccion.trim()) {
      const defaultLat = -12.0464;
      const defaultLng = -77.0428;
      setCoords({ lat: defaultLat, lng: defaultLng });
      map.setCenter({ lat: defaultLat, lng: defaultLng });
      if (markerRef.current) {
        markerRef.current.setPosition({ lat: defaultLat, lng: defaultLng });
      }
      return;
    }

    geocoder.geocode({ address: direccion }, async (results: any[], status: string) => {
      if (status === 'OK' && results[0]) {
        const lat = results[0].geometry.location.lat();
        const lng = results[0].geometry.location.lng();
        setCoords({ lat, lng });
        onLocationSelect(lat, lng);
        map.setCenter({ lat, lng });
        map.setZoom(16);
        if (markerRef.current) {
          markerRef.current.setPosition({ lat, lng });
        }
        searchUbigeo(lat, lng);
      } else {
        console.error('Geocode error:', status);
      }
    });
  }, [direccion, geocoder, map, onLocationSelect]);

  return (
    <div className="space-y-2">
      <div ref={mapRef} className="relative h-56 w-full overflow-hidden rounded-card border border-border bg-background" />
      <p className="flex items-center gap-2 text-sm text-text-muted">
        <MapPin size={16} aria-hidden className="shrink-0 text-primary" />
        Ubicación seleccionada: <span className="tabular-nums text-text">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
      </p>
    </div>
  );
}
