from fastapi import APIRouter
from fastapi.websockets import WebSocket, WebSocketDisconnect
from routers.dashboard import manager
from routers.client import clinet_manager


socket = APIRouter(prefix = '/socket')
class SocketManager:
    connecions = []
@socket.websocket('/')
async def dashboard_socket(ws:WebSocket):
    await manager.connect(ws)
    SocketManager.connecions.append(ws)
    try:
        while True:
            data =await manager.recieve_message(ws)
            match data.get('code'):
                case 187: 
                    await manager.send_lessons(ws, is_changed=False)
                case 188:
                    await manager.change_lessons_day_or_time(changed_data=data)
                    await manager.send_lessons(ws)
                case 189:
                    await manager.send_active_clients(ws)
                case 190:
                    print(data)
                    await manager.create_lesson(lesson_data=data['event'])
                    await manager.send_lessons(ws)
                case 191:
                    await manager.create_subscription(subscription_data=data['subscription'])
                case 192:
                    await manager.apply_schedule_for_subscription(data['schedule'])
                case 193:
                    await manager.fetch_clients_subs_coaches(ws)
                case 194:
                    await clinet_manager.get_client_data(ws=ws, username = data.get("username"))
                case 195:
                    await clinet_manager.update_client_data(data=data.get('client'))
                case 198:
                    await clinet_manager.get_subs(ws=ws, username=data.get('username'))
                case 197:
                    await clinet_manager.fetch_client_lessons(ws=ws, username=data.get("username"))
                case 199:
                    await clinet_manager.use_sub(data.get("sub_id"),data.get("client_name"))
                case _:
                    print('don`t understand')
                    print(data)
            await ws.send_json({
                'code': 200,
                'data': 'success'
            })
    except WebSocketDisconnect:
        await manager.disconnect(ws)
        SocketManager.connecions.remove(ws)
        print("Ended websocket connection")
