# fastapi_worker/tasks.py
from fastapi_worker.celery_app import celery
from fastapi_worker.db import SessionLocal
from fastapi_worker.models import Order, OrderItem, OrderStats
from sqlalchemy.orm import joinedload
from sqlalchemy import desc
from datetime import datetime
import uuid

@celery.task(name="calculate_order_stats")
def calculate_order_stats():
    db = SessionLocal()
    try:
        # 1️⃣ Get latest saved stats
        latest_stats = db.query(OrderStats).order_by(desc(OrderStats.createdAt)).first()
        last_updated = latest_stats.updatedAt if latest_stats else datetime(1970, 1, 1)

        # 2️⃣ Get new orders since last update
        new_orders = db.query(Order).options(joinedload(Order.items)).filter(Order.createdAt > last_updated).all()

        new_total_orders = len(new_orders)
        new_total_units = sum(item.quantity for order in new_orders for item in order.items)
        new_total_amount = sum(order.total for order in new_orders if order.total)

        # 3️⃣ Merge previous stats + new orders
        total_orders = (latest_stats.totalOrders if latest_stats else 0) + new_total_orders
        total_units = (latest_stats.totalUnits if latest_stats else 0) + new_total_units
        total_amount = (latest_stats.totalAmount if latest_stats else 0) + new_total_amount

        # 4️⃣ Save new stats
        stats_entry = OrderStats(
            id=str(uuid.uuid4()),
            totalOrders=total_orders,
            totalUnits=total_units,
            totalAmount=total_amount,
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow()
        )
        db.add(stats_entry)
        db.commit()

        print("✅ Incremental stats calculated and saved:", {
            "totalOrders": total_orders,
            "totalUnits": total_units,
            "totalAmount": total_amount
        })

    finally:
        db.close()
