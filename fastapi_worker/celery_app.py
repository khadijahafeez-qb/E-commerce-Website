# fastapi_worker/celery_app.py
from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery = Celery(
    "fastapi_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["fastapi_worker.tasks"]
)

celery.conf.update(
    task_routes={
        "fastapi_worker.tasks.*": {"queue": "default"},
    },
    beat_schedule={  # schedule periodic tasks
        "update-every-2-minutes": {
            "task": "fastapi_worker.tasks.calculate_order_stats",
            "schedule": 120.0,  # every 120 seconds (2 minutes)
        },
    },
    timezone="UTC"
)
