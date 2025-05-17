from fastapi import APIRouter, Request
from fastapi.websockets import WebSocket

from routers.client import Manager
from fastapi.templating import Jinja2Templates
from datetime import datetime
from models import Client
from utils import custom_translit
clients_router = APIRouter(prefix="/clients")

templates = Jinja2Templates(directory='templates')

class ClientsManager(Manager):
    async def get_all_clients(self, ws:WebSocket):
        clients = self.session.query(Client).all()
        data = [
            {"id": client.id,
            "username": client.username,
            "full_name":client.name,
            "is_active":client.status,
            "coach_id":client.coach_id,
            "last_lesson_date":client.lessons[-1].date.strftime( "%Y-%m-%d") if client.lessons else "No lessons",
            "lessons_total": len(client.lessons),
            "lessons_used": len([1 for lesson in client.lessons if lesson.is_used]),
            "subscription_end_date":client.subscriptions[-1].template.valid_until.strftime( "%Y-%m-%d") if client.subscriptions else "No subscriptions"
            } for client in clients
        ]

        await ws.send_json({'code':400, "data":data})

    async def get_client(self, username:str, ws:WebSocket):
        client = self.session.query(Client).filter(Client.username==username).first()
        data = {
            "id":client.id,
            "username":client.username,
            "full_name": client.name,
            "phone":client.phone,
            "email":client.email,
            "birth_date":client.date_of_birth.strftime( "%Y-%m-%d"),
            "gender":client.sex,
            "registration_date":client.joined.strftime( "%Y-%m-%d"),
            "is_active":client.status,
            'comments':client.description,
            "last_lesson_date":client.lessons[-1].date.strftime( "%Y-%m-%d"),
            "lessons_used": len([1 for lesson in client.lessons if lesson.is_used]),
            "lessons_total":len(client.lessons),
            "subscription_end_date":client.subscriptions[-1].valid_until.strftime( "%Y-%m-%d")
        }
        print(data)

        await ws.send_json({"code":401, "data":data})

    async def get_subscriptions(self, username:str, ws:WebSocket):
        client= self.session.query(Client).filter(Client.username == username).first()
        subs = client.subscriptions

        data =[]
        for sub in subs:
            data.append({
                "id":sub.id,
                "client_id":client.id,
                "start_date":datetime.now().strftime("%Y-%m-%d"),
                "end_date":sub.valid_until.strftime("%Y-%m-%d"),
                "lessons_total":sub.total_lessons,
                "lessons_used":len([1 for lesson in sub.lessons if lesson.is_used]),
                "is_active":sub.is_active,
                "price":sub.price
            })
        sended_data = {'code':403, 'data':data}
        print(f"{sended_data=}")
        await ws.send_json(sended_data)

    async def client_data(self, data, ws:WebSocket):
        client = self.session.get(Client, data.get('id'))
        if not client:
            raise Exception("No such client in db!")
        client.name = data.get('full_name')
        client.phone = data.get('phone')
        client.email = data.get('email')
        client.date_of_birth = data.get('birth_date')
        client.sex = data.get('gender')
        client.status = data.get('is_active')
        client.description = data.get('comments')
        self.session.commit()
        await ws.send_json({'code':402, 'data':f"Successfully update client{client.name}"})

    async def get_clients_lessons(self, username:str, ws:WebSocket):
        client = self.session.query(Client).filter(Client.username == username ).first()
        lessons = client.lessons
        data = []
        for lesson in lessons:
            group = getattr(lesson, 'group')
            data.append({
                "id":lesson.id,
                "client_id":client.id,
                "group_id": getattr(group, "id") if group else None,
                "group_name":getattr(group, "name") if group else None,
                "lesson_type":client.coach.name + lesson.date.strftime("%Y-%m-%d"),
                "date":lesson.date.strftime("%Y-%m-%d"),
                'coach_id':client.coach.id,
                "coach_name":client.coach.name,
            })
        await ws.send_json({'code':404, "data":data})


    def username_exist(self, username):
        return self.session.query(Client).filter(Client.username == username).first()
    async def create_client(self, client_data):
        username = custom_translit(client_data.get('username'))
        if self.username_exist(username):
            raise Exception('Username exists')
        client = Client(
            username = username,
            name = client_data.get('full_name'),
            email = client_data.get("email"),
            phone = client_data.get("phone"),
            balance = 0,
            joined = datetime.now(),
            date_of_birth = datetime.strptime(client_data.get("birth_date"),"%Y-%m-%d"),
            sex =1 if client_data.get("gender") == "female" else 0,
            status = client_data.get('is_active'),
            description = client_data.get("comments"),
            
        )
        if client_data.get('caoch_id'):
            client.coach_id = client_data.get("coach_id")
        self.session.add(client)
        print(client.__dict__)
        self.session.commit()
    async def delete_client(self, username):
        client = self.session.query(Client).filter(Client.username == username).first()
        self.session.delete(client)
        self.session.commit()
    
    # pass

clients_manager = ClientsManager()
@clients_router.get('/')
def get_clients(request:Request):
    return templates.TemplateResponse(
        request=request, name = 'clients.html'
    )
