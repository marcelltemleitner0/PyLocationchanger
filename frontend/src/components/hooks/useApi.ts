import { useState, useCallback } from 'react';
import type { Device, DeviceInfo, LocationStatus } from '../../types';

export const useApi = (baseUrl: string) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<Set<string>>(new Set());
  const [locationStatus, setLocationStatus] = useState<Record<string, LocationStatus>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSettingLocation, setIsSettingLocation] = useState(false);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/devices`);
      if (!res.ok) throw new Error("Failed to fetch devices");

      const data = await res.json();
      const parsedDevices: Device[] = [];

    for (const [, deviceInfo] of Object.entries(data)) {
        const wifiDevice = (deviceInfo as DeviceInfo).Wifi?.[0];
        if (wifiDevice) {
          parsedDevices.push({
            udid: wifiDevice.Identifier,
            name: wifiDevice.DeviceName,
            productType: wifiDevice.ProductType,
            productVersion: wifiDevice.ProductVersion,
            hasWifi: true,
          });
        }
      }

      setDevices(parsedDevices);
      return { success: true };
    } catch (err) {
      console.error("Error fetching devices:", err);
      return { success: false, error: "Failed to fetch devices" };
    }
  }, [baseUrl]);

  const connectToWifi = useCallback(async (udid: string) => {
    setIsConnecting(true);
    try {
      const res = await fetch(`${baseUrl}/connect_wifi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ udid }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setConnectedDevices((prev) => new Set([...prev, udid]));
        return { success: true, message: `Connected to device successfully` };
      } else {
        throw new Error(data.detail || "Connection failed");
      }
    } catch (err) {
      console.error("Error connecting to WiFi:", err);
      return { 
        success: false, 
        error: `Failed to connect: ${err instanceof Error ? err.message : "Unknown error"}`
      };
    } finally {
      setIsConnecting(false);
    }
  }, [baseUrl]);

  const setLocation = useCallback(async (udid: string, lat: number, lng: number) => {
    setIsSettingLocation(true);
    try {
      const res = await fetch(`${baseUrl}/set_location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          udid,
          coordinate: { lat, lon: lng },
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        return { 
          success: true, 
          message: `Location set to ${lat.toFixed(6)}, ${lng.toFixed(6)}` 
        };
      } else {
        throw new Error(data.detail || "Failed to set location");
      }
    } catch (err) {
      console.error("Error setting location:", err);
      return { 
        success: false, 
        error: `Failed to set location: ${err instanceof Error ? err.message : "Unknown error"}`
      };
    } finally {
      setIsSettingLocation(false);
    }
  }, [baseUrl]);

  const stopLocation = useCallback(async (udid: string) => {
    try {
      const res = await fetch(`${baseUrl}/stop_location/${udid}`, {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        return { success: true, message: "Location simulation stopped" };
      } else {
        throw new Error(data.detail || "Failed to stop location");
      }
    } catch (err) {
      console.error("Error stopping location:", err);
      return { 
        success: false, 
        error: `Failed to stop location: ${err instanceof Error ? err.message : "Unknown error"}`
      };
    }
  }, [baseUrl]);

  const fetchLocationStatus = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/location_status`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLocationStatus(data.location_status);
        }
      }
    } catch (err) {
      console.error("Error fetching location status:", err);
    }
  }, [baseUrl]);

  return {
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
  };
};