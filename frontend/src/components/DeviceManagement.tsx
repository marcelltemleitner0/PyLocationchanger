import { Smartphone, Wifi, MapPin, Square } from 'lucide-react';
import type { Device, LocationStatus } from '../types';

interface DeviceManagementProps {
  devices: Device[];
  selectedDevice: string;
  onDeviceSelect: (udid: string) => void;
  connectedDevices: Set<string>;
  onConnectWifi: (udid: string) => void;
  isConnecting: boolean;
  locationStatus: Record<string, LocationStatus>;
  onStopLocation: (udid: string) => void;
}

export const DeviceManagement = ({
  devices,
  selectedDevice,
  onDeviceSelect,
  connectedDevices,
  onConnectWifi,
  isConnecting,
  locationStatus,
  onStopLocation,
}: DeviceManagementProps) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex-1 flex flex-col">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Smartphone className="h-5 w-5 mr-2 text-blue-600" />
        Device Management
      </h2>

      <div className="flex-1 flex flex-col space-y-4">
        <select
          value={selectedDevice}
          onChange={(e) => onDeviceSelect(e.target.value)}
          className="w-full border border-gray-300 rounded-lg py-3 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose a device...</option>
          {devices.map((device) => (
            <option key={device.udid} value={device.udid}>
              {device.name} ({device.productType})
            </option>
          ))}
        </select>

        {selectedDevice && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Wifi className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">WiFi Connection</span>
              </div>
              <div className="flex items-center space-x-2">
                {connectedDevices.has(selectedDevice) ? (
                  <span className="text-sm text-green-600 font-medium">
                    Connected
                  </span>
                ) : (
                  <button
                    onClick={() => onConnectWifi(selectedDevice)}
                    disabled={isConnecting}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isConnecting ? "Connecting..." : "Connect"}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">Location Status</span>
              </div>
              <div className="flex items-center space-x-2">
                {locationStatus[selectedDevice]?.active ? (
                  <button
                    onClick={() => onStopLocation(selectedDevice)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center space-x-1"
                  >
                    <Square className="h-3 w-3" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <span className="text-sm text-gray-500">Inactive</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};