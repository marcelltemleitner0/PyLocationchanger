import unittest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from routes import router
from fastapi import FastAPI



app = FastAPI()
app.include_router(router)

client = TestClient(app)


import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from fastapi import FastAPI
from routes import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)

class TestDevicesEndpoint(unittest.TestCase):

    @patch("device_service.DeviceService.list_connected_devices")
    def test_list_devices_success(self, mock_list):
         # Tests successful device list retrieval returns status 200 with devices.
        mock_list.return_value = {"devices": ["dev1", "dev2"]}
        response = client.get("/devices")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"devices": ["dev1", "dev2"]})

    @patch("device_service.DeviceService.list_connected_devices")
    def test_list_devices_connection_aborted(self, mock_list):     
        # Tests 503 response when connection is aborted during device list retrieval.
        mock_list.side_effect = ConnectionAbortedError()
        response = client.get("/devices")
        self.assertEqual(response.status_code, 503)
        self.assertIn("Connection aborted", response.text)

    @patch("device_service.DeviceService.list_connected_devices")

    def test_list_devices_other_exception(self, mock_list):
        # Tests 500 response on unexpected error during device list retrieval.
        mock_list.side_effect = Exception("Unexpected error")
        response = client.get("/devices")
        self.assertEqual(response.status_code, 500)
        self.assertIn("Internal server error", response.text)

if __name__ == "__main__":
    unittest.main()
