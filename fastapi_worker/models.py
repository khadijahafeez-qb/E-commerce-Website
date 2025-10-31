# fastapi_worker/models.py
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    DateTime,
    Enum,
    ForeignKey,
    func,
)
from sqlalchemy.orm import relationship
from fastapi_worker.db import Base
import enum


# ----- ENUMS -----
class Role(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class VariantAvailability(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FULFILLED = "FULFILLED"


# ----- MODELS -----
class User(Base):
    __tablename__ = "User"

    id = Column(String, primary_key=True, index=True)
    fullname = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    mobile = Column(String)
    password = Column(String, nullable=False)
    role = Column(Enum(Role), default=Role.USER, nullable=False)
    stripeCustomerId = Column(String, unique=True)
    resetToken = Column(String)
    resetTokenExpires = Column(DateTime)
    createdAt = Column(DateTime, default=func.now())
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now())

    orders = relationship("Order", back_populates="user")


class Product(Base):
    __tablename__ = "Product"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    createdAt = Column(DateTime, default=func.now())
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now())
    isDeleted = Column(String, default="active")

    orderItems = relationship("OrderItem", back_populates="product")
    variants = relationship("ProductVariant", back_populates="product")


class ProductVariant(Base):
    __tablename__ = "ProductVariant"

    id = Column(String, primary_key=True, index=True)
    productId = Column(String, ForeignKey("Product.id", ondelete="CASCADE"))
    colour = Column(String, nullable=False)
    colourcode = Column(String, nullable=False)
    size = Column(String, nullable=False)
    stock = Column(Integer, default=0)
    price = Column(Float, nullable=False)
    createdAt = Column(DateTime, default=func.now())
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now())
    availabilityStatus = Column(Enum(VariantAvailability), default=VariantAvailability.ACTIVE)
    img = Column(String)

    orderItems = relationship("OrderItem", back_populates="variant")
    product = relationship("Product", back_populates="variants")


class Order(Base):
    __tablename__ = "Order"

    id = Column(String, primary_key=True, index=True)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"))
    total = Column(Float, nullable=False)
    stripeSessionId = Column(String, unique=True)
    stripePaymentIntentId = Column(String, unique=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    createdAt = Column(DateTime, default=func.now())
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "OrderItem"

    id = Column(String, primary_key=True, index=True)
    orderId = Column(String, ForeignKey("Order.id", ondelete="CASCADE"))
    productId = Column(String, ForeignKey("Product.id", ondelete="CASCADE"))
    variantId = Column(String, ForeignKey("ProductVariant.id"))
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    createdAt = Column(DateTime, default=func.now())
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now())

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="orderItems")
    variant = relationship("ProductVariant", back_populates="orderItems")

class OrderStats(Base):
    __tablename__ = "OrderStats"

    id = Column(String, primary_key=True, index=True)
    totalOrders = Column(Integer, nullable=False)
    totalUnits = Column(Integer, nullable=False)
    totalAmount = Column(Float, nullable=False)
    createdAt = Column(DateTime, default=func.now())
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now())
