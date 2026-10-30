import uuid

import pandas as pd
from psycopg2 import sql
from psycopg2.extras import Json, execute_values

from app.database.db import get_connection


def pg_type(series):
    if pd.api.types.is_bool_dtype(series):
        return "BOOLEAN"
    if pd.api.types.is_integer_dtype(series):
        return "BIGINT"
    if pd.api.types.is_float_dtype(series):
        return "DOUBLE PRECISION"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "TIMESTAMP"
    return "TEXT"


def make_columns_info(df):
    info = []
    for col in df.columns:
        samples = [str(v) for v in df[col].dropna().unique()[:5]]
        info.append({"name": col, "type": pg_type(df[col]), "samples": samples})
    return info


def save_dataframe(df, original_name):
    columns_info = make_columns_info(df)
    table_name = "data_" + uuid.uuid4().hex[:8]

    # 1. info table (made once, later calls skip it)
    create_info_table = """
        CREATE TABLE IF NOT EXISTS uploaded_files (
            id SERIAL PRIMARY KEY,
            original_name TEXT NOT NULL,
            table_name TEXT NOT NULL UNIQUE,
            description TEXT,
            columns JSONB NOT NULL,
            row_count INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """

    # 2. data table for this file
    column_defs = sql.SQL(", ").join(
        sql.SQL("{} {}").format(sql.Identifier(c["name"]), sql.SQL(c["type"]))
        for c in columns_info
    )
    create_data_table = sql.SQL("CREATE TABLE {} ({})").format(
        sql.Identifier(table_name), column_defs
    )

    # 3. insert the rows (NaN / NaT become NULL)
    clean = df.astype(object).where(df.notna(), None)
    rows = list(clean.itertuples(index=False, name=None))
    insert_rows = sql.SQL("INSERT INTO {} ({}) VALUES %s").format(
        sql.Identifier(table_name),
        sql.SQL(", ").join(sql.Identifier(c) for c in df.columns),
    )

    # 4. save the file info
    insert_info = """
        INSERT INTO uploaded_files (original_name, table_name, columns, row_count)
        VALUES (%s, %s, %s, %s)
    """

    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(create_info_table)
                cur.execute(create_data_table)
                execute_values(cur, insert_rows, rows, page_size=5000)
                cur.execute(
                    insert_info,
                    (original_name, table_name, Json(columns_info), len(df)),
                )
    finally:
        conn.close()

    return {
        "table_name": table_name,
        "row_count": len(df),
        "columns": columns_info,
    }