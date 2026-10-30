from app.database.db import get_connection
from app.ai.llm import get_llm
import re

def load_schema_text():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT original_name, table_name, row_count, columns "
                "FROM uploaded_files ORDER BY id"
            )
            files = cur.fetchall()
    finally:
        conn.close()

    if not files:
        raise ValueError("No files uploaded yet")

    parts = []
    for original_name, table_name, row_count, columns in files:
        lines = [f"Table: {table_name}  (from file: {original_name}, {row_count} rows)"]
        for c in columns:
            samples = ", ".join(c["samples"])
            lines.append(f"  - {c['name']} ({c['type']}) examples: {samples}")
        parts.append("\n".join(lines))

    return "\n\n".join(parts)

# FROZEN: scored 10/10 on tests/accuracy_test.py on 2026-10-28. Change only if you re-run the test.
SQL_PROMPT = """You are a PostgreSQL expert. Write ONE SQL query that answers the question.

Database tables:
{schema}

Rules:
- Return only a SELECT query. No explanation, no markdown.
- Use only the tables and columns listed above, with the exact names.
- Put double quotes around every column and table name, for example "index".
- Columns ending in _index or _id point to the key column of another table. Join tables on matching values, using the examples to find the right key.
- Use the file name in brackets to understand what each table contains.
- This is PostgreSQL. ROUND(x, n) only works on numeric values, so cast first: ROUND((expression)::numeric, 2). Also cast to numeric before dividing, so integer division does not round down to zero.
- For percentages, multiply by 100.0 and give the column a clear name such as percentage.
- For each group's share of the whole, divide by the grand total with a window function: 100.0 * SUM("x") / SUM(SUM("x")) OVER (). Do not divide SUM("x") by a plain column.
- If the question cannot be answered with these tables, reply with exactly: CANNOT_ANSWER

Question: {question}
"""


def clean_llm_sql(text):
    # remove ```sql ... ``` fences and extra spaces if the LLM added them
    text = re.sub(r"^```(?:sql)?", "", text.strip(), flags=re.IGNORECASE)
    text = re.sub(r"```$", "", text.strip())
    return text.strip().rstrip(";").strip()


def generate_sql(question):
    schema = load_schema_text()
    prompt = SQL_PROMPT.format(schema=schema, question=question)
    answer = get_llm().invoke(prompt).content
    return clean_llm_sql(answer)

BLOCKED_WORDS = [
    "insert", "update", "delete", "drop", "alter", "truncate", "create",
    "grant", "revoke", "copy", "call", "execute", "do", "vacuum",
]

MAX_ROWS = 100


def get_allowed_tables():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT table_name FROM uploaded_files")
            return {r[0] for r in cur.fetchall()}
    finally:
        conn.close()


def validate_sql(sql):
    sql = sql.strip().rstrip(";").strip()
    lowered = sql.lower()

    if lowered == "cannot_answer":
        raise ValueError("This question can't be answered with the uploaded files.")

    if not (lowered.startswith("select") or lowered.startswith("with")):
        raise ValueError("Only SELECT queries are allowed.")

    if ";" in sql:
        raise ValueError("Only one SQL statement is allowed.")

    for word in BLOCKED_WORDS:
        if re.search(rf"\b{word}\b", lowered):
            raise ValueError(f"The word '{word}' is not allowed.")

    if "uploaded_files" in lowered or "pg_" in lowered or "information_schema" in lowered:
        raise ValueError("This table is not allowed.")

    allowed = get_allowed_tables()
    for table in set(re.findall(r"data_[0-9a-f]{8}", lowered)):
        if table not in allowed:
            raise ValueError(f"Unknown table: {table}")

    if not re.search(r"\blimit\b", lowered):
        sql = f"{sql} LIMIT {MAX_ROWS}"

    return sql
