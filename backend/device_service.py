from pymobiledevice3.usbmux import list_devices
from pymobiledevice3.lockdown import create_using_usbmux
from pymobiledevice3.services.amfi import AmfiService


class DeviceService:

    @staticmethod
    def list_connected_devices():
        """
        List all connected iOS devices
        """
        devices = {}

        for device in list_devices():
            udid = device.serial
            conn_type = "Wifi" if device.connection_type == "Network" else device.connection_type

            lockdown = create_using_usbmux(
                udid,
                connection_type=device.connection_type,
                autopair=True
            )
            info = lockdown.short_info
            info['wifiState'] = True

            devices.setdefault(udid, {}).setdefault(conn_type, []).append(info)

        return devices

    @staticmethod
    def get_device_info(udid):
        """
        Get detailed information for a specific device
        """
        devices = DeviceService.list_connected_devices()

        if udid not in devices:
            raise ValueError(f"Device {udid} not found")

        return devices[udid]
    
    @staticmethod
    def check_developer_status(udid):
        """
        Check the developer status on device
        """
        lockdown = create_using_usbmux(
                udid,
                connection_type= "Network",
                autopair=True
            )
        return lockdown.developer_mode_status

    @staticmethod
    def enable_developer_status(udid):
        """
        Enables the developer mode on device
        """
        lockdown = create_using_usbmux(
                udid,
                connection_type= "USB",
                autopair=True
            )
        AmfiService(lockdown).enable_developer_mode()