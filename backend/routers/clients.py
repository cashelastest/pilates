from fastapi import APIRouter, Request, Depends
from fastapi.websockets import WebSocket
from sqlalchemy.orm import Session
from auth.auth import get_password_hash
from fastapi.templating import Jinja2Templates
from datetime import datetime
from models import Client, User
from utils import custom_translit
from connection import Connection, get_db, db_session

clients_router = APIRouter(prefix="/clients")
templates = Jinja2Templates(directory='templates')


class ClientsManager:
    async def get_all_clients(self, ws: WebSocket):
        """Получает всех клиентов"""
        with Connection.session_scope() as session:
            clients = session.query(Client).all()
            data = [
                {
                    "id": client.id,
                    "username": client.user.username,
                    "full_name": client.name,
                    "is_active": client.status,
                    "coach_id": client.coach_id,
                    "last_lesson_date": client.lessons[-1].date.strftime("%Y-%m-%d") if client.lessons else "No lessons",
                    "lessons_total": len(client.lessons),
                    "lessons_used": len([1 for lesson in client.lessons if lesson.is_used]),
                    "subscription_end_date": client.subscriptions[-1].valid_until.strftime("%Y-%m-%d") if client.subscriptions else "No subscriptions"
                } for client in clients
            ]

            await ws.send_json({'code': 400, "data": data})

    async def get_subscriptions(self, username: str, ws: WebSocket):
        """Получает подписки клиента по username"""
        with Connection.session_scope() as session:
            # Ищем клиента через User, поскольку в Client нет поля username
            user = session.query(User).filter(User.username == username).first()
            if not user or not user.client_profile:
                await ws.send_json({'code': 404, 'error': 'Client not found'})
                return
                
            client = user.client_profile
            subs = client.subscriptions

            data = []
            for sub in subs:
                data.append({
                    "id": sub.id,
                    "client_id": client.id,
                    "start_date": datetime.now().strftime("%Y-%m-%d"),
                    "end_date": sub.valid_until.strftime("%Y-%m-%d"),
                    "lessons_total": sub.template.total_lessons,  # Предполагаю, что это поле в template
                    "lessons_used": len([1 for lesson in sub.lessons if lesson.is_used]),
                    "is_active": sub.template.total_lessons > len([1 for lesson in sub.lessons if lesson.is_used]),
                    "price": sub.template.price  # Предполагаю, что цена в template
                })
            
            sended_data = {'code': 403, 'data': data}
            print(f"{sended_data=}")
            await ws.send_json(sended_data)

    async def client_data(self, data, ws: WebSocket):
        """Обновляет данные клиента"""
        with Connection.session_scope() as session:
            client = session.get(Client, data.get('id'))
            if not client:
                await ws.send_json({'code': 500, 'error': 'Client not found'})
                return
            
            user = client.user
            
            # Обновляем данные клиента
            client.name = data.get('full_name')
            client.phone = data.get('phone')
            user.email = data.get('email')
            client.date_of_birth = datetime.strptime(data.get('birth_date'), "%Y-%m-%d") if data.get('birth_date') else client.date_of_birth
            client.sex = data.get('gender')
            client.status = data.get('is_active')
            client.description = data.get('comments')
            
            await ws.send_json({'code': 402, 'data': f"Successfully updated client {client.name}"})

    async def get_clients_lessons(self, username: str, ws: WebSocket):
        """Получает уроки клиента"""
        with Connection.session_scope() as session:
            user = session.query(User).filter(User.username == username).first()
            if not user or not user.client_profile:
                await ws.send_json({'code': 404, 'error': 'Client not found'})
                return
                
            client = user.client_profile
            lessons = client.lessons
            
            data = []
            for lesson in lessons:
                group = getattr(lesson, 'group', None)
                data.append({
                    "id": lesson.id,
                    "client_id": client.id,
                    "group_id": getattr(group, "id", None) if group else None,
                    "group_name": getattr(group, "name", None) if group else None,
                    "lesson_type": f"{client.coach.name} {lesson.date.strftime('%Y-%m-%d')}" if client.coach else lesson.date.strftime('%Y-%m-%d'),
                    "date": lesson.date.strftime("%Y-%m-%d"),
                    'coach_id': client.coach.id if client.coach else None,
                    "coach_name": client.coach.name if client.coach else None,
                })
            
            await ws.send_json({'code': 404, "data": data})

    def username_exist(self, username: str, session: Session) -> User:
        """Проверяет, существует ли пользователь с таким username"""
        return session.query(User).filter(User.username == username).first()

    async def create_client(self, client_data):
        """Создает нового клиента"""
        with Connection.session_scope() as session:
            username = custom_translit(client_data.get('username'))
            
            if self.username_exist(username, session):
                raise Exception('Username already exists')
            
            # Создаем пользователя
            user = User(
                username=username,
                email=client_data.get("email"),
                password=get_password_hash(password=client_data.get("password"))
            )
            session.add(user)
            session.flush()  # Получаем ID пользователя
            
            # Создаем профиль клиента
            client = Client(
                user_id=user.id,
                name=client_data.get('full_name'),
                phone=client_data.get("phone"),
                balance=0,
                joined=datetime.now(),
                date_of_birth=datetime.strptime(client_data.get("birth_date"), "%Y-%m-%d"),
                sex=1 if client_data.get("gender") == "female" else 0,
                status=client_data.get('is_active'),
                description=client_data.get("comments"),
            )
            
            if client_data.get('coach_id'):
                client.coach_id = client_data.get("coach_id")
            
            session.add(client)
            print(client.__dict__)

    async def delete_client(self, username: str):
        """Удаляет клиента"""
        with Connection.session_scope() as session:
            user = session.query(User).filter(User.username == username).first()
            if not user or not user.client_profile:
                raise Exception('Client not found')
            
            client = user.client_profile
            
            # Удаляем клиента (каскадно удалится и User, если настроено)
            session.delete(client)
            session.delete(user)  # Явно удаляем пользователя


# Создаем экземпляр менеджера
clients_manager = ClientsManager()


@clients_router.get('/')
def get_clients(request: Request):
    return templates.TemplateResponse(
        request=request, name='clients.html'
    )