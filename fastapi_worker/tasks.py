# fastapi_worker/tasks.py
from celery import shared_task
from sqlalchemy import text
from fastapi_worker.db import SessionLocal

@shared_task
def calculate_order_stats():
    db = SessionLocal()
    try:
        # Using SQL to calculate the same stats
        total_orders = db.execute(text("SELECT COUNT(*) FROM \"Order\"")).scalar()

        total_units = db.execute(
            text("""
            SELECT COALESCE(SUM(quantity), 0)
            FROM "OrderItem"
            """)
        ).scalar()

        total_amount = db.execute(
            text("""
            SELECT COALESCE(SUM(total), 0)
            FROM "Order"
            """)
        ).scalar()

        result = {
            "totalOrders": total_orders,
            "totalUnits": total_units,
            "totalAmount": total_amount
        }

        print("✅ Calculated order stats:", result)
        return result
    finally:
        db.close()
