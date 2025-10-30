from celery import Celery
from fastapi_worker.config import REDIS_URL

celery_app = Celery(
    "fastapi_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["fastapi_worker.tasks"],
)

celery_app.conf.update(
    task_routes={"fastapi_worker.tasks.*": {"queue": "default"}},
    task_track_started=True,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
)
