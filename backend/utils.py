from connection import  Connection
from sqlalchemy.orm import Session
from models import Lesson, Client, Group,Coach,Subscription
from datetime import datetime,date
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
        events.append(
            {
                'id':lesson.id,
                'title':lesson.client.name,
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

def get_client_and_group_names(session: Session)-> list:
    """_summary_

    Args:
        session (Session): _description_

    Returns:
        list: list of list[Client] and list[Group]
    """
    clients = session.query(Client.id, Client.name).all()
    clients_list = [{'id':client.id, "name":client.name } for client in clients]
    groups = session.query(Group.id, Group.name).all()
    groups_list =  [{'id':group.id, "name":group.name} for group in groups]
    coaches = session.query(Coach.id, Coach.name).all()
    coaches_list = [{"id":coach.id,"name":coach.name} for coach in coaches]
    subscriptions = session.query(Subscription.id, Subscription.name).all()
    subscriptions_list = [{"id":subscription.id,"name":subscription.name} for subscription in subscriptions]
    return [coaches_list,groups_list,clients_list, subscriptions_list]