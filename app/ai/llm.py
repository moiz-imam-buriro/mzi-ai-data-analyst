import os

from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")


def get_llm():
    return ChatGroq(
        model=MODEL,
        temperature=0,
        api_key=os.getenv("GROQ_API_KEY"),
    )