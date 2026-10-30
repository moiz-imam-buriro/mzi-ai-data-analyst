from psycopg2.errors import UndefinedTable
from psycopg2 import sql

from app.database.db import get_connection


def get_files():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, original_name, row_count, columns, created_at "
                "FROM uploaded_files ORDER BY id"
            )
            rows = cur.fetchall()
    except UndefinedTable:
        return []
    finally:
        conn.close()

    return [
        {
            "id": r[0],
            "name": r[1],
            "rows": r[2],
            "columns": [c["name"] for c in r[3]],
            "uploaded_at": str(r[4]),
        }
        for r in rows
    ]

def delete_file(file_id):
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT table_name FROM uploaded_files WHERE id = %s", (file_id,)
                )
                row = cur.fetchone()
                if not row:
                    return False
                cur.execute(
                    sql.SQL("DROP TABLE IF EXISTS {}").format(sql.Identifier(row[0]))
                )
                cur.execute("DELETE FROM uploaded_files WHERE id = %s", (file_id,))
                return True
    finally:
        conn.close()