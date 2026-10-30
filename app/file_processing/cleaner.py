import re
import warnings

import pandas as pd

# a column becomes number/date only if this share of its values converts
MATCH_RATIO = 0.9

# columns with these words in the name always stay text
TEXT_WORDS = {"id", "phone", "zip", "code", "postal", "pincode"}


def clean_column_names(df):
    new_names = []
    seen = {}

    for position, col in enumerate(df.columns, start=1):
        name = re.sub(r"[^a-z0-9]+", "_", str(col).strip().lower()).strip("_")

        if name == "":
            name = f"column_{position}"

        if name[0].isdigit():
            name = "col_" + name

        if name in seen:
            seen[name] += 1
            name = f"{name}_{seen[name]}"
        else:
            seen[name] = 1

        new_names.append(name)

    df.columns = new_names
    return df

def is_text_column(series):
    return series.dtype == "object" or pd.api.types.is_string_dtype(series)

def trim_text(df):
    # remove spaces around text; a cell with only spaces becomes empty (None)
    for col in df.columns:
        if is_text_column(df[col]):
            df[col] = df[col].apply(
                lambda v: (v.strip() or None) if isinstance(v, str) else v
            )
    return df


def remove_empty_and_duplicates(df):
    df = df.dropna(how="all")           # rows with nothing in them
    df = df.dropna(axis=1, how="all")   # columns with nothing in them
    df = df.drop_duplicates()           # exact duplicate rows
    return df.reset_index(drop=True)


def must_stay_text(column_name):
    return any(word in TEXT_WORDS for word in column_name.split("_"))


def detect_types(df):
    for col in df.columns:
        # only text columns need checking; real numbers/dates are already typed
        if not is_text_column(df[col]) or must_stay_text(col):
            continue

        values = df[col].dropna()
        if values.empty:
            continue

        # 1. try number: remove , $ % and spaces first
        as_text = values.astype(str).str.replace(r"[,$%\s]", "", regex=True)
        as_number = pd.to_numeric(as_text, errors="coerce")
        if as_number.notna().sum() / len(values) >= MATCH_RATIO:
            cleaned = df[col].astype(str).str.replace(r"[,$%\s]", "", regex=True)
            df[col] = pd.to_numeric(cleaned, errors="coerce")
            continue

        # 2. try date
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            as_date = pd.to_datetime(values, errors="coerce")
        if as_date.notna().sum() / len(values) >= MATCH_RATIO:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                df[col] = pd.to_datetime(df[col], errors="coerce")
            continue

        # 3. otherwise it stays text

    return df


def clean_dataframe(df):
    df = clean_column_names(df)
    df = trim_text(df)
    df = remove_empty_and_duplicates(df)
    df = detect_types(df)
    return df