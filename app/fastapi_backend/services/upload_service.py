import json
import os
import tempfile

from app.database.schema import save_dataframe
from app.file_processing.cleaner import clean_dataframe
from app.file_processing.file_reader import read_file

MAX_SIZE_MB = 20


def process_file(filename, content):
    temp_path = None
    try:
        if len(content) > MAX_SIZE_MB * 1024 * 1024:
            raise ValueError(f"File is bigger than {MAX_SIZE_MB} MB")

        # read_file needs a path that keeps the real extension
        suffix = os.path.splitext(filename)[1].lower()
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            temp_path = tmp.name

        df = clean_dataframe(read_file(temp_path))
        saved = save_dataframe(df, filename)

        preview = json.loads(df.head(10).to_json(orient="records", date_format="iso"))

        return {
            "file": filename,
            "status": "saved",
            "rows": saved["row_count"],
            "columns": [c["name"] for c in saved["columns"]],
            "preview": preview,
        }

    except Exception as e:
        return {"file": filename, "status": "failed", "error": str(e)}

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)