#!/usr/bin/env python3
import json
import sqlite3
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DB_PATH = Path("garden_plan.db")
HOST = "0.0.0.0"
PORT = 4173


def init_db() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS plots (
              plot_id TEXT PRIMARY KEY,
              vegetable TEXT NOT NULL,
              planted_date TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


class GardenHandler(SimpleHTTPRequestHandler):
    def _send_json(self, payload: dict, status: int = HTTPStatus.OK) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if self.path == "/api/plan":
            with sqlite3.connect(DB_PATH) as conn:
                rows = conn.execute(
                    "SELECT plot_id, vegetable, planted_date, updated_at FROM plots"
                ).fetchall()

            plan = {
                row[0]: {
                    "vegetable": row[1],
                    "plantedDate": row[2],
                    "updatedAt": row[3],
                }
                for row in rows
            }
            self._send_json({"plan": plan})
            return

        super().do_GET()

    def do_POST(self) -> None:
        if self.path != "/api/plot":
            self._send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)
            return

        content_length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(content_length)

        try:
            payload = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json({"error": "Invalid JSON"}, HTTPStatus.BAD_REQUEST)
            return

        required = {"plotId", "vegetable", "plantedDate", "updatedAt"}
        if not required.issubset(payload):
            self._send_json({"error": "Missing required fields"}, HTTPStatus.BAD_REQUEST)
            return

        with sqlite3.connect(DB_PATH) as conn:
            conn.execute(
                """
                INSERT INTO plots(plot_id, vegetable, planted_date, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(plot_id) DO UPDATE SET
                  vegetable=excluded.vegetable,
                  planted_date=excluded.planted_date,
                  updated_at=excluded.updated_at
                """,
                (
                    payload["plotId"],
                    payload["vegetable"],
                    payload["plantedDate"],
                    payload["updatedAt"],
                ),
            )
            conn.commit()

        self._send_json({"ok": True})

    def do_DELETE(self) -> None:
        if not self.path.startswith("/api/plot/"):
            self._send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)
            return

        plot_id = self.path.removeprefix("/api/plot/")
        if not plot_id:
            self._send_json({"error": "Missing plot id"}, HTTPStatus.BAD_REQUEST)
            return

        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("DELETE FROM plots WHERE plot_id = ?", (plot_id,))
            conn.commit()

        self._send_json({"ok": True})


if __name__ == "__main__":
    init_db()
    print(f"Serving on http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), GardenHandler).serve_forever()
