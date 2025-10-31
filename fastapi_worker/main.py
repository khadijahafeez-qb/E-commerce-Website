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

# from fastapi_worker.tasks import calculate_order_stats

# if __name__ == "__main__":
#     result = calculate_order_stats.delay()
#     print("📤 Task sent to Celery worker. Task ID:", result.id)


# from celery import Celery

# celery = Celery(
#     "fastapi_worker",
#     broker="redis://localhost:6379/0",
#     backend="redis://localhost:6379/0",
# )

# @celery.task
# def calculate_order_stats():
#     print("📊 Calculating order stats...")
#     # simulate work
#     import time
#     time.sleep(2)
#     print("✅ Order stats calculated successfully!")
#     return {"status": "success"}
from fastapi import FastAPI
from celery.result import AsyncResult
from fastapi_worker.celery_app import celery 
from fastapi_worker.tasks import calculate_order_stats

app = FastAPI()

@app.post("/calculate-stats")
def start_stats():
    task = calculate_order_stats.delay()
    return {"task_id": task.id}

@app.get("/calculate-stats/{task_id}")
def get_task_result(task_id: str):
    result = AsyncResult(task_id, app=celery)
    if result.ready():
        return {"status": "done", "result": result.get()}
    else:
        return {"status": "pending"}