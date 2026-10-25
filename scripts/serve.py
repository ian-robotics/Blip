"""Local development server and server-only task parsing endpoint."""
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote
from llm_parser import parse_tasks, ParseUnavailable

ROOT = Path(__file__).resolve().parent.parent
ALLOWED_ORIGINS = set(os.environ.get('ALLOWED_ORIGINS',
    'http://localhost:8000,http://127.0.0.1:8000,https://ian-robotics.github.io'
).split(','))
ALLOWED_ORIGINS = {value.strip() for value in ALLOWED_ORIGINS if value.strip()}


class DevelopmentHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        origin = self.headers.get('Origin')
        if origin in ALLOWED_ORIGINS:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')
        super().end_headers()

    def list_directory(self, path):
        self.send_error(404)

    def send_head(self):
        path = unquote(urlsplit(self.path).path)
        resolved = Path(self.translate_path(self.path)).resolve()
        if any(part.startswith('.') for part in path.split('/') if part) or not resolved.is_relative_to(ROOT):
            self.send_error(404)
            return None
        if path != '/' and not path.startswith(('/js/', '/css/', '/assets/')) and path != '/index.html':
            self.send_error(404)
            return None
        return super().send_head()

    def respond(self, status, data):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == '/health':
            return self.respond(200, {'status': 'ok'})
        return super().do_GET()

    def do_OPTIONS(self):
        if self.path != '/api/parse':
            return self.respond(404, {'error': 'not_found'})
        if self.headers.get('Origin') not in ALLOWED_ORIGINS:
            return self.respond(403, {'error': 'origin_rejected'})
        self.send_response(204)
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Max-Age', '600')
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_POST(self):
        if self.path != '/api/parse':
            return self.respond(404, {'error': 'not_found'})
        origin = self.headers.get('Origin')
        if origin and origin not in ALLOWED_ORIGINS:
            return self.respond(403, {'error': 'origin_rejected'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 20000:
                return self.respond(413, {'error': 'input_too_large'})
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict) or not isinstance(data.get('text'), str) or not 1 <= len(data['text'].strip()) <= 4000:
                raise ValueError()
            context = {key: data.get(key, '') for key in ('text', 'now', 'timezone', 'language')}
            if not all(isinstance(value, str) for value in context.values()):
                raise ValueError()
        except (ValueError, TypeError):
            return self.respond(400, {'error': 'invalid_input'})
        try:
            self.respond(200, parse_tasks(context))
        except ParseUnavailable as error:
            self.respond(503, {'error': str(error)})


if __name__ == '__main__':
    host = '0.0.0.0' if os.environ.get('PORT') else '127.0.0.1'
    port = int(os.environ.get('PORT', '8000'))
    print(f'Blip listening on {host}:{port}', flush=True)
    try:
        ThreadingHTTPServer((host, port), DevelopmentHandler).serve_forever()
    except KeyboardInterrupt:
        pass
