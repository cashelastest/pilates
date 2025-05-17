from fastapi import APIRouter, Request,Depends
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates
from routers.client import Manager
from models import Coach, Client, Subscription, Group
from pathlib import Path
import numpy as np
from utils import sort_by_monthes
coaches_router = APIRouter(prefix = "/coaches", tags= ["coaches"])

templates = Jinja2Templates(directory='templates')
MEDIA_PATH = Path("media/")
print(MEDIA_PATH)
class CoachesManager(Manager):
    def get_cards(self):
        coaches = self.session.query(Coach).all()
        cards = [{
            "id":coach.id,
            "name":coach.name,
            "position":coach.position,
            "description":coach.description,
            "status":coach.status,
            "image":coach.image,
            "rate":np.mean([comment.rate for comment in coach.comments]),
            "clients_amount":len(coach.clients),
            "groups_amount":len(coach.groups)
        } for coach in coaches]
        return cards
    

    def get_trainer_details(self, trainer_id):
        coach = self.session.get(Coach, trainer_id)


coaches_manager = CoachesManager()
@coaches_router.get('/')
def get_clients(request:Request):
    cards = coaches_manager.get_cards()

    return templates.TemplateResponse(
        'coaches.html', {"request":request, 'cards':cards}
    )


# Мок-данные для API эндпоинтов
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import os
import shutil
from uuid import uuid4
import json



# Мок база данных для тренеров
mock_coaches = [
    {
        "id": 1,
        "name": "Анна Ковальчук",
        "position": "Старший тренер з пілатесу",
        "description": "Сертифікований інструктор з пілатесу з 8-річним досвідом. Спеціалізується на реабілітаційному пілатесі та роботі з клієнтами, що мають проблеми зі спиною.",
        "status": "active",
        "specialization": "Реабілітаційний пілатес, Групові заняття",
        "experience": "8 років",
        "photo": "coach1.png",
        "clients_amount": 24,
        "groups_amount": 3,
        "rate": 4.9
    },
    {
        "id": 2,
        "name": "Олександр Петренко",
        "position": "Інструктор з пілатесу",
        "description": "Професійний спортсмен з досвідом викладання пілатесу 5 років. Спеціалізується на силовому пілатесі та підготовці спортсменів.",
        "status": "vacation",
        "specialization": "Силовий пілатес, Спортивна підготовка",
        "experience": "5 років",
        "photo": "coach2.png",
        "clients_amount": 18,
        "groups_amount": 2,
        "rate": 4.7
    },
    {
        "id": 3,
        "name": "Марія Іваненко",
        "position": "Інструктор з пілатесу для вагітних",
        "description": "Сертифікований інструктор з пілатесу для вагітних та відновлення після пологів. Має медичну освіту та 6 років досвіду роботи з жінками на різних етапах вагітності.",
        "status": "active",
        "specialization": "Пілатес для вагітних, Пренатальна підготовка",
        "experience": "6 років",
        "photo": "coach1.png",
        "clients_amount": 15,
        "groups_amount": 4,
        "rate": 4.8
    }
]

# # Мок-данные для сертификатов
# mock_certificates = {
#     1: [
#         {"id": 1, "name": "Pilates Foundation Course", "year": 2018},
#         {"id": 2, "name": "Advanced Pilates Certification", "year": 2020},
#         {"id": 3, "name": "Rehabilitation Pilates Certification", "year": 2021}
#     ],
#     2: [
#         {"id": 4, "name": "Sports Pilates Certification", "year": 2019},
#         {"id": 5, "name": "Power Pilates", "year": 2021}
#     ],
#     3: [
#         {"id": 6, "name": "Prenatal Pilates Certification", "year": 2018},
#         {"id": 7, "name": "Postnatal Recovery Specialist", "year": 2019}
#     ]
# }

# Мок-данные для расписания
mock_schedules = {
    1: [
        {"day": "Понеділок", "time": "9:00 - 10:00", "type": "group", "name": "Ранкова група"},
        {"day": "Понеділок", "time": "11:00 - 12:00", "type": "client", "name": "Олена К."},
        {"day": "Середа", "time": "16:00 - 17:00", "type": "group", "name": "Вечірня група"},
        {"day": "П'ятниця", "time": "10:00 - 11:00", "type": "client", "name": "Іван М."}
    ],
    2: [
        {"day": "Вівторок", "time": "10:00 - 11:00", "type": "group", "name": "Силовий пілатес"},
        {"day": "Четвер", "time": "18:00 - 19:00", "type": "group", "name": "Спортивна група"},
        {"day": "Субота", "time": "12:00 - 13:00", "type": "client", "name": "Андрій В."}
    ],
    3: [
        {"day": "Понеділок", "time": "14:00 - 15:00", "type": "group", "name": "Пілатес для вагітних"},
        {"day": "Середа", "time": "14:00 - 15:00", "type": "group", "name": "Пілатес для вагітних"},
        {"day": "Четвер", "time": "10:00 - 11:00", "type": "client", "name": "Марія П."},
        {"day": "П'ятниця", "time": "14:00 - 15:00", "type": "group", "name": "Відновлення після пологів"}
    ]
}

# Мок-данные для статистики
mock_statistics = {
    1: {
        "clients_total": 24,
        "sessions_month": 45,
        "rating": 4.9,
        "active_groups": 3,
        "sessions_history": [
            {"month": "Гру", "count": 38},
            {"month": "Січ", "count": 42},
            {"month": "Лют", "count": 40},
            {"month": "Бер", "count": 45},
            {"month": "Кві", "count": 48},
            {"month": "Тра", "count": 52}
        ],
        "sessions_types": {
            "Групові": 65,
            "Індивідуальні": 35
        }
    },
    2: {
        "clients_total": 18,
        "sessions_month": 32,
        "rating": 4.7,
        "active_groups": 2,
        "sessions_history": [
            {"month": "Гру", "count": 30},
            {"month": "Січ", "count": 34},
            {"month": "Лют", "count": 36},
            {"month": "Бер", "count": 32},
            {"month": "Кві", "count": 30},
            {"month": "Тра", "count": 0}  # Тренер в отпуске
        ],
        "sessions_types": {
            "Групові": 55,
            "Індивідуальні": 45
        }
    },
    3: {
        "clients_total": 15,
        "sessions_month": 38,
        "rating": 4.8,
        "active_groups": 4,
        "sessions_history": [
            {"month": "Гру", "count": 32},
            {"month": "Січ", "count": 35},
            {"month": "Лют", "count": 36},
            {"month": "Бер", "count": 38},
            {"month": "Кві", "count": 40},
            {"month": "Тра", "count": 38}
        ],
        "sessions_types": {
            "Групові": 80,
            "Індивідуальні": 20
        }
    }
}

# Мок-данные для комментариев
mock_comments = {
    1: [
        {
            "id": 1,
            "author": "Олена К.",
            "text": "Чудовий тренер! Дуже уважно ставиться до кожного клієнта і допомагає освоїти вправи правильно.",
            "rating": 5,
            "date": "2023-05-01T12:00:00"
        },
        {
            "id": 2,
            "author": "Іван М.",
            "text": "Професійний підхід і відмінне знання своєї справи. Рекомендую всім!",
            "rating": 5,
            "date": "2023-04-15T14:30:00"
        },
        {
            "id": 3,
            "author": "Марія П.",
            "text": "Займаюся вже півроку і бачу відмінний результат. Дякую за професіоналізм!",
            "rating": 5,
            "date": "2023-03-22T10:15:00"
        },
        {
            "id": 4,
            "author": "Андрій В.",
            "text": "Хороший тренер, але іноді запізнюється на заняття.",
            "rating": 4,
            "date": "2023-03-10T18:45:00"
        },
        {
            "id": 5,
            "author": "Ольга С.",
            "text": "Чудова атмосфера на заняттях і індивідуальний підхід до кожного.",
            "rating": 5,
            "date": "2023-02-28T11:20:00"
        },
        {
            "id": 6,
            "author": "Віктор Д.",
            "text": "Допомогла мені відновитися після травми спини. Дуже вдячний!",
            "rating": 5,
            "date": "2023-02-15T09:30:00"
        },
        {
            "id": 7,
            "author": "Наталія Ж.",
            "text": "Відвідую групові заняття вже рік. Завжди з нетерпінням чекаю наступного тренування!",
            "rating": 5,
            "date": "2023-01-20T17:10:00"
        },
        {
            "id": 8,
            "author": "Сергій М.",
            "text": "Покращив свою фізичну форму завдяки заняттям. Рекомендую!",
            "rating": 5,
            "date": "2023-01-05T14:25:00"
        }
    ],
    2: [
        {
            "id": 9,
            "author": "Андрій В.",
            "text": "Відмінний тренер для тих, хто хоче досягти серйозних результатів. Інтенсивні тренування!",
            "rating": 5,
            "date": "2023-04-20T15:40:00"
        },
        {
            "id": 10,
            "author": "Михайло К.",
            "text": "Професійний підхід до тренувань. Допоміг мені підготуватися до змагань.",
            "rating": 5,
            "date": "2023-04-05T11:30:00"
        },
        {
            "id": 11,
            "author": "Ірина Л.",
            "text": "Дуже інтенсивні тренування, але результат того вартий!",
            "rating": 4,
            "date": "2023-03-15T18:20:00"
        },
        {
            "id": 12,
            "author": "Олег П.",
            "text": "Хороший тренер, але іноді занадто вимогливий.",
            "rating": 4,
            "date": "2023-02-25T09:15:00"
        }
    ],
    3: [
        {
            "id": 13,
            "author": "Марія С.",
            "text": "Чудовий тренер для вагітних! Допомогла мені залишатися активною протягом усієї вагітності.",
            "rating": 5,
            "date": "2023-05-05T10:30:00"
        },
        {
            "id": 14,
            "author": "Юлія В.",
            "text": "Заняття дуже допомогли мені відновитися після пологів. Дякую!",
            "rating": 5,
            "date": "2023-04-10T14:15:00"
        },
        {
            "id": 15,
            "author": "Олена М.",
            "text": "Професійний підхід і чудове розуміння особливостей тренувань для вагітних.",
            "rating": 5,
            "date": "2023-03-20T11:00:00"
        },
        {
            "id": 16,
            "author": "Анна К.",
            "text": "Завдяки заняттям з Марією моя вагітність проходить легше.",
            "rating": 4,
            "date": "2023-02-15T16:45:00"
        }
    ]
}


@coaches_router.get("/api/trainers/{trainer_id}/details")
async def get_trainer_details(trainer_id: int):
    days_of_week = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"]

    trainer_id = int(trainer_id)
    session = coaches_manager.session
    coach = session.get(Coach, trainer_id)
    # schedules = []
    # for lesson in coach.lessons:
    #     schedule = {

    #     }
    #     schedules.append()
    coach_subs=[]
    for template in coach.subscriptions_templates:
        coach_subs.extend(session.query(Subscription).filter(Subscription.template_id == template.id).all())
    schedules =[]
    for group in coach.groups:
        schedules.extend(group.schedules)
    result = {
        'id':coach.id,
        "name":coach.name,
        "position":coach.position,
        "description":coach.description,
        "status":coach.status,
        "photo":f"/media/coaches/{coach.image}",
        "clients_amount":len(coach.clients),
        'groups_amount':len(coach.groups),
        "rate":np.mean([comment.rate  for comment in coach.comments]),
        "schedule": [{
            "day":days_of_week[schedule.day_of_the_week],
            "time":f"{schedule.start_time.strftime("%H:%M")} - {schedule.end_time.strftime("%H:%M")}",
            "type": "Група",
            "name":schedule.group.name
        } for schedule in schedules ]
    }
    print(result)
    return result

# Получение статистики тренера
@coaches_router.get("/api/trainers/{trainer_id}/statistics")
async def get_trainer_statistics(trainer_id: int):

    trainer_id = int(trainer_id)
    session = coaches_manager.session
    coach = session.get(Coach, trainer_id)
    active_groups = session.query(Group).filter((Group.coach_id == coach.id) and (Group.status == "Active")).all()
    sessions_history= sort_by_monthes(coach.lessons)
    group_lessons =  len([0 for lesson in coach.lessons if lesson.group_id])
    statistics = {
        "clients_total":len(coach.clients),
        'sessions_month': sum([month_and_count['count'] for month_and_count in sessions_history]),
        'rating': np.mean([comment.rate for comment in coach.comments]), 
        'active_groups': len(active_groups),
        "sessions_history":sort_by_monthes(coach.lessons),
        # "sessions_types": {'Групові':group_lessons, 'Індивідуальні':len(coach.lessons) - group_lessons}
    }
    return statistics
#~ COMMENTS 
# Получение комментариев о тренере
# @coaches_router.get("/api/trainers/{trainer_id}/comments")
# async def get_trainer_comments(trainer_id: int, page: int = 1):
#     # Преобразуем id в int
#     trainer_id = int(trainer_id)
    
#     # Проверяем наличие тренера
#     coach = next((c for c in mock_coaches if c["id"] == trainer_id), None)
#     if not coach:
#         raise HTTPException(status_code=404, detail="Тренер не знайдений")
    
#     # Получаем комментарии для тренера
#     all_comments = mock_comments.get(trainer_id, [])
    
#     # Количество комментариев на странице
#     page_size = 5
    
#     # Вычисляем индексы для пагинации
#     start_idx = (page - 1) * page_size
#     end_idx = start_idx + page_size
    
#     # Получаем комментарии для текущей страницы
#     page_comments = all_comments[start_idx:end_idx]
    
#     # Вычисляем средний рейтинг
#     avg_rating = sum(comment["rating"] for comment in all_comments) / len(all_comments) if all_comments else 0
    
#     return {
#         "total_comments": len(all_comments),
#         "avg_rating": avg_rating,
#         "comments": page_comments,
#         "has_more": end_idx < len(all_comments)
#     }

# Обновление информации о тренере
@coaches_router.post("/api/trainers/{trainer_id}/update")
async def update_trainer_info(
    trainer_id: int,
    name: str = Form(...),
    position: str = Form(...),
    description: str = Form(...),
    status: str = Form(...),
    photo: Optional[UploadFile] = File(None)
):
    print(name, photo.filename)
    print(type(coaches_manager.session))
    print(coaches_manager.session.info)
    trainer_id = int(trainer_id)

    coach =coaches_manager.session.get(Coach, trainer_id)
    if coach is None:
        raise HTTPException(status_code=404, detail="Тренер не знайдений")
    coach.name = name
    coach.position = position
    coach.description = description
    coach.status = status

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    photo_filename = f"{timestamp}_{photo.filename}" if photo else None
    if photo and photo.filename:
        os.makedirs("media/coaches", exist_ok=True)
        relative_photo_path = MEDIA_PATH / f"coaches/{photo_filename}"
        with open(relative_photo_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
            coach.image = relative_photo_path
    coaches_manager.session.commit()
    print('succesfuly changed!')
    return {'message': "Succesfully coach updated"}


@coaches_router.post("/api/trainers/create/")
async def create_coach(
    name: str = Form(...),
    position: str = Form(...),
    description: str = Form(...),
    status: str = Form(...),
    photo: Optional[UploadFile] = File(None),
):

    coach_dir = MEDIA_PATH / "coaches"
    coach_dir.mkdir(parents=True, exist_ok=True)

    # Generate a unique filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    photo_filename = f"{timestamp}_{photo.filename}" if photo else None

    if photo and photo_filename:
        photo_path = coach_dir / photo_filename


        with open(photo_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        relative_photo_path = f"coaches/{photo_filename}"
    else:
        relative_photo_path = None


    try:
        # Create new coach object (adjust according to your database model)
        new_coach = Coach(
            name=name,
            position=position,
            description=description,
            status=status,
            image=relative_photo_path,

        )
        
        # Add to database
        coaches_manager.session.add(new_coach)
        coaches_manager.session.commit()
        coaches_manager.session.refresh(new_coach)
        
        # Prepare response data
        coach_data = {
            "id": new_coach.id,
            "name": new_coach.name,
            "position": new_coach.position,
            "description": new_coach.description,
            "status": new_coach.status,
            "clients_amount": 0,  # Default values for new coach
            "groups_amount": 0,
            "rate": "0.0",
            "photo": f"/media/coaches/{new_coach.image}" if new_coach.image else None
        }
        
        return JSONResponse(content={
            "success": True,
            "message": "Тренера успішно додано",
            "trainer": coach_data
        })
        
    except Exception as e:
        # Log the error
        print(f"Error creating coach: {e}")
        
        # Return error response
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Помилка при створенні тренера"
            }
        )