from fastapi import APIRouter, Depends, Request, HTTPException, status,Response
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from models import Client, User
from typing import Dict, Any
from pydantic import BaseModel
from auth.auth import get_password_hash, verify_password, create_access_token_and_set_cookie
from datetime import datetime
from connection import get_db

templates = Jinja2Templates(directory="templates")

auth_router = APIRouter(prefix = "/auth")
api_auth_router = APIRouter(prefix = '/api/auth')


class UserCreate(BaseModel):
    name: str
    username: str
    email: str
    phone: str
    birth_date: str
    password: str
    sex: bool


class UserLogin(BaseModel):
    username: str
    password: str

def create_new_user(user: UserCreate, role: str = "user")-> User:
    
    new_user = User(
    username = user.username,
    email= user.email,
    password =get_password_hash(user.password),
    user_type = role
    )
    return new_user

@auth_router.get('/registration/')
def registration(request:Request):
    return templates.TemplateResponse(
        request=request, name= 'auth.html'
    )

@api_auth_router.post('/registration/')
def create_user(user: UserCreate, role: str = 'user' ,session:Session = Depends(get_db)):
    if session.query(User).filter((User.email == user.email) | (User.username == user.username)).first():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User already have created')
    new_user = create_new_user(user, role)
    session.add(new_user)
    session.flush()
    client = Client(
        user_id = new_user.id,
        name = user.name,
        phone = user.phone,
        status = True,
        date_of_birth = datetime.strptime(user.birth_date, "%Y-%m-%d"),
        description = "",
        joined = datetime.now(),
    )

    
    session.add(client)
    try:
        session.commit()
        return {"data": 'success!!'}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")


@api_auth_router.post('/login/')
def login_user(user:UserLogin, response:Response, session:Session = Depends(get_db)):
    user_from_db = session.query(User).filter(User.username == user.username).first()
    if not user_from_db:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Username not found")
    if not verify_password(user.password, user_from_db.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    if user_from_db.coach_profile:
        profile = user_from_db.coach_profile
    elif user_from_db.client_profile:
        profile = user_from_db.client_profile
    elif user_from_db.admin_profile:
        profile = user_from_db.admin_profile
    else:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Profile not found")
    token = create_access_token_and_set_cookie(response=response, data ={'sub':user_from_db.username, 'role': profile.role, "permissions": profile.permissions})
    return { "code" : 200, "token" : token }
