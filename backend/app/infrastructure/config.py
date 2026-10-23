import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "Delivery Express API")
    environment: str = os.getenv("ENVIRONMENT", "development")
    frontend_origin: str = os.getenv(
        "FRONTEND_ORIGIN",
        "http://localhost:5173"
    )
    database_url: str = os.getenv("DATABASE_URL", "")

settings = Settings()