"""Common response wrappers."""

from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: T


class PaginationMeta(BaseModel):
    total: int
    limit: int
    offset: int
    hasMore: bool


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: list[T]
    pagination: PaginationMeta
