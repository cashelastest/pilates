from fastapi import APIRouter, Request
from fastapi.exceptions import HTTPException
from fastapi.responses import HTMLResponse
from fastapi.websockets import WebSocket
from fastapi.templating import Jinja2Templates
from routers.client import Manager
from models import Group, Client, ClientGroupAssociation, Coach, Lesson, SubscriptionSchedule
from datetime import datetime


templates = Jinja2Templates(directory='templates')
group_router = APIRouter(prefix='/group', tags=['group'])

class GroupManager(Manager):


    async def get_group_and_coach(self, ws: WebSocket) -> bool|None:
        groups = self.session.query(Group).all()
        data = []
        
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
        print(group_info)
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


    async def delete_member(self, data)->bool|None:
        client_id = data.get("client_id")
        group_id = data.get("group_id")
        print(f"{client_id=} {group_id=}")
        client_to_delete = self.session.query(ClientGroupAssociation).filter(
            (ClientGroupAssociation.client_id == client_id) &
            (ClientGroupAssociation.group_id == group_id)
            ).first()
        if client_to_delete:
            self.session.delete(client_to_delete)
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
        schedules=group_info.get("schedules")
        new_schedules = []
        for schedule_info in schedules:
            if schedule_info.get("id") in [schedule.id for schedule in group.schedules]:
                schedule = self.session.get(SubscriptionSchedule, schedule_info.get('id'))
                schedule.day_of_the_week = schedule_info.get('day_of_the_week')
                schedule.start_time = schedule_info.get("start_time")
                schedule.end_time = schedule_info.get("end_time")
                continue
            new_schedule = SubscriptionSchedule(
                day_of_the_week = schedule_info.get("day_of_the_week"),
                start_time = schedule_info.get("start_time"),
                end_time = schedule_info.get("end_time"),
                group_id = group_info.get("id")
            )
            new_schedules.append(new_schedule)
        self.session.add_all(new_schedules)                
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
    

    async def cancel_lesson(self,lesson_id:int):
        lesson = self.session.get(Lesson, lesson_id)
        lesson.is_cancelled = True
        self.session.commit()


    async def get_coaches(self, ws:WebSocket):
        coaches = self.session.query(Coach).all()
        data = [{"id":coach.id, "name":coach.name} for coach in coaches]
        await ws.send_json({"code":315, "data":data})
        return True

    
    async def delete_group(self, group_id:int)->bool|None:
        group_to_delete = self.session.get(Group, group_id)
        if group_to_delete:
            self.session.delete(group_to_delete)
            self.session.commit()
            return True
        
    async def create_group(self, data):
        # if not all(data.get(key) for key in ['name', 'coach_id','coach_name', 'status', 'description']):
        #     return
        group = Group(
            name = data.get("name"),
            coach_id = data.get("coach_id"),
            status = data.get("status"),
            description = data.get("description"),
        )
        self.session.add(group)
        self.session.flush()
        schedules = [SubscriptionSchedule(
            day_of_the_week = schedule.get("day_of_the_week"),
            start_time = schedule.get("start_time"),
            end_time = schedule.get("end_time"),
            group_id = group.id
        ) for schedule in data.get("schedules")]
        self.session.add_all(schedules)
        self.session.commit()






    async def get_group_schedules(self, group_id:int, ws:WebSocket):
        group = self.session.get(Group, group_id)
        if not group:
            raise HTTPException(status_code=404, detail="No such group")
        schedules=[
                 {
                     "id":schedule.id,
                     "day_of_the_week":schedule.day_of_the_week,
                     "start_time": schedule.start_time.strftime("%H:%M:%S"),
                     "end_time": schedule.end_time.strftime("%H:%M:%S"),

                 } for schedule in group.schedules
             ]
        await ws.send_json({"code":317, "data":schedules})
    

    

@group_router.get("/")
def get_groups(request:Request):
    return templates.TemplateResponse(
        request=request, name = 'group.html'
    )
    