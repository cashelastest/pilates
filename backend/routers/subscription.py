from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from connection import Connection, db_session,get_db
from models import SubscriptionTemplate, Subscription, Client, Coach, Group, SubscriptionSchedule, Lesson
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel

subscription_router = APIRouter(prefix='/subscriptions', tags=['subscriptions'])
api_subscription_router = APIRouter(prefix='/api')
templates = Jinja2Templates(directory='templates')

class ScheduleCreate(BaseModel):
    day_of_the_week: int
    start_time: str
    end_time: str

class TemplateCreate(BaseModel):
    name: str
    price: float
    total_lessons: int
    valid_days: int
    coach_id: int
    group_id: Optional[int] = None
    description: Optional[str] = None


class TemplateUpdate(TemplateCreate):
    pass


@subscription_router.get('/', response_class=HTMLResponse)
def get_subscriptions_page(request: Request):
    return templates.TemplateResponse(
        request=request, name='subscriptions.html'
    )


@api_subscription_router.put("/templates/{template_id}")
def change_template(template_id:int, changed_template: TemplateUpdate,session = Depends(get_db)):
    # raise HTTPException(status_code=404, detail = 'No such template')
    template = session.get(SubscriptionTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail = 'No such template')
    for attr, value in vars(changed_template).items():
        if value:
            setattr(template, attr, value)

    session.commit()
    session.refresh(template)
    return {"code":200, "data":"Success"}


@api_subscription_router.get("/coaches")

def get_coaches(session:Session = Depends(get_db)):

    coaches = session.query(Coach).all()
    data = [
        {
            "id":coach.id,
            "name":coach.name,
        } for coach in coaches
    ]
    return data
@api_subscription_router.get("/groups")

def get_groups(session = Depends(get_db)):
    groups = session.query(Group).all()
    data = [
        {
            "id":group.id,
            "name":group.name,
        } for group in groups
    ]
    return data
@api_subscription_router.get("/clients")
def get_clients(session = Depends(get_db)):
    clients = session.query(Client).all()
    data = [
        {
            "id":client.id,
            "name":client.name,
        } for client in clients
    ]
    return data

@api_subscription_router.get('/templates')
def get_templates(session = Depends(get_db)):
    templates =session.query(SubscriptionTemplate).all()
    data = [{"id":template.id,
             "name":template.name,
             "price":template.price,
             "total_lessons": template.total_lessons,
             "valid_days":template.valid_days,
             "coach_id":template.coach.id,
             "coach_name":template.coach.name,
             "group_id":template.group.id,
             "group_name":template.group.name,
             "description":template.description,
             "schedules":[
                 {
                     "id":schedule.id,
                     "day_of_the_week":schedule.day_of_the_week,
                     "start_time": schedule.start_time.strftime("%H:%M:%S"),
                     "end_time": schedule.end_time.strftime("%H:%M:%S"),

                 } for schedule in template.group.schedules
             ]
             } for template in templates]
    return data

@api_subscription_router.post("/templates")
def create_template(template:TemplateCreate, session:Session = Depends(get_db)):
    new_template = SubscriptionTemplate(
        name = template.name,
        price=  template.price,
        description = template.description,
        total_lessons = template.total_lessons,
        valid_days = template.valid_days,
        coach_id = template.coach_id,
        group_id = template.group_id,
    )
    session.add(new_template)
    session.commit()
    return {"code":200, "data":"Success"}

@api_subscription_router.get('/subscriptions')
def get_subscriptions(session = Depends(get_db)):
    subscriptions = session.query(Subscription).all()
    data = [
        {
            "id":subscription.id,
            "client_id":subscription.client_id,
            "client_name":subscription.client.name,
            "template_id":subscription.template_id,
            "template_name":subscription.template.name,
            "is_active": subscription.is_active,
            "price":subscription.template.price,
            "total_lessons":subscription.template.total_lessons,
            "used_lessons":len ([lesson for lesson in subscription.lessons if lesson.is_used]),
            "valid_until":datetime.strftime(subscription.valid_until, "%Y-%m-%d"),
            "lessons":[
                {
                    "id":lesson.id,
                    "date":datetime.strftime(lesson.date, "%Y-%m-%d"),
                    "start_time":lesson.start_time.strftime( "%H:%M:%S"),
                    "end_time":lesson.end_time.strftime("%H:%M:%S")
                } for lesson in subscription.lessons
            ],
            "schedules":[
                {
                    "id":schedule.id,
                    "day_of_the_week":schedule.day_of_the_week,
                    "start_time":schedule.start_time.strftime( "%H:%M:%S"),
                    "end_time":schedule.end_time.strftime("%H:%M:%S")
                } for schedule in subscription.schedules
            ]
        } for subscription in subscriptions
    ]
    return data

@api_subscription_router.get("/templates/{template_id}")
def get_template(template_id:int,session = Depends(get_db)):
    template = session.get(SubscriptionTemplate, template_id)
    if not template:
        raise HTTPException("No such template")
    data = {
        "id":template.id, 
        "name":template.name,
        "price":template.price,
        "total_lessons":template.total_lessons,
        "valid_days":template.valid_days,
        "coach_id":template.coach,
        "coach_name":template.coach.name,
        'group_id':template.group_id,
        "description":template.description,
        "schedules":[
                 {
                     "id":schedule.id,
                     "day_of_the_week":schedule.day_of_the_week,
                     "start_time": schedule.start_time.strftime("%H:%M:%S"),
                     "end_time": schedule.end_time.strftime("%H:%M:%S"),

                 } for schedule in template.group.schedules
             ]
    }
    return data


@api_subscription_router.delete("/templates/{template_id}")
def delete_template(template_id: int, session:Session = Depends(get_db)):
    template = session.get(SubscriptionTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail= "Not Found")
    session.delete(template)
    session.commit()

    return {"code":200, "data":"Success"}

@api_subscription_router.post("/subscriptions/{template_id}/cancel")
def delete_subscription(template_id:int, session:Session = Depends(get_db)):
    template = session.get(SubscriptionTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail= "Not Found")
    session.delete(template)
    session.commit()