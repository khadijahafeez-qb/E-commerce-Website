# fastapi_worker/tasks.py
from fastapi_worker.celery_app import celery
from fastapi_worker.db import SessionLocal
from fastapi_worker.models import Order
from sqlalchemy.orm import joinedload

@celery.task(name="calculate_order_stats")
def calculate_order_stats():
    """Background job to calculate total orders, total units, and total amount."""
    db = SessionLocal()
    try:
        orders = db.query(Order).options(joinedload(Order.items)).all()

        total_orders = len(orders)
        total_units = sum(len(o.items) for o in orders)
        total_amount = sum(o.total for o in orders if o.total)

        stats = {
            "totalOrders": total_orders,
            "totalUnits": total_units,
            "totalAmount": total_amount,
        }

        print("✅ Background stats calculated:", stats)
        return stats
    finally:
        db.close()
