
from pydantic import BaseModel
from typing import Optional


class WiFiConnectionData(BaseModel):
    """Model for WiFi connection request data"""
    udid: str
    ios_version: Optional[str] = None
    connType: Optional[str] = None


class Coordinate(BaseModel):
    """Model for GPS coordinates"""
    lat: float
    lon: float


class LocationData(BaseModel):
    """Model for location setting request data"""
    udid: str
    coordinate: Coordinate