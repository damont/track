from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from beanie import PydanticObjectId

from api.schemas.orm.user import User
from api.schemas.orm.category import Category
from api.schemas.dto.category import CategoryCreate, CategoryUpdate, CategoryResponse
from api.utils.auth import get_current_user

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=List[CategoryResponse])
async def list_categories(current_user: User = Depends(get_current_user)):
    categories = await Category.find(Category.user_id == current_user.id).sort(+Category.order).to_list()
    return [
        CategoryResponse(
            id=str(cat.id),
            name=cat.name,
            color=cat.color,
            order=cat.order,
        )
        for cat in categories
    ]


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    current_user: User = Depends(get_current_user),
):
    category = Category(
        name=data.name,
        user_id=current_user.id,
        color=data.color,
        order=data.order or 0,
    )
    await category.insert()
    return CategoryResponse(
        id=str(category.id),
        name=category.name,
        color=category.color,
        order=category.order,
    )


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    data: CategoryUpdate,
    current_user: User = Depends(get_current_user),
):
    try:
        category = await Category.get(PydanticObjectId(category_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    if category is None or category.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        await category.update({"$set": update_data})
        # Refresh the category
        category = await Category.get(category.id)

    return CategoryResponse(
        id=str(category.id),
        name=category.name,
        color=category.color,
        order=category.order,
    )


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        category = await Category.get(PydanticObjectId(category_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    if category is None or category.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    await category.delete()
    return None
