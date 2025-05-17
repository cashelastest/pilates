from fastapi import APIRouter,Request, Depends
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from fastapi.websockets import WebSocket
from connection import Connection,get_db
from models import Client, Lesson, Subscription, SubscriptionSchedule, SubscriptionTemplate
from datetime import datetime
from utils import generate_dates

client_router = APIRouter(prefix='/client', tags = ['client'])
templates = Jinja2Templates(directory='templates')

class Manager:
    def __init__(self):
        self.session = Connection.get_session()


class Transaction:
    def __init__(self,session):
        self.session = session
    def __enter__(self):
        return Connection.get_session()
    def __exit__(self, exc_type, exc_value, exc_tb):
        if not exc_type:
            try:
                self.session.commit() 
            except Exception as e:
                self.session.rollback()
                print(f"Error in commit {e}")
            return
        self.session.rollback()
        self.session.close()


class ClientManager(Manager):
    async def get_client_data(self, ws: WebSocket, username:str, session:Session = Depends(get_db)):
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
            "coach_name":client.coach.name if client.coach else 'Не призначено',
            "description":client.description
            }
        }
        print(client_data)
        await ws.send_json(client_data)


    async def get_subs(self, ws:WebSocket, username:str, session:Session = Depends(get_db)):
        client = self.session.query(Client).filter(Client.username ==username).first()
        subs = client.subscriptions
        all_subs = self.session.query(SubscriptionTemplate).all()
        # print(list(all_subs))
        subs_data = [{
            "id":template.id,
            "name":template.name,
            "is_group": True if template.group else False} 
              for template in all_subs]
        data = []

        for subscription in subs:
            if subscription.template.group:
                schedules = [
                    {
                    'id':schedule.id,
                    'day_of_the_week':schedule.day_of_the_week,
                    "start_time": schedule.start_time.strftime("%H:%M:%S"),
                    "end_time": schedule.end_time.strftime("%H:%M:%S"),
                    } for schedule in subscription.template.group.schedules]
            else:
                schedules = [
                    {
                    'id':schedule.id,
                    'day_of_the_week':schedule.day_of_the_week,
                    "start_time": schedule.start_time.strftime("%H:%M:%S"),
                    "end_time": schedule.end_time.strftime("%H:%M:%S"),
                    } for schedule in subscription.schedules]
            used_lessons = len([0 for lesson in subscription.lessons if lesson.is_used])
            data.append(
                {
                "id":subscription.id,
                "name":subscription.template.name,
                "price":subscription.template.price,
                'total_lessons': subscription.template.total_lessons,
                'used_lessons': used_lessons,
                'valid_until': datetime.strftime(subscription.valid_until, "%Y-%m-%d"),
                'is_active': subscription.template.total_lessons>used_lessons,
                "schedules": schedules,
            })
        response = {
            'code':296,
            'data':{
                "subscriptions":data,
                "all_subscriptions":subs_data
            }
        }
        print(response)
        await ws.send_json(response)

    async def add_subscription_to_user(self, data:dict):

        try:
           template_id = int(data.get("template"))
        except ValueError:
            print('ERROR template_id is not an int type')
            return
        client = self.session.query(Client).filter(Client.username == data.get("client_id")).first()
        print(f"CLIENT ID IN ADDING SUBS {client.id}")
        subscription = Subscription(
            template_id = template_id,
            client_id = client.id
        )

        self.session.add(subscription)
        self.session.flush()
        if data.get("schedules"):
            schedules = [SubscriptionSchedule(
                subscription_id = subscription.id,
                    start_time = schedule_data.get("start_time"),
                    end_time = schedule_data.get("end_time"),
                    day_of_the_week = schedule_data.get("day_of_the_week")
                ) for schedule_data in data.get('schedules') ]
            self.session.add_all(schedules)
        else:
            print("else")
            schedules = subscription.template.group.schedules

        schedule_data = list(tuple([schedule.day_of_the_week, schedule.start_time, schedule.end_time]) for schedule in schedules)
        lessons =[]
        dates = generate_dates(
            info=schedule_data,
            count=subscription.template.total_lessons)
        if len(dates) < subscription.template.total_lessons:
            self.session.rollback()
            raise Exception(f"Not enough lessons {dates}")
        for lesson_index in range(subscription.template.total_lessons):
            lesson = Lesson(
                price = subscription.template.price//subscription.template.total_lessons,
                date = dates[lesson_index][0],
                start_time = dates[lesson_index][1].strftime("%H:%M"),
                end_time = dates[lesson_index][2].strftime("%H:%M"),
                is_used= False,
                subscription_id = subscription.id,
                client_id = client.id,
                coach_id = subscription.template.coach.id
            )
            lessons.append(lesson)
        self.session.add_all(lessons)
        self.session.commit()
        print(f"generated {len(lessons)} lessons")
        return True

    async def fetch_client_lessons(self, ws:WebSocket, username : str, session:Session = Depends(get_db)):
        client = session.query(Client).filter(Client.username == username).first()
        lessons = client.lessons
        response_data = [{
            "id":lesson.id,
            "title": lesson.group.name if getattr(lesson, "group") else lesson.coach.name,
            'date': datetime.strftime(lesson.date, '%Y-%m-%d'),
            "start_time": lesson.start_time.strftime("%H:%M:%S"),
            "end_time": lesson.end_time.strftime("%H:%M:%S"),
            "coach_name":lesson.coach.name,
            "price":lesson.price,
            "is_cancelled":lesson.is_cancelled
        } for lesson in lessons]
        response = {
            "code": 295,
            "data":response_data
        }
        await ws.send_json(response)

    async def update_client_data(self, data, session:Session = Depends(get_db)):
        print(data.get('client_username'))
        client = session.query(Client).filter(Client.username == data.get('client_username')).first()
        del data['client_username']
        for attr, attr_value in data.items():
            setattr(client, attr, attr_value)
        session.commit()
        print(f"Successfully updated user {client.id}")
    # async def assign_sub(self,subs_id, client_username,data, session:Session = Depends(get_db)):
    #     client = session.query(Client).filter(Client.username == client_username).first()
    #     subscription = session.get(Subscription, subs_id)
    #     schedule = SubscriptionSchedule(
    #         client_id = client.id,
    #         subscription = subs_id,
    #         day_of_the_week = data.get('day_of_the_week'),
    #         start_time = data.get("start_time"),
    #         end_time = data.get("end_time")
    #     )
    #     session.add(schedule)
    #     session.commit()
        
    async def use_sub(self, sub_id,client_name, session = Depends(get_db)):
        print('name')
        subscription = session.get(Subscription, sub_id)
        schedules = subscription.schedules
        schedule_info = [(schedule.day_of_the_week,
                           schedule.start_time,
                             schedule.end_time)
                               for schedule in schedules]
        print(schedule_info)
        client =session.query(Client).filter(Client.username == client_name).first()
        with Transaction(session) as transaction:
            client.balance-=subscription.price
            subscription.is_active = True

            lessons =[]
            dates = generate_dates(
                info=schedule_info,
                count=subscription.total_lessons)
            for lesson_index in range(subscription.total_lessons):
                lesson = Lesson(
                    price = subscription.price//subscription.total_lessons,
                    date = dates[lesson_index][0],
                    start_time = dates[lesson_index][1].strftime("%H:%M:%S"),
                    end_time = dates[lesson_index][2].strftime("%H:%M:%S"),
                    subscription_id = sub_id,
                    client_id = client.id,
                    coach_id = client.coach.id
                )
                lessons.append(lesson)
            session.add_all(lessons)
    # def roll (self, session:Session = Depends(get_db)):
    #     session.rollback()

    #     print("Success!")
clinet_manager = ClientManager()


@client_router.get('/info/')
def client_info(request: Request):
    # clinet_manager.use_sub()
    return templates.TemplateResponse(
        request=request, name='client.html'
    )