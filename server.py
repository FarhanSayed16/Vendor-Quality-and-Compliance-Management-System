"""
VQCMS-XII Local Presentation Server
Run: python server.py
Open: http://localhost:8000/
Zero dependencies — uses only Python standard library.
"""
import http.server, json, sqlite3, os, mimetypes

PORT = 8000
DB_PATH = os.path.join(os.path.dirname(__file__), 'vqcms.db')
mimetypes.add_type('application/wasm', '.wasm')
mimetypes.add_type('application/x-sqlite3', '.db')

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path in ('/', ''):
            self.send_response(302)
            self.send_header('Location', '/web/')
            self.end_headers()
            return
        super().do_GET()

    def do_POST(self):
        if self.path == '/api/query':
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length)) if length else {}
            sql = body.get('sql', '')
            try:
                conn = sqlite3.connect(DB_PATH)
                cur = conn.execute(sql)
                cols = [d[0] for d in cur.description] if cur.description else []
                rows = cur.fetchall()
                conn.close()
                self._json(200, {'columns': cols, 'rows': rows, 'error': None})
            except Exception as e:
                self._json(400, {'columns': [], 'rows': [], 'error': str(e)})
        else:
            self.send_error(404)

    def _json(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(body))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    os.chdir(os.path.dirname(__file__) or '.')
    print(f'Serving VQCMS on http://localhost:{PORT}/')
    http.server.HTTPServer(('', PORT), Handler).serve_forever()
