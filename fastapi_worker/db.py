# fastapi_worker/db.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

# ✅ Use the FASTAPI_DB_URL variable from .env
DATABASE_URL = os.getenv("FASTAPI_DB_URL")

if not DATABASE_URL:
    raise ValueError("FASTAPI_DB_URL is not set in .env")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()
