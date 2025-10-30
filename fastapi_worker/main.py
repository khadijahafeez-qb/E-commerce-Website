from fastapi import FastAPI
from fastapi_worker.tasks import calculate_order_stats

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/calculate-stats")
def trigger_task():
    task = calculate_order_stats.delay()  # run asynchronously
    return {"task_id": task.id, "status": "queued"}
