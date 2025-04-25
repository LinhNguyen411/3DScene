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


@router.get("/", response_model=Page[schemas.Feedback], responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def read_feedbacks(
    params: Params = Depends(),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Lấy danh sách phản hồi (feedback) từ hệ thống.

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
    - GET /feedbacks?size=10&page=1
    """

    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    feedbacks = crud.feedback.get_multi(db=db)

    return paginate(feedbacks, params)

@router.get("/recent", response_model=Page[schemas.Feedback], responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def read_feedbacks(
    params: Params = Depends(),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Lấy danh sách phản hồi gần đây từ hệ thống.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Điều kiện:**
    - Người dùng phải là superuser để có quyền truy cập.

    **Đầu vào (Query Parameters - Params):**
    - Các tham số phân trang (ví dụ: `page`, `size`) sẽ được lấy từ query params.

    **Đầu ra (Response):**
    - 200 OK: Trả về danh sách phản hồi gần đây đã phân trang.
    - 401 Unauthorized: Nếu người dùng không có quyền truy cập.
    - 400 Bad Request: Nếu người dùng không phải là superuser.

    **Ví dụ:**
    - GET /feedbacks/recent?size=10&page=1
    """

    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    feedbacks = crud.feedback.get_recent(db=db)

    return paginate(feedbacks, params)


@router.get("/{id}", response_model=schemas.Feedback, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def get_feedback(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
) -> Any:
    """
    Lấy thông tin phản hồi theo ID.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Điều kiện:**
    - Người dùng phải là superuser để có quyền truy cập.

    **Đầu vào (Path Parameter):**
    - `id` (int): ID của phản hồi cần lấy thông tin.

    **Đầu ra (Response):**
    - 200 OK: Trả về thông tin phản hồi với ID tương ứng.
    - 401 Unauthorized: Nếu người dùng không có quyền truy cập.
    - 404 Not Found: Nếu không tìm thấy phản hồi với ID tương ứng.
    - 400 Bad Request: Nếu người dùng không phải là superuser.

    **Ví dụ:**
    - GET /feedbacks/1
    """
    feedback = crud.feedback.get(db=db, id=id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return feedback


@router.post("/", response_model=schemas.Feedback, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
async def create_feedback(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    feedback_in: schemas.FeedbackCreate
) -> Any:
    """
    Tạo một phản hồi mới.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Điều kiện:**
    - Người dùng phải là người đã đăng nhập và có quyền truy cập.

    **Đầu vào (Request Body - FeedbackCreate):**
    - Các trường cần thiết để tạo phản hồi mới. Các trường này sẽ được xác định trong `schemas.FeedbackCreate`.

    **Đầu ra (Response):**
    - 200 OK: Trả về phản hồi vừa được tạo.
    - 401 Unauthorized: Nếu người dùng chưa đăng nhập hoặc token không hợp lệ.

    **Ví dụ:**
    - POST /feedbacks
      ```json
      {
        "content": "Great product!",
        "rating": 5
      }
      ```
    """
    
    feedback: models.Feedback = crud.feedback.create(
        db, obj_in=feedback_in)
    return feedback


@router.put("/{id}", response_model=schemas.Feedback, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def update_feedback(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
    feedback_in: schemas.FeedbackUpdate,
) -> Any:
    """
    Cập nhật thông tin phản hồi theo ID.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Điều kiện:**
    - Người dùng phải là superuser để có quyền cập nhật phản hồi.

    **Đầu vào (Path Parameter và Request Body):**
    - `id` (int): ID của phản hồi cần cập nhật.
    - `feedback_in` (FeedbackUpdate): Các trường cần cập nhật, ví dụ như nội dung phản hồi hoặc đánh giá.

    **Đầu ra (Response):**
    - 200 OK: Trả về phản hồi đã được cập nhật.
    - 401 Unauthorized: Nếu người dùng chưa đăng nhập hoặc token không hợp lệ.
    - 404 Not Found: Nếu không tìm thấy phản hồi với ID tương ứng.
    - 400 Bad Request: Nếu người dùng không phải là superuser.

    **Ví dụ:**
    - PUT /feedbacks/1
      ```json
      {
        "content": "Updated feedback content",
        "rating": 4
      }
      ```
    """
    feedback = crud.feedback.get(db=db, id=id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    feedback = crud.feedback.update(db=db, db_obj=feedback, obj_in=feedback_in)
    return feedback


@router.delete("/{id}", response_model=schemas.Detail, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def delete_feedback(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
) -> Any:
    """
    Xóa một phản hồi theo ID.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Điều kiện:**
    - Người dùng phải là superuser để có quyền xóa phản hồi.

    **Đầu vào (Path Parameter):**
    - `id` (int): ID của phản hồi cần xóa.

    **Đầu ra (Response):**
    - 200 OK: Trả về thông báo xác nhận phản hồi đã được xóa thành công.
    - 401 Unauthorized: Nếu người dùng chưa đăng nhập hoặc token không hợp lệ.
    - 404 Not Found: Nếu không tìm thấy phản hồi với ID tương ứng.
    - 400 Bad Request: Nếu người dùng không phải là superuser.

    **Ví dụ:**
    - DELETE /feedbacks/1
      ```json
      {
        "detail": "Feedback deleted successfully 1"
      }
      ```
    """
    feedback = crud.feedback.get(db=db, id=id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    feedback = crud.feedback.remove(db=db, id=id)
    return {"detail": f'Feedback deleted successfully {id}'}
