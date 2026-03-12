from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "AXON"
    env: str = "development"


settings = Settings()
