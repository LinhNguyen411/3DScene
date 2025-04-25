from pydantic import BaseModel
class EnvVariableResponse(BaseModel):
    key: str
    value: str
    sensitive: bool

class EnvVariableUpdate(BaseModel):
    key: str
    value: str