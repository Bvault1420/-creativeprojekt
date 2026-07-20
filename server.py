#!/usr/bin/env python3
"""Le coin Internet – einfacher Localhost-Server."""

from __future__ import annotations

import os
import socket
import sys
import threading
import time
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def find_free_port(preferred: int = 8080) -> int:
    for port in (preferred, 8081, 8082, 8083, 8090, 8888, 9000, 5500):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(("0.0.0.0", port))
                return port
            except OSError:
                continue
    raise SystemExit("Kein freier Port gefunden.")


def main() -> int:
    os.chdir(ROOT)
    preferred = int(os.environ.get("PORT", "8080"))
    port = find_free_port(preferred)
    url = f"http://localhost:{port}/"

    handler = SimpleHTTPRequestHandler
    server = ThreadingHTTPServer(("0.0.0.0", port), handler)

    def say(msg: str = "") -> None:
        print(msg, flush=True)

    say()
    say("  Le coin Internet")
    say("  ================")
    say()
    say(f"  → {url}")
    say()
    say("  Beenden: Strg + C")
    say()

    def open_browser() -> None:
        time.sleep(0.4)
        try:
            webbrowser.open(url)
        except Exception:
            pass

    if "--no-browser" not in sys.argv:
        threading.Thread(target=open_browser, daemon=True).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server gestoppt.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
