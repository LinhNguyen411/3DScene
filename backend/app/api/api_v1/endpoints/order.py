from typing import Any
from sqlalchemy.orm import Session  # type: ignore
from app.api import deps
from app import schemas
from app import models
from app import crud

from fastapi_pagination.ext.sqlalchemy import paginate
from fastapi_pagination import Params, Page
from fastapi import (APIRouter,  Depends, HTTPException)



router = APIRouter()


@router.get("", response_model=Page[schemas.Order], responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def read_orders(
    params: Params = Depends(),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Lấy danh sách phản hồi (order) từ hệ thống.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Điều kiện:**
    - Người dùng phải là superuser để có quyền truy cập.

    **Đầu vào (Query Parameters - Params):**
    - Các tham số phân trang (ví dụ: `page`, `size`) sẽ được lấy từ query params.

    **Đầu ra (Response):**
    - 200 OK: Trả về danh sách phản hồi đã phân trang.
    - 401 Unauthorized: Nếu người dùng không có quyền truy cập.
    - 400 Bad Request: Nếu người dùng không phải là superuser.

    **Ví dụ:**
    - GET /orders?size=10&page=1
    """

    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    orders = crud.order.get_multi(db=db)

    return paginate(orders, params)



# @router.get("/{id}", response_model=schemas.order, responses={
#     401: {"model": schemas.Detail, "description": "User unathorized"}
# })
# def get_order(
#     *,
#     db: Session = Depends(deps.get_db),
#     current_user: models.User = Depends(deps.get_current_active_user),
#     id: int,
# ) -> Any:
#     """
#     Lấy thông tin phản hồi theo ID.

#     **Yêu cầu Header:**
#     - `Authorization: Bearer <access_token>`

#     **Điều kiện:**
#     - Người dùng phải là superuser để có quyền truy cập.

#     **Đầu vào (Path Parameter):**
#     - `id` (int): ID của phản hồi cần lấy thông tin.

#     **Đầu ra (Response):**
#     - 200 OK: Trả về thông tin phản hồi với ID tương ứng.
#     - 401 Unauthorized: Nếu người dùng không có quyền truy cập.
#     - 404 Not Found: Nếu không tìm thấy phản hồi với ID tương ứng.
#     - 400 Bad Request: Nếu người dùng không phải là superuser.

#     **Ví dụ:**
#     - GET /orders/1
#     """
#     order = crud.order.get(db=db, id=id)
#     if not order:
#         raise HTTPException(status_code=404, detail="order not found")
#     if not current_user.is_superuser:
#         raise HTTPException(status_code=400, detail="Not enough permissions")
#     return order


# @router.post("", response_model=schemas.order, responses={
#     401: {"model": schemas.Detail, "description": "User unathorized"}
# })
# async def create_order(
#     *,
#     db: Session = Depends(deps.get_db),
#     current_user: models.User = Depends(deps.get_current_active_user),
#     order_in: schemas.orderCreate
# ) -> Any:
#     """
#     Tạo một phản hồi mới.

#     **Yêu cầu Header:**
#     - `Authorization: Bearer <access_token>`

#     **Điều kiện:**
#     - Người dùng phải là người đã đăng nhập và có quyền truy cập.

#     **Đầu vào (Request Body - orderCreate):**
#     - Các trường cần thiết để tạo phản hồi mới. Các trường này sẽ được xác định trong `schemas.orderCreate`.

#     **Đầu ra (Response):**
#     - 200 OK: Trả về phản hồi vừa được tạo.
#     - 401 Unauthorized: Nếu người dùng chưa đăng nhập hoặc token không hợp lệ.

#     **Ví dụ:**
#     - POST /orders
#       ```json
#       {
#         "content": "Great product!",
#         "rating": 5
#       }
#       ```
#     """
    
#     order: models.order = crud.order.create(
#         db, obj_in=order_in)
#     return order


# @router.put("/{id}", response_model=schemas.order, responses={
#     401: {"model": schemas.Detail, "description": "User unathorized"}
# })
# def update_order(
#     *,
#     db: Session = Depends(deps.get_db),
#     current_user: models.User = Depends(deps.get_current_active_user),
#     id: int,
#     order_in: schemas.orderUpdate,
# ) -> Any:
#     """
#     Cập nhật thông tin phản hồi theo ID.

#     **Yêu cầu Header:**
#     - `Authorization: Bearer <access_token>`

#     **Điều kiện:**
#     - Người dùng phải là superuser để có quyền cập nhật phản hồi.

#     **Đầu vào (Path Parameter và Request Body):**
#     - `id` (int): ID của phản hồi cần cập nhật.
#     - `order_in` (orderUpdate): Các trường cần cập nhật, ví dụ như nội dung phản hồi hoặc đánh giá.

#     **Đầu ra (Response):**
#     - 200 OK: Trả về phản hồi đã được cập nhật.
#     - 401 Unauthorized: Nếu người dùng chưa đăng nhập hoặc token không hợp lệ.
#     - 404 Not Found: Nếu không tìm thấy phản hồi với ID tương ứng.
#     - 400 Bad Request: Nếu người dùng không phải là superuser.

#     **Ví dụ:**
#     - PUT /orders/1
#       ```json
#       {
#         "content": "Updated order content",
#         "rating": 4
#       }
#       ```
#     """
#     order = crud.order.get(db=db, id=id)
#     if not order:
#         raise HTTPException(status_code=404, detail="order not found")
#     if not current_user.is_superuser:
#         raise HTTPException(status_code=400, detail="Not enough permissions")
#     order = crud.order.update(db=db, db_obj=order, obj_in=order_in)
#     return order


# @router.delete("/{id}", response_model=schemas.Detail, responses={
#     401: {"model": schemas.Detail, "description": "User unathorized"}
# })
# def delete_order(
#     *,
#     db: Session = Depends(deps.get_db),
#     current_user: models.User = Depends(deps.get_current_active_user),
#     id: int,
# ) -> Any:
#     """
#     Xóa một phản hồi theo ID.

#     **Yêu cầu Header:**
#     - `Authorization: Bearer <access_token>`

#     **Điều kiện:**
#     - Người dùng phải là superuser để có quyền xóa phản hồi.

#     **Đầu vào (Path Parameter):**
#     - `id` (int): ID của phản hồi cần xóa.

#     **Đầu ra (Response):**
#     - 200 OK: Trả về thông báo xác nhận phản hồi đã được xóa thành công.
#     - 401 Unauthorized: Nếu người dùng chưa đăng nhập hoặc token không hợp lệ.
#     - 404 Not Found: Nếu không tìm thấy phản hồi với ID tương ứng.
#     - 400 Bad Request: Nếu người dùng không phải là superuser.

#     **Ví dụ:**
#     - DELETE /orders/1
#       ```json
#       {
#         "detail": "order deleted successfully 1"
#       }
#       ```
#     """
#     order = crud.order.get(db=db, id=id)
#     if not order:
#         raise HTTPException(status_code=404, detail="order not found")
#     if not current_user.is_superuser:
#         raise HTTPException(status_code=400, detail="Not enough permissions")
#     order = crud.order.remove(db=db, id=id)
#     return {"detail": f'order deleted successfully {id}'}
