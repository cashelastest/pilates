from fastapi import APIRouter,Query,status
from fastapi.websockets import WebSocket, WebSocketDisconnect
from auth.auth import decode_jwt_token
from typing import List, Dict
from routers.dashboard import manager
from routers.client import clinet_manager
from routers.clients import clients_manager
from routers.group import GroupManager
from models import Lesson, Client,User
from connection import Connection
socket = APIRouter(prefix = '/socket')
group_manager = GroupManager()

class SocketManager:
    def __init__(self):
        self.user_connections: Dict[str, List[WebSocket]] = {}
        self.connections_to_user: Dict[WebSocket, str] = {}
        self.user_data: Dict[str, dict] = {}


    async def connect(self, websocket: WebSocket, user_id:str, user_data: dict = None):
        await websocket.accept()
        if user_id not in self.user_connections.keys():
            self.user_connections[user_id] = []
        self.user_connections[user_id].append(websocket)
        self.connections_to_user[websocket] = user_id
        if user_data:
            self.user_data[user_id] = user_data


    def disconnect(self, websocket: WebSocket):
        if websocket in self.connections_to_user:
            user_id = self.connections_to_user[websocket]
            if user_id in self.user_connections and websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
                if not self.user_connections[user_id]:
                    del self.user_connections[user_id]
                    if user_id in self.user_data:
                        del self.user_data[user_id]
            del self.connections_to_user[websocket]


socket_manager = SocketManager()


@socket.websocket('/')
async def dashboard_socket(ws:WebSocket, token: str = Query(None)):
    if not token:
        print(token)
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    payload = await decode_jwt_token(token=token)
    if not payload:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    username = payload.get("sub")
    with Connection.session_scope() as session:
        user = session.query(User).filter(User.username == username).first()
        if not user:
            await ws.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        await socket_manager.connect(ws, user.id)
    try:
        while True:
            data =await manager.recieve_message(ws)
            match data.get('code'):
                case 187: 
                    await manager.send_lessons(ws, socket_manager,is_changed=False)
                case 188:
                    await manager.change_lessons_day_or_time(changed_data=data)
                    await manager.send_lessons(ws)
                case 189:
                    await manager.send_active_clients(ws)
                case 190:
                    await manager.create_lesson(lesson_data=data['event'])
                    await manager.send_lessons(ws)
                case 191:
                    await manager.create_subscription(subscription_data=data['subscription'])
                case 193:
                    await manager.fetch_clients_subs_coaches(ws)
                case 194:
                    await clinet_manager.get_client_data(ws=ws, username = data.get("username"))
                case 195:
                    await clinet_manager.update_client_data(data=data.get('client'))
                case 196:
                    if not await clinet_manager.add_subscription_to_user(data=data.get('data')):
                        clinet_manager.roll()
                    await clinet_manager.get_client_data(ws=ws, username = data.get("username"))
                    await clinet_manager.fetch_client_lessons(ws=ws, username=data.get("username"))
                    await clinet_manager.get_subs(ws, data.get("username"))
                case 197:
                    await clinet_manager.fetch_client_lessons(ws=ws, username=data.get("username"))
                    print('Successfully worked with code 197')
                case 198:
                    await clinet_manager.get_subs(ws, data.get("username"))
                case 300:
                    await group_manager.get_group_and_coach(ws=ws)
                case 301: #its for 301, 302, 303
                    await group_manager.get_group_details(ws=ws, id = data.get('id'))
                case 304:
                    await group_manager.get_clients(ws=ws)
                case 305:
                    print("working on code 305")
                    await group_manager.get_coaches(ws =ws)
                case 317:
                    await group_manager.get_group_schedules(group_id=data.get("group_id"), ws=ws)
                case 320:
                    await group_manager.create_group(data=data.get('group'))
                    await group_manager.get_group_and_coach(ws=ws)
                case 321:
                    await group_manager.update_group(data.get("group"))
                    await group_manager.get_group_and_coach(ws=ws)
                case 322:
                    await group_manager.delete_group(data.get('id'))
                case 330:
                    await group_manager.add_member(client_id=data.get('client_id'), group_id = data.get('group_id'))
                    await group_manager.get_group_details(ws=ws, id = data.get('group_id'))
                    await group_manager.get_group_and_coach(ws=ws)
                case 331:
                    await group_manager.delete_member(data=data)
                    await group_manager.get_group_details(ws=ws, id = data.get('group_id'))
                case 340:
                    await group_manager.add_lesson_for_group(data=data)
                    await group_manager.get_group_details(ws=ws, id = data.get('group_id'))

                case 341:
                    await group_manager.cancel_lesson(lesson_id=data.get("id"))
                    lesson = group_manager.session.get(Lesson, data.get("id")) 
                    await group_manager.get_group_details(ws=ws, id = lesson.group_id)
                case 400:
                    await clients_manager.get_all_clients(ws=ws)
                #~ we would make it if buyer ask for this
                # case 401:
                #     await clients_manager.get_client(data.get("username"), ws)
                # case 402:
                #     await clients_manager.client_data(data.get('client'), ws=ws)
                # case 403:
                #     await clients_manager.get_subscriptions(data.get('username'), ws)
                # case 404:
                #     await clients_manager.get_clients_lessons(username=data.get('username'), ws=ws)
                case 406:
                    await clients_manager.create_client(data.get('client'))
                    await clients_manager.get_all_clients(ws=ws)
                case 407:
                    await clients_manager.delete_client(data.get("username"))
                    await clients_manager.get_all_clients(ws=ws)
                case _:
                    print('don`t understand')
                    print(data)
            await ws.send_json({
                'code': 200,
                'data': 'success'
            })


    except WebSocketDisconnect:
        socket_manager.disconnect(ws)
        print("Ended websocket connection")
