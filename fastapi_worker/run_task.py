# fastapi_worker/run_task.py
from fastapi_worker.tasks import calculate_order_stats

if __name__ == "__main__":
    result = calculate_order_stats.delay()
    print("📤 Task queued. Task ID:", result.id)
