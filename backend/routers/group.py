from fastapi import APIRouter, Request
from fastapi.exceptions import HTTPException
from fastapi.responses import HTMLResponse
from fastapi.websockets import WebSocket
from fastapi.templating import Jinja2Templates
from routers.client import Manager
from models import Group, Client, ClientGroupAssociation, Coach, Lesson
from datetime import datetime
templates = Jinja2Templates(directory='templates')

group_router = APIRouter(prefix='/group', tags=['group'])


class GroupManager(Manager):


    async def get_group_and_coach(self, ws: WebSocket) -> bool|None:
        groups = self.session.query(Group).all()
        data = []
        print(groups)
        for group in groups:
            group_info = {
                'id':group.id,
                'name':group.name,
                'coach_id':group.coach_id,
                "coach_name":group.coach.name,
                "status":group.status,
                "description":group.description,
                "members_count":len(group.clients),
                'members':[
                    {"id":member.id,
                      "name":member.name}
                        for member in group.clients
                ]
            }
            data.append(group_info)
        await ws.send_json({"code":310, "data":data})
        return True
    
    async def get_group_details(self, id:int, ws:WebSocket):
        group = self.session.get(Group, id)
        data = {
            "id":id,
            "name": group.name,
            "coach_name": group.coach.name,
            "status" : group.status,
            "members_count":len(group.clients),
            "description":group.description,

        }
        await ws.send_json({"code":311, "data":data})
        members=[
              {"id":member.id, "name":member.name} for member in group.clients
          ]
        await ws.send_json({'code':312, 'data':members})
        unique_lessons = {
            f"{lesson.date}_{lesson.start_time}_{lesson.end_time}":
            {"id":lesson.id,
                "title":lesson.coach.name + " " + datetime.strftime(lesson.date, "%Y-%m-%d") ,
                "date":datetime.strftime(lesson.date, "%Y-%m-%d"), 
                "start_time":lesson.start_time.strftime("%H:%M:%S"),
                "end_time":lesson.end_time.strftime("%H:%M:%S"),
                "coach_name":lesson.coach.name,
                "price":lesson.price,
                "is_cancelled":lesson.is_cancelled
                }  for lesson in group.lessons
        }
        # lessons=[
        #        {"id":lesson.id,
        #         "title":lesson.coach.name +datetime.strftime(lesson.date, "%Y-%m-%d") ,
        #         "date":datetime.strftime(lesson.date, "%Y-%m-%d"), 
        #         "start_time":lesson.start_time.strftime("%H:%M:%S"),
        #         "end_time":lesson.end_time.strftime("%H:%M:%S"),
        #         "coach_name":lesson.coach.name,
        #         "price":lesson.price,
        #         "is_cancelled":lesson.is_cancelled
        #         } for lesson in group.lessons
        #   ]
        await ws.send_json({"code":313,"data":list(unique_lessons.values())})
        return True
    async def get_clients(self, ws:WebSocket):
        clients = self.session.query(Client).all()
        data = [{"id":client.id, "name":client.name} for client in clients]
        await ws.send_json({"code":314, "data":data})


    async def add_member(self, client_id, group_id) -> dict[str:int|str] | bool:
        group = self.session.get(Group, group_id)
        client = self.session.get(Client, client_id)
        if not group:
            return {"code": 900, 'messaege':"No group"}
        if not client:
            return {"code": 901, "message":"no client found"}
        client_group = ClientGroupAssociation(
            client_id = client_id,
            group_id = group_id
        )
        self.session.add(client_group)
        self.session.commit()
        return True


    async def update_group(self, group_info):
        group = self.session.get(Group, group_info.get("id"))
        if not group:
            return {"code": 900, "message":"no group"}
        group.name = group_info.get('name')
        group.coach_id = group_info.get('coach_id')
        group.status = group_info.get("status")
        group.description = group_info.get("description")
        self.session.commit()
        return True
    
    async def add_lesson_for_group(self, data):
        group = self.session.get(Group, data.get("group_id"))
        lesson_info = data.get("lesson")
        lessons = []
        for client in group.clients:
            lesson = Lesson(
                date = lesson_info.get('date'),
                start_time = lesson_info.get("start_time"),
                end_time = lesson_info.get("end_time"),
                price = lesson_info.get('price'),
                coach_id = group.coach.id,
                client_id = client.id,
                group_id = group.id,
                is_cancelled = False,
            )
        
            lessons.append(lesson)
        self.session.add_all(lessons)
        self.session.commit()
        return True
    
    async def get_coaches(self, ws:WebSocket):
        coaches = self.session.query(Coach).all()
        data = [{"id":coach.id, "name":coach.name} for coach in coaches]
        await ws.send_json({"code":315, "data":data})
        return True

@group_router.get("/")
def get_groups(request:Request):
    return templates.TemplateResponse(
        request=request, name = 'group.html'
    )
    