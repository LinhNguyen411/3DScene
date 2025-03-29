from sqlalchemy import Enum


class UserTestConstants(Enum):
    # Default password for UserFactory
    USER_DEFAULT_PASSWORD = "password"
    
    # Users used for TestClient with authentification headers
    # Credentials super user
    CLIENT_SUPERUSER_EMAIL = "client.superuser@email.com"
    CLIENT_SUPERUSER_PASSWORD = "client_superuser_password"
    # Creadentials ordinary user
    CLIENT_ORDINARY_USER_EMAIL = "client.ordinary@email.com"
    CLIENT_ORDINARY_USER_PASSWORD = "client_ordinary_password"
    
    # Credentials ordinary user
    ORDINARY_USER_EMAIL = "user@email.com"
    ORDINARY_USER_PASSWORD = "user_password"
