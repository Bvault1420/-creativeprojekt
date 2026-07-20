#!/usr/bin/env python3
"""
Funktionaler Localhost für die Schulprojekte.

Features:
- PC + WLAN (Safari auf Tablet/iPad)
- API: /api/info, /api/health, /api/qr.svg
- Auto-Port, LAN-IP, Browser öffnen
- Live-Status für die Startseite
"""

from __future__ import annotations

import argparse
import io
import json
import os
import socket
import sys
import threading
import time
import webbrowser
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
START_TIME = time.time()
STATS: dict[str, Any] = {"requests": 0, "last_path": "/", "clients": set()}


def detect_lan_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.settimeout(0.3)
            s.connect(("1.1.1.1", 80))
            ip = s.getsockname()[0]
            if ip and not ip.startswith("127."):
                return ip
    except OSError:
        pass
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ip = info[4][0]
            if ip and not ip.startswith("127."):
                return ip
    except OSError:
        pass
    return ""


def find_free_port(preferred: int) -> int:
    for port in [preferred, 8081, 8082, 8083, 8090, 8888, 9000]:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(("0.0.0.0", port))
                return port
            except OSError:
                continue
    raise RuntimeError("Kein freier Port gefunden.")


def project_list() -> list[dict[str, Any]]:
    projects = [
        {
            "id": "le-coin-internet",
            "title": "Le coin Internet",
            "tag": "Französisch",
            "path": "le-coin-internet/",
            "desc": "Lehrbuch-Seite mit Quiz Vrai/Faux und Übersetzung",
        },
        {
            "id": "creative",
            "title": "Meine Ultra-Cool Website",
            "tag": "Creative",
            "path": "Projekte Creative/",
            "desc": "Uhr, Todos, Quotes und Reaktionsspiel",
        },
        {
            "id": "dayflow",
            "title": "DayFlow – Live Krypto Dashboard",
            "tag": "DayFlow",
            "path": "dayflow/",
            "desc": "Charts, Watchlist, Login und Mehrsprachigkeit",
        },
    ]
    for p in projects:
        index = ROOT / p["path"] / "index.html"
        p["ok"] = index.is_file()
        href = "/" + p["path"].replace(" ", "%20")
        if not href.endswith("/"):
            href += "/"
        p["href"] = href
    return projects


def build_info(port: int, lan_ip: str) -> dict[str, Any]:
    local_url = f"http://127.0.0.1:{port}/"
    tablet_url = f"http://{lan_ip}:{port}/" if lan_ip else None
    return {
        "ok": True,
        "name": "Schulprojekte Localhost",
        "port": port,
        "lanIp": lan_ip or None,
        "localUrl": local_url,
        "tabletUrl": tablet_url,
        "projects": project_list(),
        "uptimeSec": int(time.time() - START_TIME),
        "requests": STATS["requests"],
        "clients": len(STATS["clients"]),
        "lastPath": STATS["last_path"],
        "startedAt": datetime.fromtimestamp(START_TIME, tz=timezone.utc).isoformat(),
        "python": sys.version.split()[0],
    }


def make_qr_svg(text: str) -> bytes:
    """QR als SVG – bevorzugt Library qrcode, sonst einfacher Hinweis."""
    try:
        import qrcode
        import qrcode.image.svg

        img = qrcode.make(
            text,
            image_factory=qrcode.image.svg.SvgPathImage,
            border=2,
            box_size=10,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
        )
        buf = io.BytesIO()
        img.save(buf)
        return buf.getvalue()
    except Exception:
        safe = (
            text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
        )
        svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280">
  <rect width="280" height="280" fill="#fff" rx="12"/>
  <text x="140" y="120" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#111">
    QR-Bibliothek fehlt
  </text>
  <foreignObject x="20" y="140" width="240" height="100">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font:12px sans-serif;word-break:break-all;text-align:center;color:#333">
      {safe}
    </div>
  </foreignObject>
</svg>
"""
        return svg.encode("utf-8")


class SchoolHandler(SimpleHTTPRequestHandler):
    port: int = 8080
    lan_ip: str = ""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt: str, *args: Any) -> None:
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def end_headers(self) -> None:
        if self.path.startswith("/api/"):
            self.send_header("Cache-Control", "no-store")
            self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def _send_json(self, payload: dict[str, Any], status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        STATS["requests"] += 1
        STATS["last_path"] = self.path
        try:
            STATS["clients"].add(self.client_address[0])
        except Exception:
            pass

        parsed = urlparse(self.path)
        path = parsed.path

        if path in ("/api/info", "/api/status"):
            self._send_json(build_info(self.port, self.lan_ip))
            return

        if path == "/api/health":
            self._send_json({"ok": True, "uptimeSec": int(time.time() - START_TIME)})
            return

        if path == "/api/qr.svg":
            qs = parse_qs(parsed.query)
            info = build_info(self.port, self.lan_ip)
            url = (qs.get("url") or [None])[0] or info.get("tabletUrl") or info["localUrl"]
            svg = make_qr_svg(url)
            self.send_response(200)
            self.send_header("Content-Type", "image/svg+xml; charset=utf-8")
            self.send_header("Content-Length", str(len(svg)))
            self.end_headers()
            self.wfile.write(svg)
            return

        return super().do_GET()


def print_banner(info: dict[str, Any]) -> None:
    print()
    print("  Schulprojekte – funktionaler Localhost")
    print("  ======================================")
    print()
    print("  Am Computer:")
    print(f"  → {info['localUrl']}")
    print()
    if info.get("tabletUrl"):
        print("  Am Tablet / iPad (Safari, gleiches WLAN):")
        print(f"  → {info['tabletUrl']}")
        print("  → QR-Code auf der Startseite scannen")
    else:
        print("  Hinweis: WLAN-IP nicht gefunden – Adresse steht in den Netzwerkeinstellungen.")
    print()
    print("  API: /api/info  ·  /api/qr.svg  ·  /api/health")
    print("  Stop: Strg + C")
    print()


def main() -> int:
    parser = argparse.ArgumentParser(description="Schulprojekte Localhost-Server")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8080")))
    parser.add_argument("--no-browser", action="store_true")
    parser.add_argument("--bind", default="0.0.0.0")
    args = parser.parse_args()

    os.chdir(ROOT)
    port = find_free_port(args.port)
    lan_ip = detect_lan_ip()

    SchoolHandler.port = port
    SchoolHandler.lan_ip = lan_ip

    info = build_info(port, lan_ip)
    tablet = info.get("tabletUrl") or info["localUrl"]
    (ROOT / ".tablet-url.txt").write_text(tablet + "\n", encoding="utf-8")
    (ROOT / ".localhost-info.json").write_text(
        json.dumps(info, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print_banner(info)
    server = ThreadingHTTPServer((args.bind, port), SchoolHandler)

    if not args.no_browser:

        def _open() -> None:
            time.sleep(0.45)
            try:
                webbrowser.open(info["localUrl"])
            except Exception:
                pass

        threading.Thread(target=_open, daemon=True).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server gestoppt.")
        return 0
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
