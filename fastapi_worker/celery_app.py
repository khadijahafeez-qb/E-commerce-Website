from celery import Celery
import os
from dotenv import load_dotenv
from datetime import timedelta

# Load environment variables
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
    beat_schedule={
        "calculate-stats-every-2-min": {
            "task": "calculate_order_stats",
            "schedule": timedelta(minutes=2),  # run every 2 minutes
        },
    },
    timezone="UTC"
)
