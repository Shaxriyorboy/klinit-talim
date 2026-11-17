from pydantic import BaseModel, Field

from app.models.user import Role


class RegisterIn(BaseModel):
    phone: str = Field(min_length=9, max_length=20)
    full_name: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6, max_length=128)
    institution_id: int | None = None
    department: str = Field(default="", max_length=255)
    position: str = Field(default="", max_length=120)


class LoginIn(BaseModel):
    phone: str
    password: str


class InstitutionOut(BaseModel):
    id: int
    name: str
    region: str

    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    id: int
    phone: str
    full_name: str
    role: Role
    institution: InstitutionOut | None
    department: str
    position: str
    xp: int
    level: int

    model_config = {"from_attributes": True}


class AuthOut(BaseModel):
    user: UserOut
    access_token: str
