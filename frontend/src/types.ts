export interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  place_id: string;
}

export interface DeviceInfo {
  Wifi?: Array<{
    Identifier: string;
    DeviceName: string;
    ProductType: string;
    ProductVersion: string;
  }>;
}


export interface Device {
  udid: string;
  name: string;
  productType: string;
  productVersion: string;
  hasWifi: boolean;
}

export interface LocationStatus {
  active: boolean;
  udid?: string;
}

export interface Message {
  type: "success" | "error" | "info";
  text: string;
}
