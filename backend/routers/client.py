from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from fastapi.websockets import WebSocket
from connection import Connection, get_db, db_session
from models import Client, Lesson, Subscription, SubscriptionSchedule, SubscriptionTemplate, User, GroupLessonPayed, Group
from datetime import datetime, timedelta
from utils import generate_dates
from auth.auth import get_password_hash
from logger import loggers
client_router = APIRouter(prefix='/client', tags=['client'])
templates = Jinja2Templates(directory='templates')
logger = loggers['client']

class ClientManager:
    def get_client_and_user(self, username: str, session: Session):
        """Получает пользователя и клиента по username"""
        user = session.query(User).filter(User.username == username).first()
        if not user:
            return None, None
        client = user.client_profile
        return user, client

    async def get_client_data(self, ws: WebSocket, username: str):
        """Получает данные клиента и отправляет через WebSocket"""
        with Connection.session_scope() as session:
            user, client = self.get_client_and_user(username, session)
            if not client:
                await ws.send_json({"code": 404, "error": f"Client '{username}' not found"})
                return

            client_data = {
                'code': 294,
                "data": {
                    'name': client.name,
                    'balance': client.balance,
                    "status": client.status,
                    "joined": datetime.strftime(client.joined, "%Y-%m-%d"),
                    "email": user.email,
                    "username": username,
                    "date_of_birth": datetime.strftime(client.date_of_birth, "%Y-%m-%d"),
                    "sex": client.sex,
                    "coach_name": client.coach.name if client.coach else 'Не призначено',
                    "description": client.description
                }
            }
            print(client_data)
            await ws.send_json(client_data)
    async def get_subs(self, ws: WebSocket, username: str):
        """Получает подписки клиента"""
        with Connection.session_scope() as session:
            user, client = self.get_client_and_user(username, session)
            if not client:
                logger.error(f"Client not found for username: {username}")
                await ws.send_json({"code": 404, "error": "Client not found"})
                return

            logger.debug(f"Client found: {client.name} (ID: {client.id})")
            
            # Отладка клиентских подписок
            subs = client.subscriptions
            logger.debug(f"Client subscriptions count: {len(subs)}")
            for sub in subs:
                logger.debug(f"Subscription {sub.id} - template: {sub.template.name}")
            
            # Отладка всех шаблонов подписок
            logger.debug("Querying all SubscriptionTemplate...")
            all_subs = session.query(SubscriptionTemplate).all()
            logger.info(f"Found {len(all_subs)} subscription templates")
            
            if not all_subs:
                # Дополнительная проверка
                logger.warning("No subscription templates found. Checking table...")
                count = session.query(SubscriptionTemplate).count()
                logger.debug(f"Total count in SubscriptionTemplate table: {count}")
                
                # Проверим что таблица существует
                try:
                    result = session.execute("SHOW TABLES LIKE '%subscription%'")
                    tables = result.fetchall()
                    logger.debug(f"Tables with 'subscription': {tables}")
                except Exception as e:
                    logger.error(f"Error checking tables: {e}")
            
            # Логирование каждого шаблона
            for template in all_subs:
                logger.debug(f"Template {template.id}: {template.name}, group_id: {template.group_id}")
            
            subs_data = [{
                "id": template.id,
                "name": template.name,
                "is_group": template.group_id is not None} 
                for template in all_subs]
            
            logger.debug(f"subs_data prepared: {subs_data}")
            
            data = []
            for subscription in subs:
                try:
                    if subscription.template.group:
                        schedules = [
                            {
                                'id': schedule.id,
                                'day_of_the_week': schedule.day_of_the_week,
                                "start_time": schedule.start_time.strftime("%H:%M:%S"),
                                "end_time": schedule.end_time.strftime("%H:%M:%S"),
                            } for schedule in subscription.template.group.schedules]
                    else:
                        schedules = [
                            {
                                'id': schedule.id,
                                'day_of_the_week': schedule.day_of_the_week,
                                "start_time": schedule.start_time.strftime("%H:%M:%S"),
                                "end_time": schedule.end_time.strftime("%H:%M:%S"),
                            } for schedule in subscription.schedules]
                    
                    used_lessons = len([0 for lesson in subscription.lessons if lesson.is_used])
                    subscription_data = {
                        "id": subscription.id,
                        "name": subscription.template.name,
                        "price": subscription.template.price,
                        'total_lessons': subscription.template.total_lessons,
                        'used_lessons': used_lessons,
                        'valid_until': datetime.strftime(subscription.valid_until, "%Y-%m-%d"),
                        'is_active': subscription.template.total_lessons > used_lessons,
                        "schedules": schedules,
                    }
                    data.append(subscription_data)
                    logger.debug(f"Added subscription data: {subscription_data}")
                    
                except Exception as e:
                    logger.error(f"Error processing subscription {subscription.id}: {e}")
                    continue
            
            response = {
                'code': 296,
                'data': {
                    "subscriptions": data,
                    "all_subscriptions": subs_data
                }
            }
            
            logger.info(f"Sending response with {len(data)} subscriptions and {len(subs_data)} templates")
            logger.debug(f"Full response: {response}")
            
            await ws.send_json(response)


    async def add_subscription_to_user(self, data: dict):
        """Добавляет подписку пользователю"""
        with Connection.session_scope() as session:
            try:
                template_id = int(data.get("template"))
            except (ValueError, TypeError):
                print('ERROR template_id is not an int type')
                return False

            user, client = self.get_client_and_user(data.get("client_id"), session)
            if not client:
                print("Client not found")
                return False
                
            template = session.get(SubscriptionTemplate, template_id)
            if not template:
                print("Template not found")
                return False

            # Проверяем баланс клиента
            if client.balance < template.price:
                print("Insufficient balance")
                return False
            
            logger.debug(f'template group schedules:{template.group.schedules if template.group else []}')
            
            # Создаем подписку без расписаний
            subscription = Subscription(
                template_id=template_id,
                client_id=client.id
            )
            session.add(subscription)
            session.flush()  # Получаем ID подписки

            # Списываем деньги
            client.balance -= template.price

            if template.group_id:
                # Это групповой абонемент
                # НЕ создаем расписания - используем расписания группы!
                await self._assign_group_lessons(
                    session, client.id, template.group_id, 
                    template.total_lessons, 
                    round(template.price / template.total_lessons, 2)
                )
            else:
                # Это индивидуальный абонемент - создаем расписания для подписки
                await self._create_individual_lessons(
                    session, subscription, client, template, data.get("schedules")
                )

            return True
    async def _assign_group_lessons(self, session: Session, client_id: int, group_id: int, 
                                lessons_count: int, price: float):
        """Привязывает клиента к групповым урокам"""
        # Находим оплаченные уроки клиента для данной группы
        payed_lessons_associations = session.query(GroupLessonPayed).filter(
            GroupLessonPayed.client_id == client_id
        ).all()
        
        payed_lessons_for_current_group = [
            association.lesson.date for association in payed_lessons_associations 
            if association.lesson.group_id == group_id
        ]
        
        last_payed_lesson_date = datetime.now().date()
        if payed_lessons_for_current_group:
            max_payed_date = sorted(payed_lessons_for_current_group)[-1]
            last_payed_lesson_date = max(max_payed_date, datetime.now().date()) + timedelta(days=1)
        
        print(f'\nlast payed lesson date : {last_payed_lesson_date}\n')
        
        available_lessons = session.query(Lesson).filter(
            Lesson.group_id == group_id,
            Lesson.is_group_template == True,
            Lesson.date >= last_payed_lesson_date
        ).limit(lessons_count).all()
        
        print(f"available_lessons BEFORE creating new: {len(available_lessons)}")
        
        # Если уроков недостаточно - создаем новые
        if len(available_lessons) < lessons_count:
            await create_group_lessons_schedule(
                session, 
                group_id=group_id, 
                last_payed_lesson_date=last_payed_lesson_date, 
                lessons_count=lessons_count
            )
            
            # ВАЖНО: flush чтобы новые уроки стали видны в базе
            session.flush()
            
            # Повторно получаем доступные уроки
            available_lessons = session.query(Lesson).filter(
                Lesson.group_id == group_id,
                Lesson.is_group_template == True,
                Lesson.date >= last_payed_lesson_date
            ).limit(lessons_count).all()
            
            print(f"available_lessons AFTER creating new: {len(available_lessons)}")
        
        # Создаем записи об оплаченных уроках
        for lesson in available_lessons:
            paid_lesson = GroupLessonPayed(
                lesson_id=lesson.id,
                client_id=client_id,
                price=price
            )
            session.add(paid_lesson)
        
    async def _create_individual_lessons(self, session: Session, subscription, client, 
                                        template, schedules_data):
            """Создает индивидуальные уроки"""
            if schedules_data:
                schedules = [SubscriptionSchedule(
                    subscription_id=subscription.id,
                    start_time=schedule_data.get("start_time"),
                    end_time=schedule_data.get("end_time"),
                    day_of_the_week=schedule_data.get("day_of_the_week")
                ) for schedule_data in schedules_data]
                session.add_all(schedules)
                session.flush()  # Добавляем flush чтобы получить ID расписаний
                schedule_list = schedules
            else:
                # ИСПРАВЛЕНИЕ: для индивидуальных подписок берем расписания из самой подписки
                schedule_list = subscription.schedules

            schedule_data = [(schedule.day_of_the_week, schedule.start_time, schedule.end_time) 
                            for schedule in schedule_list]
            
            # Проверяем что у нас есть расписания
            if not schedule_data:
                print("Warning: No schedule data available for individual lessons")
                return
            
            dates = generate_dates(info=schedule_data, count=subscription.template.total_lessons)
            
            lessons = []
            for lesson_index in range(subscription.template.total_lessons):
                lesson = Lesson(
                    price=subscription.template.price // subscription.template.total_lessons,
                    date=dates[lesson_index][0],
                    start_time=dates[lesson_index][1].strftime("%H:%M"),
                    end_time=dates[lesson_index][2].strftime("%H:%M"),
                    subscription_id=subscription.id,
                    client_id=client.id,
                    coach_id=subscription.template.coach.id,
                    is_group_template=False
                )
                lessons.append(lesson)
            session.add_all(lessons)

    async def fetch_client_lessons(self, ws: WebSocket, username: str):
        """Получает все уроки клиента включая групповые"""
        with Connection.session_scope() as session:
            user, client = self.get_client_and_user(username, session)
            if not client:
                await ws.send_json({"code": 404, "error": "Client not found"})
                return
            
            # Индивидуальные уроки
            individual_lessons = client.lessons
            
            # Групповые уроки через оплаченные записи
            paid_group_lesson_records = client.group_lessons_payed  
            paid_group_lessons = [record.lesson for record in paid_group_lesson_records]

            # Объединяем все уроки
            all_lessons = list(individual_lessons) + paid_group_lessons
            response_data = []
            
            if all_lessons:
                response_data = [{
                    "id": lesson.id,
                    "title": lesson.group.name if lesson.group else lesson.coach.name,
                    'date': datetime.strftime(lesson.date, '%Y-%m-%d'),
                    "start_time": lesson.start_time.strftime("%H:%M:%S"),
                    "end_time": lesson.end_time.strftime("%H:%M:%S"),
                    "coach_name": lesson.coach.name,
                    "price": lesson.price if lesson.price > 0 else lesson.group_lessons_payed.price,
                    "is_cancelled": lesson.is_cancelled,
                    "is_group": lesson.is_group_template
                } for lesson in all_lessons]
            
            response = {
                "code": 295,
                "data": response_data
            }
            await ws.send_json(response)

    async def update_client_data(self, data):
        """Обновляет данные клиента"""
        with Connection.session_scope() as session:
            user, client = self.get_client_and_user(data.get('client_username'), session)
            if not client:
                print("Client not found")
                return False

            # Убираем username из данных
            client_username = data.pop('client_username', None)
            new_password = data.get("password")
            
            if new_password:
                user.password = get_password_hash(new_password)
            
            for attr, attr_value in data.items():
                if attr in ["username", "email"]:
                    setattr(user, attr, attr_value)
                else:
                    setattr(client, attr, attr_value)
            
            print(f"Successfully updated user {client.id}")
            return True

    async def delete_lesson(self, lesson_id):
        """Удаляет урок и возвращает деньги клиенту"""
        with Connection.session_scope() as session:
            # lesson = session.get(Lesson, int(lesson_id))
            lesson_payed = session.query(GroupLessonPayed).filter(
                GroupLessonPayed.lesson_id == int(lesson_id)
            ).first()

            if lesson_payed:
                username = lesson_payed.client.user.username
                client = lesson_payed.client
                client.balance += lesson_payed.price
                session.flush()
                session.delete(lesson_payed.lesson)
                print(username)
                return username
            lesson_payed = session.get(Lesson, int(lesson_id))
            session.delete(lesson_payed)
            session.commit()
            logger.info(lesson_payed)
            return None


# Создаем экземпляр менеджера
client_manager = ClientManager()

async def create_group_lessons_schedule(session, group_id: int, lessons_count: int, last_payed_lesson_date: datetime = None):
    """Создает шаблоны групповых уроков для группы"""
    logger.debug(f'creating group template lessons {lessons_count}')
    
    group = session.get(Group, group_id)
    logger.debug(f"group name of created lessons {group.name}")
    if not group:
        return False
        
    from utils import generate_dates

    schedule_data = [
        (schedule.day_of_the_week, schedule.start_time, schedule.end_time) 
        for schedule in group.schedules
    ]
    logger.debug(f"schedules of group template lessons {group.__dict__}")
    print(f"DEBUG: group.schedules = {[(s.day_of_the_week, s.start_time, s.end_time) for s in group.schedules]}")
    print(f"DEBUG: schedule_data = {schedule_data}")
    
    # Определяем стартовую дату
    start_date = last_payed_lesson_date or datetime.now().date()
    
    # Генерируем даты для уроков
    dates = generate_dates(info=schedule_data, count=lessons_count, current_date=start_date)
    
    # Создаем шаблоны групповых уроков (без привязки к клиенту)
    template_lessons = []
    for lesson_date, start_time, end_time in dates:
        lesson = Lesson(
            price=0,  # Цена будет определяться абонементом
            date=lesson_date,
            start_time=start_time.strftime("%H:%M") if hasattr(start_time, 'strftime') else start_time,
            end_time=end_time.strftime("%H:%M") if hasattr(end_time, 'strftime') else end_time,
            coach_id=group.coach_id,
            group_id=group_id,
            client_id=None,  # Нет привязки к клиенту - это шаблон
            is_group_template=True  # Помечаем как шаблон
        )
        template_lessons.append(lesson)
    
    session.add_all(template_lessons)
    print(f"Added {len(template_lessons)} template lessons to session")

    return True
@client_router.get('/info/')
def client_info(request: Request):
    return templates.TemplateResponse(
        request=request, name='client.html'
    )