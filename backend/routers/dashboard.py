from fastapi import Request, APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.responses import HTMLResponse
from typeguard import typechecked
from connection import Connection
from utils import get_all_lessons, change_lesson_by_id, get_items_list
from models import Lesson, Client, Group, Coach, Subscription, SubscriptionSchedule
from fastapi.templating import Jinja2Templates
from models import User
from auth.auth import get_current_user_from_cookie
from logger import loggers
logger = loggers['dashboard']
dashboard_router = APIRouter(prefix='/dashboard', tags=['dashboard'])

templates = Jinja2Templates(directory='templates')

class DashboardManager:
    async def send_lessons(self, ws: WebSocket, socket_manager, user_type="admin", id=None, is_changed=True):
        datas = {
            'admin':get_all_lessons(user_type, id),
            "coach":get_all_lessons("coach", id),
            "client":get_all_lessons('client', id)
        }
        # if not is_changed:
        #     await ws.send_json(events)
        #     return
        for user_id, websocket in socket_manager.user_connections.items():
            logger.debug(f'Sending lessons for {user_id} with type {type(user_id)} {websocket[0]}')
            with Connection.session_scope() as session:
                user= session.get(User,user_id)
                result_events = {
                    'code': 287,
                    'data':datas[user.user_type]
                }

            await websocket[0].send_json(result_events)

    async def send_active_clients(self, ws: WebSocket):
        with Connection.get_session() as session:
            response = {
                "code": 289,
                'data': get_items_list(session, Coach, Group, Client)
            }
            await ws.send_json(response)
            print("sended fetch down : ", response)

    async def change_lessons_day_or_time(self, changed_data: dict):
        if all(key in changed_data for key in ['id', 'start', 'end']):
            try: 
                id = int(changed_data['id'])
            except ValueError:
                raise Exception('id is not an int!')
            date, start_time = changed_data['start'].split("T")
            end_date, end_time = changed_data['end'].split("T")
            if date != end_date:
                print('Error! Date mismatch. Lesson is longer than 1 day.')
                raise Exception("Date mismatch.")
            
            with Connection.get_session() as session:
                change_lesson_by_id(
                    id=id,
                    session=session,
                    date=date, 
                    start_time=start_time[:-6], 
                    end_time=end_time[:-6]
                )
            print(f'Successfully changed lesson {changed_data["id"]} !')
            return
        print("Error! Invalid Changed data!")

    async def recieve_message(self, ws: WebSocket):
        message = await ws.receive_json()
        print(f"recieved data: {message}")
        return message

    async def create_lesson(self,ws:WebSocket, lesson_data: dict):
        with Connection.get_session() as session:
            lesson = Lesson(
                date=lesson_data['date'],
                start_time=lesson_data['start_time'],
                end_time=lesson_data['end_time'],
                client_id=lesson_data['client_id'],
                coach_id=lesson_data['coach_id'],
                group_id=lesson_data['group_id'],
                price=lesson_data['price'],
            )
            client = session.get(Client, lesson_data.get("client_id"))
            if client.balance < lesson_data.get("price"):
                ws.send_json({"code":400, "details":"Not enought money!"})
                return
            client.balance -= lesson_data.get("price")
            logger.info(f' Client balance after creating lesson{client.balance}')
            session.refresh(client)
            session.add(lesson)
            session.commit()
            print(f"Lesson {lesson.id} created successfully!")

    async def cancel_lesson(self, lesson_id: int):
        with Connection.get_session() as session:
            lesson = session.get(Lesson, lesson_id)
            lesson.is_cancelled = True
            session.commit()

    async def fetch_clients_subs_coaches(self, ws: WebSocket):
        with Connection.get_session() as session:
            data = get_items_list(session, Client)
            await ws.send_json({"code": 293, 'data': data})

manager = DashboardManager()

@dashboard_router.get('/')
async def dashboard_home(request: Request, user: User = Depends(get_current_user_from_cookie)):
    if user.user_type != "user":
        return templates.TemplateResponse(
            request=request, name='index.html'
        )
    return templates.TemplateResponse(
        request=request, name='forbidden.html'
    )