import time
import asyncio
import threading

from pymobiledevice3.lockdown import create_using_usbmux
from pymobiledevice3.remote.remote_service_discovery import RemoteServiceDiscoveryService
from pymobiledevice3.remote.utils import stop_remoted_if_required, resume_remoted_if_required
from pymobiledevice3.remote.tunnel_service import CoreDeviceTunnelProxy
from pymobiledevice3.services.dvt.dvt_secure_socket_proxy import DvtSecureSocketProxyService
from pymobiledevice3.services.dvt.instruments.location_simulation import LocationSimulation


class TunnelManager:

    def __init__(self):
        self.tunnel_task = None
        self.event_loop = None
        self.thread = None
        self.rsd_host = None
        self.rsd_port = None
        self.shutdown_event = asyncio.Event()

    def start_tunnel(self, udid):
        self.shutdown_event = asyncio.Event()
        self.thread = threading.Thread(target=self._run_tunnel, args=(udid,), daemon=True)
        self.thread.start()

        for _ in range(30):
            if self.rsd_host is not None and self.rsd_port is not None:
                break
            time.sleep(1)


        return self.rsd_host is not None and self.rsd_port is not None

    def _run_tunnel(self, udid):
        try:
            self.event_loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.event_loop)
            self.shutdown_event = asyncio.Event()
            self.event_loop.run_until_complete(self._tunnel_coroutine(udid))
        except Exception as e:
            print(f"Tunnel error for {udid}: {e}")
        finally:
            self._cleanup_event_loop()

    def _cleanup_event_loop(self):
        if self.event_loop and not self.event_loop.is_closed():
            try:
                pending = asyncio.all_tasks(self.event_loop)
                for task in pending:
                    task.cancel()
                if pending:
                    self.event_loop.run_until_complete(
                        asyncio.gather(*pending, return_exceptions=True)
                    )
                self.event_loop.close()
            except Exception as e:
                print(f"Event loop cleanup error: {e}")

    async def _tunnel_coroutine(self, udid):
        try:
            stop_remoted_if_required()
            lockdown = create_using_usbmux(udid)
            service = CoreDeviceTunnelProxy(lockdown)

            async with service.start_tcp_tunnel() as tunnel_result:
                resume_remoted_if_required()
                self.rsd_host = tunnel_result.address
                self.rsd_port = str(tunnel_result.port)

                while not self.shutdown_event.is_set():
                    try:
                        await asyncio.wait_for(self.shutdown_event.wait(), timeout=1.0)
                        break
                    except asyncio.TimeoutError:
                        continue
        except Exception as e:
            print(f"Tunnel coroutine error: {e}")

    def stop_tunnel(self):
        if self.shutdown_event and self.event_loop:
            try:
                self.event_loop.call_soon_threadsafe(self.shutdown_event.set)
            except Exception as e:
                print(f"Error setting shutdown event: {e}")

        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=5)

    def is_active(self):
        return self.thread and self.thread.is_alive()


class LocationManager:

    def __init__(self):
        self.task = None
        self.thread = None
        self.event_loop = None
        self.shutdown_event = asyncio.Event()

    def start_location_setting(self, coordinate, rsd_host, rsd_port):
        if self.thread and self.thread.is_alive():
            self.stop_location_setting()

        self.thread = threading.Thread(
            target=self._run_location_setting,
            args=(coordinate, rsd_host, rsd_port),
            daemon=True
        )
        self.thread.start()

    def _run_location_setting(self, coordinate, rsd_host, rsd_port):
        try:
            self.event_loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.event_loop)
            self.shutdown_event = asyncio.Event()
            self.event_loop.run_until_complete(
                self._location_coroutine(coordinate, rsd_host, rsd_port)
            )
        except Exception as e:
            print(f"Location setting error: {e}")
        finally:
            self._cleanup_event_loop()

    def _cleanup_event_loop(self):
        if self.event_loop and not self.event_loop.is_closed():
            try:
                pending = asyncio.all_tasks(self.event_loop)
                for task in pending:
                    task.cancel()

                if pending:
                    self.event_loop.run_until_complete(
                        asyncio.gather(*pending, return_exceptions=True)
                    )

                self.event_loop.close()
            except Exception as e:
                print(f"Location cleanup error: {e}")

    async def _location_coroutine(self, coordinate, rsd_host, rsd_port):
        try:
            async with RemoteServiceDiscoveryService((rsd_host, int(rsd_port))) as sp_rsd:
                with DvtSecureSocketProxyService(sp_rsd) as dvt:
                    LocationSimulation(dvt).set(coordinate.lat, coordinate.lon)

                    while not self.shutdown_event.is_set():
                        try:
                            await asyncio.wait_for(self.shutdown_event.wait(), timeout=1.0)
                            break
                        except asyncio.TimeoutError:
                            continue

        except asyncio.CancelledError:
            raise
        except Exception as e:
            print(f"Location coroutine error: {e}")

    def stop_location_setting(self):
        if self.shutdown_event and self.event_loop:
            try:
                self.event_loop.call_soon_threadsafe(self.shutdown_event.set)
            except Exception as e:
                print(f"Error setting shutdown event: {e}")

        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=5)

    def is_active(self):
        return self.thread and self.thread.is_alive()
