from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    groq_api_key: str
    neo4j_uri: str
    neo4j_username: str
    neo4j_password: str

    class Config:
        env_file = Path(__file__).resolve().parent.parent / ".env"

settings = Settings()
