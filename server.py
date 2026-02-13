import socketserver
import os
PORT = int(os.environ.get('PORT', 8080))
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory='dist', **kwargs)
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving dist at port {PORT}")
    httpd.serve_forever()
