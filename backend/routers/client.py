from fastapi import APIRouter,Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.websockets import WebSocket
from connection import Connection
from models import Client, Lesson, Coach, Subscription
from datetime import datetime
from utils import check_is_used_lesson
client_router = APIRouter(prefix='/client', tags = ['client'])
templates = Jinja2Templates(directory='templates')

class Manager:
    def __init__(self):
        self.session = Connection.get_session()


class ClientManager(Manager):
    async def get_client_data(self, ws: WebSocket, username:str):
        client = self.session.query(Client).filter(Client.username == username).first()
        client_data = {
            'code':294,
            "data":{
            'name':client.name,
            'balance':client.balance,
            "status":client.status,
            "joined":datetime.strftime(client.joined, "%Y-%m-%d"),
            "email":client.email,
            "username":username,
            "date_of_birth":datetime.strftime(client.date_of_birth, "%Y-%m-%d"),
            "sex":client.sex,
            "coach_name":client.coach.name,
            "group_name":client.group.name,
            "description":client.description
            }
        }
        print(client_data)
        await ws.send_json(client_data)
    async def get_subs(self, ws:WebSocket, username:str):
        print(username)
        client = self.session.query(Client).filter(Client.username == username).first()
        subs = client.subscriptions
        all_subs = self.session.query(Subscription.id, Subscription.name).all()

        subs_data = [{
            "id":subscription.id,
            "name":subscription.name} 
              for subscription in all_subs]
        data = []

        for subscription in subs:
        
            used_lessons = len([0 for lesson in subscription.lessons if check_is_used_lesson(lesson)])
            data.append(
                {
                "id":subscription.id,
                "name":subscription.name,
                "price":subscription.price,
                'total_lessons': subscription.total_lessons,
                'used_lessons': used_lessons,
                'valid_until': datetime.strftime(subscription.valid_until, "%Y-%m-%d"),
                'is_active': subscription.total_lessons>used_lessons,
                "schedules": [
                    {
                    'id':schedule.id,
                    'day_of_the_week':schedule.day_of_the_week,
                    "start_time": datetime.strftime(schedule.start_time, "%H:%m:%s"),
                    "end_time": datetime.strftime(schedule.end_time, "%H:%m:%s"),
                    } for schedule in subscription.schedules],
            })
        response = {
            'code':296,
            'data':{
                "subscriptions":data,
                "all_subscriptions":subs_data
            }
        }
        await ws.send_json(response)


clinet_manager = ClientManager()


@client_router.get('/info/')
def client_info(request: Request):
    return templates.TemplateResponse(
        request=request, name='client.html'
    )