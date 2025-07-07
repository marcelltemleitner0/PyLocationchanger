import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import type { LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import L from 'leaflet'

import { SearchLocation } from "./components/SearchLocation";
import { DeviceManagement } from "./components/DeviceManagement";
import { LocationControl } from "./components/LocationControl";
import { MapComponent } from "./components/MapComponent";
import { useApi } from "./components/hooks/useApi";
import type { Message } from "./types";

export default function App() {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [fromSearch, setFromSearch] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const BASE_URL = "http://127.0.0.1:8000";
  const {
    devices,
    connectedDevices,
    locationStatus,
    isConnecting,
    isSettingLocation,
    fetchDevices,
    connectToWifi,
    setLocation,
    stopLocation,
    fetchLocationStatus,
  } = useApi(BASE_URL);

  const showMessage = (type: "success" | "error" | "info", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    const initializeData = async () => {
      const deviceResult = await fetchDevices();
      if (!deviceResult.success) {
        showMessage("error", deviceResult.error || "Failed to fetch devices");
      }
      fetchLocationStatus();
    };

    initializeData();
  }, [fetchDevices, fetchLocationStatus]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition(new L.LatLng(lat, lng));
    setFromSearch(true);
  };


  const handleMapClick = (latlng: LatLng) => {
    setPosition(latlng);
    setFromSearch(false);
  };


  const handleConnectWifi = async (udid: string) => {
    const result = await connectToWifi(udid);
    if (result.success) {
      showMessage("success", result.message || "Connected successfully");
    } else {
      showMessage("error", result.error || "Connection failed");
    }
  };

  const handleSetLocation = async () => {
    if (!selectedDevice || !position) {
      showMessage("error", "Please select a device and set a location on the map");
      return;
    }

    const result = await setLocation(selectedDevice, position.lat, position.lng);
    if (result.success) {
      showMessage("success", result.message || "Location set successfully");
      fetchLocationStatus();
    } else {
      showMessage("error", result.error || "Failed to set location");
    }
  };

  const handleStopLocation = async (udid: string) => {
    const result = await stopLocation(udid);
    if (result.success) {
      showMessage("success", result.message || "Location stopped successfully");
      fetchLocationStatus();
    } else {
      showMessage("error", result.error || "Failed to stop location");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg border ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : message.type === "error"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {message.text}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8 h-[700px]">
          <div className="lg:col-span-1 flex flex-col gap-4 h-full">
            <SearchLocation onLocationSelect={handleLocationSelect} />
            
            <DeviceManagement
              devices={devices}
              selectedDevice={selectedDevice}
              onDeviceSelect={setSelectedDevice}
              connectedDevices={connectedDevices}
              onConnectWifi={handleConnectWifi}
              isConnecting={isConnecting}
              locationStatus={locationStatus}
              onStopLocation={handleStopLocation}
            />

            <LocationControl
              position={position}
              selectedDevice={selectedDevice}
              connectedDevices={connectedDevices}
              onSetLocation={handleSetLocation}
              isSettingLocation={isSettingLocation}
            />
          </div>

          <MapComponent
            position={position}
            fromSearch={fromSearch}
            onMapClick={handleMapClick}
          />
        </div>
      </div>
    </div>
  );
}