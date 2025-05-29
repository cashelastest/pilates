from passlib.context import CryptContext
from datetime import timedelta,datetime
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from fastapi import Request, HTTPException,status, Depends,Response
from connection import get_db
from sqlalchemy.orm import Session
from models import User
from dotenv import load_dotenv
import os
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY") 
ALGORITHM= "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 48*60 #~ for 48 hours
JWT_COOKIE_NAME = "access_token"

pwd_context = CryptContext(schemes=['bcrypt'], deprecated = 'auto')

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token_and_set_cookie(response:Response,data: dict, expires_delta:Optional[timedelta] = ACCESS_TOKEN_EXPIRE_MINUTES):
    to_encode = data.copy()
    expire = datetime.now() + timedelta(minutes =expires_delta)
    to_encode["exp"] = expire
    encoded_jwt = jwt.encode(to_encode,SECRET_KEY, algorithm=ALGORITHM)

    response.set_cookie(
        key = JWT_COOKIE_NAME,
        value=encoded_jwt,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=int((expire - datetime.now()).total_seconds()),
        path='/'
    )
    return encoded_jwt


async def decode_jwt_token(token: str):
    try:
        payload = jwt.decode(token=token, key=SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
    

def check_user_permission(user_data: Dict[str, Any], required_permission:str) -> bool:
    return required_permission in user_data.get('permissions', [])


def check_user_role(user_data:Dict[str, Any],required_roles: list) -> bool:
    return user_data.get("role", 'user') in required_roles





async def get_current_user_from_cookie(request: Request, session:Session = Depends(get_db)):
    token = request.cookies.get(JWT_COOKIE_NAME)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail = 'Unauthorized'
        )
    payload = await decode_jwt_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail = 'Token Error'
        )
    username = payload.get("sub")
    user = session.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail = 'User not found'
        )
    return user