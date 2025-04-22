from connection import  Connection
from sqlalchemy.orm import Session
from models import Lesson, Client, Group,Coach,Subscription
from datetime import datetime,date, timedelta
import time
def get_all_lessons():
    session = Connection.get_session()
    lessons = list(session.query(Lesson).all())
    events = []
    for lesson in lessons:
        if lesson.is_cancelled:
            status = 'cancelled'
            class_name= 'cancelled_lesson'
        elif lesson.date <date.today():
            status = 'completed'
            class_name = 'success_lesson'
        else:
            status = 'scheduled'
            class_name = 'future_lesson'
        if lesson.client:
            name = lesson.client.name
        else:
            name = lesson.group.name
        events.append(
            {
                'id':lesson.id,
                'title':name,
                "start":f'{lesson.date}T{lesson.start_time}',
                "end":f'{lesson.date}T{lesson.end_time}',
                "extendedProps":{
                    'price':lesson.price,
                    'trainer':lesson.coach.name,
                    'status': status
                },
                'className':class_name,
            }
        )
    return events

def change_lesson_by_id(id: int, session: Session ,**kwargs):
    session = Connection.get_session()
    print(id)
    lesson = session.get(Lesson, id)
    for key, value in kwargs.items():
        setattr(lesson, key,value) 
    session.commit()


def get_items_list(session,*models):
    results =[]
    for model in models:
        items = session.query(model.id, model.name).all()
        result = [{"id": item.id, "name": item.name} for item in items]
        results.append(result)
    return results

def check_is_used_lesson(lesson:Lesson)-> bool:
    if lesson.is_cancelled:
        return False
    if lesson.date <date.today():
        return False
    if lesson.date ==date.today() and lesson.end_time < datetime.now().time():
        return False
    return True



def generate_dates(info, count):
    """
    Generate dates based on specified days of the week.
    
    Args:
        info: List of tuples where each tuple contains:
              (day_of_week, start_time, end_time)
              day_of_week is integer (0=Sunday, 1=Monday, ..., 6=Saturday)
        count: Number of dates to generate
    
    Returns:
        List of tuples (date_string, start_time, end_time)
    """
    if not info or count <= 0:
        return []
    
    result = []
    current_date = datetime.now()
    
    # Extract days of week from info
    days_of_week = [item[0] for item in info]
    
    while len(result) < count:
        # Python's weekday: Monday=0, Sunday=6
        # Our convention: Sunday=0, Monday=1, ..., Saturday=6
        current_day_of_week = (current_date.weekday() + 1) % 7
        
        # Check if current day is in our specified days
        for item in info:
            if current_day_of_week == item[0]:
                result.append((current_date.strftime('%Y-%m-%d'), item[1], item[2]))
                if len(result) >= count:
                    break
        
        # Move to the next day
        current_date += timedelta(days=1)
    
    return result