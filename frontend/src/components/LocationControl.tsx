import { MapPin, Play } from 'lucide-react';
import type { LatLng } from 'leaflet';

interface LocationControlProps {
  position: LatLng | null;
  selectedDevice: string;
  connectedDevices: Set<string>;
  onSetLocation: () => void;
  isSettingLocation: boolean;
}

export const LocationControl = ({
  position,
  selectedDevice,
  connectedDevices,
  onSetLocation,
  isSettingLocation,
}: LocationControlProps) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <MapPin className="h-5 w-5 mr-2 text-blue-600" />
        Location Control
      </h2>

      {position && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Selected Location:</strong>
          </p>
          <p className="text-sm text-gray-600">
            {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </p>
        </div>
      )}

      <button
        onClick={onSetLocation}
        disabled={
          !selectedDevice ||
          !position ||
          !connectedDevices.has(selectedDevice) ||
          isSettingLocation
        }
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        <Play className="h-4 w-4" />
        <span>
          {isSettingLocation ? "Setting Location..." : "Set Location"}
        </span>
      </button>

      {(!selectedDevice || !connectedDevices.has(selectedDevice)) && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          Select and connect a device first
        </p>
      )}
    </div>
  );
};