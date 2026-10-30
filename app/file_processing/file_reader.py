import pandas as pd


def read_file(file_path):
    name = str(file_path).lower()

    if name.endswith(".csv"):
        try:
            df = pd.read_csv(file_path, encoding="utf-8-sig")
        except UnicodeDecodeError:
            df = pd.read_csv(file_path, encoding="latin-1")
    elif name.endswith(".xlsx"):
        df = pd.read_excel(file_path, engine="openpyxl")
    elif name.endswith(".xls"):
        df = pd.read_excel(file_path, engine="xlrd")
    else:
        raise ValueError("Only CSV or Excel files are allowed")

    if df.empty:
        raise ValueError("The file is empty")

    return df