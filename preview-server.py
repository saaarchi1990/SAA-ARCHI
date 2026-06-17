from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class SpaHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        requested = self.path.split("?", 1)[0].split("#", 1)[0]
        local_path = Path(self.translate_path(requested))

        if requested not in ("", "/") and not local_path.exists():
            self.path = "/index.html"

        return super().do_GET()


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 4173), SpaHandler)
    print("SAA ARCHI preview: http://127.0.0.1:4173/index.html")
    print("Routes SPA activees: /about et /projects/...")
    server.serve_forever()
