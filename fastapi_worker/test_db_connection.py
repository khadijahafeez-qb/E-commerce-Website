from db import engine

try:
    with engine.connect() as conn:
        print("✅ Connected to PostgreSQL via FASTAPI_DB_URL!")
except Exception as e:
    print("❌ Database connection failed:", e)
