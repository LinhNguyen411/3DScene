from pydantic import BaseModel


class Msg(BaseModel):
    msg: str

class Detail(BaseModel):
    detail: str