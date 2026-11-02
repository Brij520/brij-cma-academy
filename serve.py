#!/usr/bin/env python3
"""PROJECT CMA — local development server.

The app fetches JSON files and uses ES modules, so it must be served over HTTP.
Opening index.html directly from the filesystem will leave it on the loading screen.

    python3 serve.py            # http://localhost:8000
    python3 serve.py 8080       # custom port
    python3 serve.py 8080 127.0.0.1

No dependencies, no build step, no caching. Stop with Ctrl+C.
"""

from __future__ import annotations

import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))

EXTRA_TYPES = {
    ".json": "application/json; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".webmanifest": "application/manifest+json",
}


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, **EXTRA_TYPES}

    def end_headers(self) -> None:
        # Never cache during development; a stale JSON file looks like a bug in the app.
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def log_message(self, fmt: str, *args) -> None:
        if "--quiet" in sys.argv:
            return
        sys.stderr.write("  %s\n" % (fmt % args))


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    host = args[1] if len(args) > 1 else "0.0.0.0"
    try:
        port = int(args[0]) if args else 8000
    except ValueError:
        print(f"Port must be a number, got {args[0]!r}", file=sys.stderr)
        return 2

    if not os.path.exists(os.path.join(ROOT, "index.html")):
        print("index.html not found — run this from the repository root.", file=sys.stderr)
        return 2

    handler = partial(Handler, directory=ROOT)
    httpd = ThreadingHTTPServer((host, port), handler)
    print("PROJECT CMA is running")
    print(f"  Local:   http://localhost:{port}/")
    if host == "0.0.0.0":
        print(f"  Network: http://<this-machine-ip>:{port}/")
    print("  Press Ctrl+C to stop.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        httpd.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
