import time

from app.ai.insights import ask, format_rows
from app.database.db import get_connection
from app.database.query_runner import run_select

# pause between questions so the free API limit is not hit
SLEEP_BETWEEN_QUESTIONS = 3


def table_for(file_name):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT table_name FROM uploaded_files "
                "WHERE original_name = %s ORDER BY id DESC LIMIT 1",
                (file_name,),
            )
            row = cur.fetchone()
    finally:
        conn.close()
    if not row:
        raise SystemExit(f"Upload {file_name} first, then run the test again.")
    return row[0]


SALES = table_for("sales_order.csv")
CUSTOMERS = table_for("Customers.csv")
PRODUCTS = table_for("Products.csv")
REGIONS = table_for("Regions.csv")
STATE_REGIONS = table_for("State_Regions.csv")

# (level, question, correct SQL written by hand, compare numbers only?)
# key_sql None means the app should refuse.
TESTS = [
    (
        "basic",
        "What is the total sales amount?",
        f"SELECT SUM(line_total) FROM {SALES}",
        False,
    ),
    (
        "join",
        "Top 5 customers by total sales",
        f"""SELECT c.customer_names, SUM(s.line_total)
            FROM {SALES} s JOIN {CUSTOMERS} c ON s.customer_name_index = c.customer_index
            GROUP BY c.customer_names ORDER BY 2 DESC LIMIT 5""",
        False,
    ),
    (
        "join + year filter",
        "What are the top 3 products by total sales in 2022?",
        f"""SELECT p.product_name, SUM(s.line_total)
            FROM {SALES} s JOIN {PRODUCTS} p ON s.product_description_index = p."index"
            WHERE EXTRACT(YEAR FROM s.orderdate) = 2022
            GROUP BY p.product_name ORDER BY 2 DESC LIMIT 3""",
        False,
    ),
    (
        "join, must show the total",
        "Which state has the highest total sales?",
        f"""SELECT r.state, SUM(s.line_total)
            FROM {SALES} s JOIN {REGIONS} r ON s.delivery_region_index = r.id
            GROUP BY r.state ORDER BY 2 DESC LIMIT 1""",
        False,
    ),
    (
        "3-table join",
        "Total sales by US region such as South, West, Northeast and Midwest",
        f"""SELECT sr.region, SUM(s.line_total)
            FROM {SALES} s
            JOIN {REGIONS} r ON s.delivery_region_index = r.id
            JOIN {STATE_REGIONS} sr ON r.state_code = sr.state_code
            GROUP BY sr.region""",
        False,
    ),
    (
        "share of total (window)",
        "What percentage of total sales comes from each channel?",
        f"""SELECT channel,
                   ROUND((100.0 * SUM(line_total) / SUM(SUM(line_total)) OVER ())::numeric, 2)
            FROM {SALES} GROUP BY channel""",
        False,
    ),
    (
        "monthly trend (numbers only)",
        "Show the total sales for each month of 2023",
        f"""SELECT DATE_TRUNC('month', orderdate) AS month, SUM(line_total)
            FROM {SALES} WHERE EXTRACT(YEAR FROM orderdate) = 2023
            GROUP BY month ORDER BY month""",
        True,
    ),
    (
        "having + count",
        "How many customers have total sales above 8 million?",
        f"""SELECT COUNT(*) FROM (
                SELECT customer_name_index FROM {SALES}
                GROUP BY customer_name_index HAVING SUM(line_total) > 8000000
            ) t""",
        False,
    ),
    (
        "calculated column",
        "What is the total profit for each channel, where profit is line total minus order quantity times total unit cost?",
        f"""SELECT channel, SUM(line_total - order_quantity * total_unit_cost)
            FROM {SALES} GROUP BY channel""",
        False,
    ),
    (
        "refusal",
        "How many orders were returned last month?",
        None,
        False,
    ),
]


def flatten(rows, numbers_only=False):
    values = []
    for row in rows:
        for v in row:
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                values.append(round(float(v), 1))
            elif not numbers_only:
                values.append(str(v))
    return values


def check(question, key_sql, numbers_only):
    try:
        result = ask(question)
    except Exception as e:
        return False, f"exception: {e}", ""

    sql = result.get("sql", "")

    if key_sql is None:
        if "can't be answered" in result.get("error", ""):
            return True, "refused, as expected", sql
        return False, "should have refused", sql

    if "error" in result:
        return False, result["error"], sql

    _, key_rows = run_select(key_sql)
    key_values = flatten(format_rows(key_rows), numbers_only)
    got_values = flatten(result["rows"], numbers_only)
    missing = [v for v in key_values if v not in got_values]

    if missing:
        return False, f"missing values: {missing[:5]}", sql
    return True, "values match", sql


passed = 0
for number, (level, question, key_sql, numbers_only) in enumerate(TESTS, start=1):
    ok, note, sql = check(question, key_sql, numbers_only)
    passed += ok
    print(f"{number}. {'PASS' if ok else 'FAIL'}  [{level}]  {question}  ({note})")
    if not ok and sql:
        print(f"   LLM SQL: {sql}")
    time.sleep(SLEEP_BETWEEN_QUESTIONS)

print(f"\nScore: {passed}/{len(TESTS)}")