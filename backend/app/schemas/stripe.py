from pydantic import BaseModel


class CheckoutSessionRequest(BaseModel):
    priceId: str

class CheckoutSessionReponse(BaseModel):
    sessionId: str