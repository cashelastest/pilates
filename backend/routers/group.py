from fastapi import APIRouter, Request
from fastapi.exceptions import HTTPException
from fastapi.responses import HTMLResponse
from fastapi.websockets import WebSocket
from fastapi.templating import Jinja2Templates
from routers.client import create_group_lessons_schedule
from models import Group, Client, ClientGroupAssociation, Coach, Lesson, SubscriptionSchedule, Subscription, GroupLessonPayed
from datetime import datetime, timedelta
from connection import Connection, get_db, db_session
from logger import loggers
logger = loggers['group']
templates = Jinja2Templates(directory='templates')
group_router = APIRouter(prefix='/groups', tags=['group'])


class GroupManager:
    async def get_group_and_coach(self, ws: WebSocket) -> bool | None:
        """Получает все группы с тренерами"""
        with Connection.session_scope() as session:
            groups = session.query(Group).all()
            data = []
            
            for group in groups:
                group_info = {
                    'id': group.id,
                    'name': group.name,
                    'coach_id': group.coach_id,
                    "coach_name": group.coach.name,
                    "status": group.status,
                    "description": group.description,
                    "members_count": len(group.clients),
                    'members': [
                        {"id": member.id, "name": member.name}
                        for member in group.clients
                    ]
                }
                data.append(group_info)

            await ws.send_json({"code": 310, "data": data})
            return True

    async def get_group_details(self, id: int, ws: WebSocket):
        """Получает детальную информацию о группе"""
        with Connection.session_scope() as session:
            group = session.get(Group, id)
            if not group:
                await ws.send_json({"code": 404, "error": "Group not found"})
                return

            data = {
                "id": id,
                "name": group.name,
                "coach_name": group.coach.name,
                "status": group.status,
                "members_count": len(group.clients),
                "description": group.description,
            }
            await ws.send_json({"code": 311, "data": data})

            members = [
                {"id": member.id, "name": member.name} for member in group.clients
            ]
            await ws.send_json({'code': 312, 'data': members})

            unique_lessons = {
                f"{lesson.date}_{lesson.start_time}_{lesson.end_time}":
                {
                    "id": lesson.id,
                    "title": lesson.coach.name + " " + datetime.strftime(lesson.date, "%Y-%m-%d"),
                    "date": datetime.strftime(lesson.date, "%Y-%m-%d"), 
                    "start_time": lesson.start_time.strftime("%H:%M:%S"),
                    "end_time": lesson.end_time.strftime("%H:%M:%S"),
                    "coach_name": lesson.coach.name,
                    "price": lesson.price,
                    "is_cancelled": lesson.is_cancelled
                } for lesson in group.lessons
            }
            await ws.send_json({"code": 313, "data": list(unique_lessons.values())})
            return True

    async def get_clients(self, ws: WebSocket):
        """Получает всех клиентов"""
        with Connection.session_scope() as session:
            clients = session.query(Client).all()
            data = [{"id": client.id, "name": client.name} for client in clients]
            await ws.send_json({"code": 314, "data": data})

    async def add_member(self, client_id, group_id) -> dict[str, int | str] | bool:
        """Добавляет участника в группу"""
        with Connection.session_scope() as session:
            group = session.get(Group, group_id)
            client = session.get(Client, client_id)
            
            if not group:
                return {"code": 900, 'message': "No group"}
            if not client:
                return {"code": 901, "message": "No client found"}
            
            # Проверяем, что клиент еще не в группе
            existing_association = session.query(ClientGroupAssociation).filter(
                ClientGroupAssociation.client_id == client_id,
                ClientGroupAssociation.group_id == group_id
            ).first()
            
            if existing_association:
                return {"code": 902, "message": "Client already in group"}
            
            client_group = ClientGroupAssociation(
                client_id=client_id,
                group_id=group_id
            )
            session.add(client_group)
            return True

    async def delete_member(self, data) -> bool | None:
        """Удаляет участника из группы"""
        with Connection.session_scope() as session:
            client_id = data.get("client_id")
            group_id = data.get("group_id")
            print(f"{client_id=} {group_id=}")
            
            client_to_delete = session.query(ClientGroupAssociation).filter(
                (ClientGroupAssociation.client_id == client_id) &
                (ClientGroupAssociation.group_id == group_id)
            ).first()
            
            if not client_to_delete:
                return None
                
            # Проверяем активные подписки
            active_subs = [
                sub for sub in client_to_delete.client.subscriptions 
                if sub.template and hasattr(sub.template, 'group_id') and 
                sub.template.group_id == group_id and
                len([lesson for lesson in sub.lessons if lesson.is_used]) < sub.template.total_lessons
            ]
            
            if active_subs:
                return "error"
                
            session.delete(client_to_delete)
            return True

    async def update_group(self, group_info):
        """Обновляет информацию о группе"""
        with Connection.session_scope() as session:
            group = session.get(Group, group_info.get("id"))
            if not group:
                return {"code": 900, "message": "No group"}
            
            group.name = group_info.get('name')
            group.coach_id = group_info.get('coach_id')
            group.status = group_info.get("status")
            group.description = group_info.get("description")
            
            schedules = group_info.get("schedules", [])
            existing_schedule_ids = [schedule.id for schedule in group.schedules]
            new_schedules = []
            
            for schedule_info in schedules:
                schedule_id = schedule_info.get("id")
                if schedule_id in existing_schedule_ids:
                    # Обновляем существующее расписание
                    schedule = session.get(SubscriptionSchedule, schedule_id)
                    if schedule:
                        schedule.day_of_the_week = schedule_info.get('day_of_the_week')
                        schedule.start_time = schedule_info.get("start_time")
                        schedule.end_time = schedule_info.get("end_time")
                else:
                    # Создаем новое расписание
                    new_schedule = SubscriptionSchedule(
                        day_of_the_week=schedule_info.get("day_of_the_week"),
                        start_time=schedule_info.get("start_time"),
                        end_time=schedule_info.get("end_time"),
                        group_id=group_info.get("id")
                    )
                    new_schedules.append(new_schedule)
            
            session.add_all(new_schedules)
            return True

    async def add_lesson_for_group(self, data):
        """Добавляет урок для всех участников группы"""
        with Connection.session_scope() as session:
            group = session.get(Group, data.get("group_id"))
            if not group:
                return False
                
            lesson_info = data.get("lesson")
            lessons = []
            
            for client in group.clients:
                lesson = Lesson(
                    date=lesson_info.get('date'),
                    start_time=lesson_info.get("start_time"),
                    end_time=lesson_info.get("end_time"),
                    price=lesson_info.get('price'),
                    coach_id=group.coach.id,
                    client_id=client.id,
                    group_id=group.id,
                    is_cancelled=False,
                )
                lessons.append(lesson)
            
            session.add_all(lessons)
            return True

    async def cancel_lesson(self, lesson_id: int):
        """Отменяет урок"""
        with Connection.session_scope() as session:
            lesson = session.get(Lesson, lesson_id)
            if lesson:
                lesson.is_cancelled = True

    async def get_coaches(self, ws: WebSocket):
        """Получает всех тренеров"""
        with Connection.session_scope() as session:
            coaches = session.query(Coach).all()
            data = [{"id": coach.id, "name": coach.name} for coach in coaches]
            await ws.send_json({"code": 315, "data": data})
            return True

    async def delete_group(self, group_id: int) -> bool | None:
        """Безопасное удаление группы с проверками"""
        with Connection.session_scope() as session:
            group_to_delete = session.get(Group, group_id)
            if not group_to_delete:
                return False
                
            # Проверяем есть ли активные абонементы у клиентов группы
            active_subscriptions = []
            for template in group_to_delete.subscriptions_templates:
                active_subs = session.query(Subscription).filter(
                    Subscription.template_id == template.id,
                    Subscription.is_active == True
                ).all()
                active_subscriptions.extend(active_subs)
                
            if active_subscriptions:
                # Возвращаем ошибку если есть активные абонементы
                raise Exception(f"Невозможно удалить группу. У {len(active_subscriptions)} клиентов есть активные абонементы")
            
            # Сначала удаляем все связанные записи об оплаченных групповых уроках
            group_lessons = session.query(Lesson).filter(
                Lesson.group_id == group_id
            ).all()
            
            for lesson in group_lessons:
                # Удаляем записи об оплаченных групповых уроках
                paid_lessons = session.query(GroupLessonPayed).filter(
                    GroupLessonPayed.lesson_id == lesson.id
                ).all()
                for paid_lesson in paid_lessons:
                    session.delete(paid_lesson)
            
            # Теперь можно безопасно удалить группу
            # Cascade автоматически удалит:
            # - client_associations
            # - lessons  
            # - schedules
            # - subscriptions_templates
            session.delete(group_to_delete)
            return True



    async def create_group(self, data):
        """Создание группы с автоматическим созданием шаблонов уроков"""
        with Connection.session_scope() as session:
            group = Group(
                name=data.get("name"),
                coach_id=data.get("coach_id"),
                status=data.get("status"),
                description=data.get("description"),
            )
            session.add(group)
            session.flush()
            
            # Создаем расписание
            schedules = [SubscriptionSchedule(
                day_of_the_week=schedule.get("day_of_the_week"),
                start_time=schedule.get("start_time"),
                end_time=schedule.get("end_time"),
                group_id=group.id
            ) for schedule in data.get("schedules", [])]
            
            session.add_all(schedules)
            session.flush()
            logger.debug(f"Schedules of the group: {schedules}")
            # Создаем шаблоны групповых уроков
            await create_group_lessons_schedule(session, group.id)

    async def get_group_schedules(self, group_id: int, ws: WebSocket):
        """Получает расписание группы"""
        with Connection.session_scope() as session:
            group = session.get(Group, group_id)
            if not group:
                await ws.send_json({"code": 404, "error": "Group not found"})
                return
                
            schedules = [
                {
                    "id": schedule.id,
                    "day_of_the_week": schedule.day_of_the_week,
                    "start_time": schedule.start_time.strftime("%H:%M:%S"),
                    "end_time": schedule.end_time.strftime("%H:%M:%S"),
                } for schedule in group.schedules
            ]
            await ws.send_json({"code": 317, "data": schedules})



# Создаем экземпляр менеджера
group_manager = GroupManager()


@group_router.get("/")
def get_groups(request: Request):
    return templates.TemplateResponse(
        'group.html', {'request': request} 
    )