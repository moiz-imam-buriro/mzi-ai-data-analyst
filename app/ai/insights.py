from datetime import date, datetime
from decimal import Decimal

from app.ai.llm import get_llm
from app.ai.sql_generator import generate_sql, validate_sql
from app.database.query_runner import run_select

# Formating decimal and different values
def format_value(value):
    if isinstance(value, Decimal):
        value = int(value) if value == value.to_integral_value() else float(value)

    if isinstance(value, float):
        return round(value, 2)

    if isinstance(value, datetime):
        if value.hour == 0 and value.minute == 0 and value.second == 0:
            return value.strftime("%Y-%m-%d")
        return value.strftime("%Y-%m-%d %H:%M:%S")

    if isinstance(value, date):
        return value.strftime("%Y-%m-%d")

    return value


def format_rows(rows):
    return [[format_value(v) for v in row] for row in rows]

# pickng chart function 
MAX_BAR_ROWS = 30


def column_kind(rows, index):
    for row in rows:
        value = row[index]
        if value is None:
            continue
        if isinstance(value, bool):
            return "text"
        if isinstance(value, (int, float, Decimal)):
            return "number"
        if isinstance(value, date):
            return "date"
        return "text"
    return "text"


def pick_chart(columns, rows):
    no_chart = {"type": None}

    if len(rows) < 2 or len(columns) < 2:
        return no_chart

    kinds = [column_kind(rows, i) for i in range(len(columns))]

    label_index = next((i for i, k in enumerate(kinds) if k in ("date", "text")), None)
    if label_index is None:
        return no_chart

    number_index = next(
        (i for i, k in enumerate(kinds) if k == "number" and i != label_index), None
    )
    if number_index is None:
        return no_chart

    if kinds[label_index] == "date":
        chart_type = "line"
    elif len(rows) <= MAX_BAR_ROWS:
        chart_type = "bar"
    else:
        return no_chart

    return {
        "type": chart_type,
        "x": columns[label_index],
        "y": columns[number_index],
    }

# FROZEN: scored 10/10 on tests/accuracy_test.py on 2026-10-28. Change only if you re-run the test.
SUMMARY_PROMPT = """You are a data analyst. Write a short answer to the question using only the data below.

Question: {question}

SQL that produced the data:
{sql}

Columns: {columns}
Rows (first {shown} of {total}):
{rows}

Rules:
- The rows are already the correct answer to the question: the SQL did all the filtering and calculating. Describe the rows. Never say that you cannot determine the answer.
- 2 or 3 short sentences in plain English.
- Only repeat numbers that appear in the data above. Do not calculate differences, percentages, totals, averages, or growth yourself.
- If the data has only one row, state that one result in a single sentence and nothing else.
- If only some of the rows are shown ("first X of Y"), do not say what is lowest or last. Describe only the top items, and mention how many rows there are in total.
- Name at most 5 items.
- Do not add currency symbols or units unless a column name says so.
- No markdown, no bullet points.
"""

MAX_SUMMARY_ROWS = 20

def summarize(question, columns, rows, sql=""):
    if not rows:
        return "No data was found for this question."

    shown_rows = format_rows(rows[:MAX_SUMMARY_ROWS])
    rows_text = "\n".join(str(r) for r in shown_rows)

    prompt = SUMMARY_PROMPT.format(
        question=question,
        sql=sql,
        columns=", ".join(columns),
        shown=len(shown_rows),
        total=len(rows),
        rows=rows_text,
    )
    return get_llm().invoke(prompt).content.strip()

def ask(question):
    try:
        sql = validate_sql(generate_sql(question))
        columns, rows = run_select(sql)
    except Exception as e:
        return {"question": question, "error": str(e)}

    return {
        "question": question,
        "sql": sql,
        "columns": columns,
        "rows": format_rows(rows),
        "chart": pick_chart(columns, rows),
        "summary": summarize(question, columns, rows, sql),
    }