from fastapi import Request,APIRouter,WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import HTMLResponse
from typeguard import typechecked
from connection import Connection
from utils import get_all_lessons, change_lesson_by_id,get_items_list
from models import Lesson, Client, Group,Coach,Subscription, SubscriptionSchedule
from fastapi.templating import Jinja2Templates
# from pathlib import Path
dashboard_router = APIRouter(prefix='/dashboard', tags=['dashboard'])


templates = Jinja2Templates(directory='templates')

class DashboardManager:
    def __init__(self):
        self.active_users = []
        self.session = Connection.get_session()
    
    async def connect(self, ws:WebSocket):
        await ws.accept()
        self.active_users.append(ws)


    def disconnect(self, ws:WebSocket):
        ws.close()
        self.active_users.remove(ws)


    async def send_lessons(self, ws:WebSocket):
        print('send')
        events = {
            'code':287,
            'data':get_all_lessons()}
        await ws.send_json(events)
        print('sended')


    async def send_active_clients(self, ws:WebSocket):
        response = {
            "code":289,
            'data':get_items_list(self.session, Coach, Group, Client)
            }
        await ws.send_json(response)
        print("sended fetch down : ", response)


    async def change_lessons_day_or_time(self, changed_data:dict):
        if all(key in changed_data for key in ['id', 'start', 'end']):
            try: 
                id = int(changed_data['id'])
            except ValueError:
                raise Exception ('id is not an int!')
            date,start_time  = changed_data['start'].split("T")
            end_date, end_time = changed_data['end'].split("T")
            if date != end_date:
                print('Error! Date mismatch. Lesson is longer than 1 day.')
                raise Exception("Date mismatch.")
            change_lesson_by_id(
                id = id,
                session = self.session,
                date = date, 
                start_time = start_time[:-6], 
                end_time =end_time[:-6]
                )
            print(f'Successfully changed lesson {changed_data['id']} !')
            return
        print("Error! Invalid Changed data!")


    async def recieve_message(self, ws: WebSocket):
        message = await ws.receive_json()
        print(f"recieved data: {message}")
        return message
    
    async def create_subscription(self, subscription_data:dict):
        subscription = Subscription(
            name=subscription_data['name'],
            price=subscription_data['price'],
            description=subscription_data['description'],
        )
        self.session.add(subscription)
        self.session.commit()
        print(f"Subscription {subscription.id} created successfully!")
        return subscription

    async def create_lesson(self, lesson_data:dict):
        lesson = Lesson(
            date=lesson_data['date'],
            start_time=lesson_data['start_time'],
            end_time=lesson_data['end_time'],
            client_id=lesson_data['client_id'],
            coach_id=lesson_data['coach_id'],
            group_id=lesson_data['group_id'],
            price=lesson_data['price'],
            subscription_id=lesson_data['subscription_id']
        )
        self.session.add(lesson)
        self.session.commit()
        print(f"Lesson {lesson.id} created successfully!")


    async def cancel_lesson(self, lesson_id:int):
        self.session.get(Lesson,lesson_id).is_cancelled = True
        self.session.commit()

    async def apply_schedule_for_subscription(self, data:dict):
        subscription = SubscriptionSchedule(
            subscription_id = data['subscription_id'],
            date =  data.get("date"),
            start_time = data['start_time'],
            end_time = data['end_time'],
            day_of_the_week = data.get('day_of_the_week')
        )
        self.session.add(subscription)
        self.session.commit()
        return subscription
    
    async def fetch_clients_subs_coaches(self, ws: WebSocket):
        data = get_items_list(self.session, Client, Subscription)
        await ws.send_json({"code":293, 'data':data})
manager = DashboardManager()

@dashboard_router.get('/')
async def dashboard_home(request: Request):
    return templates.TemplateResponse(
        request=request, name='index.html'
    )

