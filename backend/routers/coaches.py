from fastapi import APIRouter, Request,Depends, Response
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates
from routers.client import Manager
from models import Coach, Client, Subscription, Group,User
from pathlib import Path
import numpy as np
from utils import sort_by_monthes
from auth.auth import get_current_user_from_cookie
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
def get_clients(request:Request, user:User = Depends(get_current_user_from_cookie)):
    cards = coaches_manager.get_cards()
    if user.user_type != 'user':
        return templates.TemplateResponse(
            'coaches.html', {"request":request, 'cards':cards}
        )
    return templates.TemplateResponse(
        request=request, name= 'forbidden.html'
    )


# Мок-данные для API эндпоинтов
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Optional
from datetime import datetime, timedelta
import os
import shutil





@coaches_router.get("/api/trainers/{trainer_id}/details")
async def get_trainer_details(trainer_id: int):
    days_of_week = ["Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота", "Неділя"]


    trainer_id = int(trainer_id)
    session = coaches_manager.session
    coach = session.get(Coach, trainer_id)

    coach_subs=[]
    for template in coach.subscriptions_templates:
        coach_subs.extend(session.query(Subscription).filter(Subscription.template_id == template.id).all())
    schedules =[]
    for sub in coach_subs:
        schedules.extend(sub.schedules)
    schedules_info = []
    for schedule in schedules:
        schedule_type = "Група" if schedule.group else "Індивідуальний"
        schedule_name = schedule.group.name if schedule.group else "Клієнт"
        schedules_info.append({
                "day":days_of_week[schedule.day_of_the_week],
                "time":f"{schedule.start_time.strftime("%H:%M")} - {schedule.end_time.strftime("%H:%M")}",
                "type": schedule_type,
                "name":schedule_name
            })
    result = {
            'id':coach.id,
            "name":coach.name,
            "position":coach.position,
            "description":coach.description,
            "status":coach.status,
            "photo":f"/media/coaches/{coach.image}",
            "clients_amount":len(coach.clients),
            'groups_amount':len(coach.groups),
            "schedule": schedules_info,
    }

    return result

# Получение статистики тренера
@coaches_router.get("/api/trainers/{trainer_id}/statistics")
async def get_trainer_statistics(trainer_id: int):

    trainer_id = int(trainer_id)
    session = coaches_manager.session
    coach = session.get(Coach, trainer_id)
    active_groups = session.query(Group).filter((Group.coach_id == coach.id) and (Group.status == "Active")).all()
    
    sessions_history= sort_by_monthes(coach.lessons)

    statistics = {
        "clients_total":len(coach.clients),
        'sessions_month': sum([month_and_count['count'] for month_and_count in sessions_history]),
        # 'rating': np.mean([comment.rate for comment in coach.comments]), 
        'active_groups': len(active_groups),
        "sessions_history":sessions_history,
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
    statuses = {
        "vacation":"Відпустка",
        "active":"Активний",
        "sick":"Хворіє",
        "inactive" : "Неактивний"
                }
    trainer_id = int(trainer_id)

    coach =coaches_manager.session.get(Coach, trainer_id)
    if coach is None:
        raise HTTPException(status_code=404, detail="Тренер не знайдений")
    coach.name = name
    coach.position = position
    coach.description = description
    if status:
        coach.status = statuses[status] 

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    photo_filename = f"{timestamp}_{photo.filename}" if photo else None
    if photo and photo.filename:
        os.makedirs("media/coaches", exist_ok=True)
        relative_photo_path = MEDIA_PATH / f"coaches/{photo_filename}"
        with open(relative_photo_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
            coach.image = photo_filename
    coaches_manager.session.commit()
    print('succesfuly changed!')
    return {"name": coach.name, "position":coach.position, "description":coach.description, "status":coach.status, "photo":"../media/coaches/"+coach.image}


@coaches_router.post("/api/trainers/create/")
async def create_coach(
    name: str = Form(...),
    position: str = Form(...),
    description: str = Form(...),
    status: str = Form(...),
    photo: Optional[UploadFile] = File(None),
):
    statuses = {
        "vacation":"Відпустка",
        "active":"Активний",
        "sick":"Хворіє",
        "inactive" : "Неактивний"
                }
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
            status=statuses[status],
            image=photo_filename,

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
            "photo": f"/media/{new_coach.image}" if new_coach.image else None
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