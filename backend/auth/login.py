from typing import List, Optional, Union, Dict
from fastapi import Depends,HTTPException
from passlib.context import CryptContext
from pydantic import BaseModel
#! CHANGE TO ENVIROMENT VARIABLE BEFORE RELEASE!!!


class User(BaseModel):
    username: str
    email: str
    role: str = "user"
    permissions: List[str] = []

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    acces_token: str
    access_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


pwd_context = CryptContext(schemes = ['bcrypt'], deprecated = "auto")