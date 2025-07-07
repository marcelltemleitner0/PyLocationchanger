import { useEffect } from 'react';
import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import type { LatLng, LeafletMouseEvent } from 'leaflet';

interface ClickMarkerProps {
  onClick: (latlng: LatLng) => void;
}

function ClickMarker({ onClick }: ClickMarkerProps) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onClick(e.latlng);
    },
  });
  return null;
}

interface RecenterMapProps {
  position: LatLng;
}

function RecenterMap({ position }: RecenterMapProps) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 15);
  }, [position, map]);
  return null;
}

interface MapComponentProps {
  position: LatLng | null;
  fromSearch: boolean;
  onMapClick: (latlng: LatLng) => void;
}

export const MapComponent = ({
  position,
  fromSearch,
  onMapClick,
}: MapComponentProps) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden lg:col-span-2 h-full">
      <div className="h-full w-full">
        <MapContainer
          center={position || [47.497913, 9.040236]}
          zoom={5}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickMarker onClick={onMapClick} />
          {position && (
            <>
              <Marker position={position} />
              {fromSearch && <RecenterMap position={position} />}
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
};