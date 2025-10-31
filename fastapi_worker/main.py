# fastapi_worker/main.py
from fastapi import FastAPI
from fastapi_worker.db import SessionLocal
from fastapi_worker.models import OrderStats
from sqlalchemy.orm import Session
from sqlalchemy import desc

app = FastAPI()

