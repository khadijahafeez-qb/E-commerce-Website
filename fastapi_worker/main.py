# # fastapi_worker/main.py
# from fastapi import FastAPI
# from fastapi_worker.tasks import calculate_order_stats
# from fastapi_worker.celery_app import celery_app

# app = FastAPI()

# @app.get("/calculate-stats")
# def run_calculate_stats():
#     task = calculate_order_stats.delay()
#     return {"task_id": task.id}
# fastapi_worker/main.py

from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from .db import Base, engine, SessionLocal

app = FastAPI()

# Create tables if not exist
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
