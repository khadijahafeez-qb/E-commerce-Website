# from fastapi_worker.celery_app import celery_app
# from fastapi_worker.db import SessionLocal
# from sqlalchemy import text

# @celery_app.task
# def calculate_order_stats():
#     db = SessionLocal()
#     try:
#         result = db.execute(text('SELECT COUNT(*), COALESCE(SUM(total), 0) FROM "Order"'))
#         count, total = result.fetchone()
#         print(f"📊 Total orders: {count}, Total amount: {total}")
#         return {"total_orders": count, "total_amount": float(total)}
#     finally:
#         db.close()
from fastapi_worker.celery_app import celery_app

@celery_app.task
def add(x, y):
    return x + y
