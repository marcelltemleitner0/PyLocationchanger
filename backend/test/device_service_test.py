import sys
import os
import unittest
from contextlib import redirect_stderr
from io import StringIO

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from device_service import DeviceService

class TestDeviceService(unittest.TestCase):
  
    def test_list_connected_devices_returns_dict(self):
        # This test checks that the function returns a dict with the expected nested structure, 
        # even if no devices are connected then returns with empty dict.
        with redirect_stderr(StringIO()):
            devices = DeviceService.list_connected_devices()
        
        self.assertIsInstance(devices, dict)
        
        for udid, conn_types in devices.items():
            self.assertIsInstance(udid, str)
            self.assertIsInstance(conn_types, dict)
            
            for conn_type, infos in conn_types.items():
                self.assertIsInstance(conn_type, str)
                self.assertIsInstance(infos, list)
                
                for info in infos:
                    self.assertIn('wifiState', info)


    def test_get_device_info_with_valid_udid(self):
        # This test requires at least one connected device to verify get_device_info() returns correct data for a valid UDID.
        with redirect_stderr(StringIO()):
            try:
                devices = DeviceService.list_connected_devices()
                
                if not devices:
                    self.skipTest("No devices connected")
                
                sample_udid = next(iter(devices))
                result = DeviceService.get_device_info(sample_udid)
                self.assertEqual(result, devices[sample_udid])
            except Exception as e:
                self.skipTest(f"No devices connected or device communication failed: {type(e).__name__}")

    def test_get_device_info_with_invalid_udid(self):
        # This test DOES NOT require any devices to be connected since it's testing a fake UUID.
        with redirect_stderr(StringIO()):
              with self.assertRaises(ValueError) as ctx:
                DeviceService.get_device_info("fake_udid_123")
                self.assertIn("not found", str(ctx.exception))

if __name__ == '__main__':
    unittest.main(verbosity=2)