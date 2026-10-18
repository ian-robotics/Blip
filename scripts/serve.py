"""Local development server with uncached assets for native ES module editing."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class DevelopmentHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).resolve().parent.parent), **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()

    def do_GET(self):
        # Do not accept stale conditional requests after editing modules quickly.
        for header in ('If-Modified-Since', 'If-None-Match'):
            if header in self.headers:
                del self.headers[header]
        super().do_GET()


if __name__ == '__main__':
    print('Blip: http://localhost:8000 (development cache disabled)', flush=True)
    try:
        ThreadingHTTPServer(('', 8000), DevelopmentHandler).serve_forever()
    except KeyboardInterrupt:
        pass
