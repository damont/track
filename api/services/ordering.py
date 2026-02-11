from typing import Optional
from beanie import PydanticObjectId

from api.schemas.orm.task import Task


def calculate_order(before_order: Optional[float], after_order: Optional[float]) -> float:
    """Calculate a new order value between two existing values.

    Uses fractional indexing for O(1) reorder operations.
    """
    if before_order is None and after_order is None:
        # No reference points, start at middle
        return 500000.0
    elif before_order is None:
        # Moving to the beginning
        return after_order / 2.0
    elif after_order is None:
        # Moving to the end
        return before_order + 1000.0
    else:
        # Moving between two items
        return (before_order + after_order) / 2.0


def should_rebalance(
    before_order: Optional[float],
    after_order: Optional[float],
    new_order: float,
) -> bool:
    """Check if order precision is getting too small and rebalancing is needed."""
    if before_order is None or after_order is None:
        return False

    # If the gap between orders is less than 1e-10, we need to rebalance
    gap = abs(after_order - before_order)
    return gap < 1e-10


async def rebalance_orders(
    user_id: PydanticObjectId,
    order_type: str,
    project_id: Optional[PydanticObjectId] = None,
) -> None:
    """Rebalance all order values with even spacing.

    This is called when fractional precision gets too small.
    """
    if order_type == "overall":
        tasks = await Task.find(Task.user_id == user_id).sort(+Task.overall_order).to_list()
        for i, task in enumerate(tasks):
            task.overall_order = (i + 1) * 1000.0
            await task.save()
    else:
        # Project order
        if project_id is None:
            return
        tasks = await Task.find(
            Task.user_id == user_id,
            Task.project_id == project_id
        ).sort(+Task.project_order).to_list()
        for i, task in enumerate(tasks):
            task.project_order = (i + 1) * 1000.0
            await task.save()
