from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from models import WiFiConnectionData, LocationData
from device_service import DeviceService
from managers import TunnelManager, LocationManager

tunnel_managers = {}
location_managers = {}
rsd_data_map = {}

router = APIRouter()

@router.get("/devices")
async def list_devices_endpoint():
    try:
        connected_devices = DeviceService.list_connected_devices()
        return connected_devices
    except ConnectionAbortedError:
        raise HTTPException(status_code=503, detail="Connection aborted while retrieving devices")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/connect_wifi")
async def connect_wifi_endpoint(data: WiFiConnectionData):
    try:
        udid = data.udid
        tunnel_manager = TunnelManager()

        if tunnel_manager.start_tunnel(udid):
            tunnel_managers[udid] = tunnel_manager
            rsd_data_map.setdefault(udid, {})["Wifi"] = {
                "host": tunnel_manager.rsd_host,
                "port": tunnel_manager.rsd_port
            }

            return JSONResponse(content={
                'success': True,
                'message': 'WiFi connection initiated',
                'udid': udid,
                'rsd_host': tunnel_manager.rsd_host,
                'rsd_port': tunnel_manager.rsd_port
            })
        else:
            raise HTTPException(status_code=500, detail="Failed to start tunnel")

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection failed: {str(e)}")

@router.post("/set_location")
async def set_location_endpoint(data: LocationData):
    try:
        udid = data.udid
        coordinate = data.coordinate

        if udid not in tunnel_managers:
            raise HTTPException(status_code=400, detail="No active tunnel for this device. Connect to WiFi first.")

        tunnel_manager = tunnel_managers[udid]

        if not tunnel_manager.is_active():
            raise HTTPException(status_code=400, detail="Tunnel is not active. Reconnect to WiFi first.")

        if udid in location_managers:
            location_managers[udid].stop_location_setting()

        location_manager = LocationManager()
        location_manager.start_location_setting(
            coordinate,
            tunnel_manager.rsd_host,
            tunnel_manager.rsd_port
        )

        location_managers[udid] = location_manager

        return JSONResponse(content={
            'success': True,
            'message': 'Location setting initiated',
            'udid': udid,
            'latitude': coordinate.lat,
            'longitude': coordinate.lon
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Location setting failed: {str(e)}")

@router.post("/stop_location/{udid}")
async def stop_location_endpoint(udid: str):
    try:
        if udid not in location_managers:
            raise HTTPException(status_code=400, detail="No active location setting for this device")

        location_manager = location_managers[udid]
        location_manager.stop_location_setting()
        del location_managers[udid]

        return JSONResponse(content={
            'success': True,
            'message': 'Location setting stopped',
            'udid': udid
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop location setting: {str(e)}")

@router.get("/location_status")
async def get_location_status():
    status = {}
    for udid, manager in location_managers.items():
        status[udid] = {'active': manager.is_active()}

    return JSONResponse(content={'success': True, 'location_status': status})

@router.get("/location_status/{udid}")
async def get_location_status_for_device(udid: str):
    if udid in location_managers:
        manager = location_managers[udid]
        return JSONResponse(content={
            'success': True,
            'udid': udid,
            'active': manager.is_active()
        })
    else:
        return JSONResponse(content={
            'success': False,
            'udid': udid,
            'active': False,
            'message': 'No location setting active for this device'
        })

@router.get("/rsd")
async def get_rsd_endpoint():
    if rsd_data_map:
        return JSONResponse(content={
            'success': True,
            'rsd_data': rsd_data_map
        })
    else:
        return JSONResponse(content={
            'success': False,
            'error': 'No active tunnels',
            'rsd_data': {}
        })

@router.get("/rsd/{udid}")
async def get_rsd_for_device(udid: str):
    if udid in rsd_data_map and udid in tunnel_managers:
        tunnel_manager = tunnel_managers[udid]
        return JSONResponse(content={
            'success': True,
            'udid': udid,
            'rsd_host': tunnel_manager.rsd_host,
            'rsd_port': tunnel_manager.rsd_port,
            'tunnel_active': tunnel_manager.is_active()
        })
    else:
        return JSONResponse(content={
            'success': False,
            'error': f'No active tunnel for device {udid}'
        })

def cleanup_resources():
    for udid, manager in location_managers.items():
        try:
            manager.stop_location_setting()
        except Exception as e:
            print(f"Error stopping location manager for {udid}: {e}")

    for udid, manager in tunnel_managers.items():
        try:
            manager.stop_tunnel()
        except Exception as e:
            print(f"Error stopping tunnel manager for {udid}: {e}")

    tunnel_managers.clear()
    location_managers.clear()
    rsd_data_map.clear()
