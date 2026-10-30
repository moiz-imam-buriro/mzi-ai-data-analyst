from app.database.db import get_connection


def run_select(sql):
    conn = get_connection()
    try:
        conn.set_session(readonly=True)
        with conn.cursor() as cur:
            cur.execute("SET statement_timeout = 15000")
            cur.execute(sql)
            columns = [c[0] for c in cur.description]
            rows = cur.fetchall()
        return columns, rows
    finally:
        conn.close()