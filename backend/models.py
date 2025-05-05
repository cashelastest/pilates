from sqlalchemy import Column, String, Integer, Boolean, Float, ForeignKey, Time, Date, event
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import as_declarative
from sqlalchemy.orm import Session
from datetime import datetime

@as_declarative()
class Base:
    id = Column(Integer, autoincrement=True, primary_key=True)


class Position(Base):
    __tablename__ = 'positions'
    position_name =Column(String(60))


class ClientGroupAssociation(Base):
    __tablename__ = 'client_group_association'
    
    client_id = Column(Integer, ForeignKey("clients.id"), primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), primary_key=True)    
    client = relationship('Client', back_populates='group_associations')
    group = relationship("Group", back_populates='client_associations')

class CoachSchedule(Base):
    __tablename__ = 'coach_schedules'
    coach_id = Column(Integer, ForeignKey("coaches.id"))
    coach = relationship("Coach", back_populates='schedules')
    date = Column(Date)
    start_time = Column(Time)
    end_time = Column(Time)
    day_of_the_week = Column(Integer, nullable=True)
    is_sick = Column(Boolean, default=False)
    is_vacation = Column(Boolean, default = False)


class SubscriptionSchedule(Base):
    __tablename__ = 'subscriptionschedule'
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"))
    subscription = relationship('Subscription', back_populates='schedules')
    start_time = Column(Time)
    end_time = Column(Time)
    day_of_the_week = Column(Integer, nullable=True) # 0-6 Monday-Sunday


class Coach(Base):
    __tablename__ = 'coaches'
    name = Column(String(60))
    position = Column(Integer, ForeignKey('positions.id'))
    description = Column(String(300))
    schedules = relationship("CoachSchedule", back_populates='coach')
    clients = relationship("Client", back_populates='coach')
    comments = relationship('Comment', back_populates='coach')
    groups = relationship('Group', back_populates="coach")
    lessons = relationship('Lesson', back_populates='coach')
    subscriptions_templates = relationship("SubscriptionTemplate", back_populates="coach")


class Lesson(Base):
    __tablename__ = 'lessons'
    price = Column(Float, nullable=False)
    date = Column(Date)
    start_time = Column(Time)
    end_time = Column(Time)
    is_used = Column(Boolean,default=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)
    subscription = relationship('Subscription', back_populates='lessons')
    is_cancelled = Column(Boolean, default=False)
    client_id = Column(Integer, ForeignKey("clients.id"))
    coach_id = Column(Integer, ForeignKey("coaches.id"))
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    group = relationship('Group', back_populates='lessons')
    client = relationship('Client', back_populates='lessons')
    coach = relationship("Coach", back_populates='lessons')

class SubscriptionTemplate(Base):
    __tablename__ = 'subscription_templates'
    name = Column(String(60))
    price = Column(Float)
    description = Column(String(800))
    total_lessons = Column(Integer, default=4)
    valid_until = Column(Date, default=datetime.now()) #~ here we say in days 
    coach_id = Column(Integer, ForeignKey("coaches.id"))
    coach =relationship("Coach", back_populates="subscriptions_templates")
    subscriptions = relationship('Subscription', back_populates="template")


class Subscription(Base):
    __tablename__ = 'subscriptions'
    is_active = Column(Boolean, default=True)
    template_id = Column(Integer, ForeignKey("subscription_templates.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))
    template = relationship('SubscriptionTemplate', back_populates="subscriptions")
    client = relationship('Client', back_populates='subscriptions')
    lessons = relationship('Lesson', back_populates='subscription')
    schedules = relationship('SubscriptionSchedule', back_populates='subscription')


class Client(Base):
    __tablename__ = 'clients'    
    username = Column(String(60))
    name = Column(String(60))
    email = Column(String(60))
    phone = Column(String(30))
    password = Column(String(20))
    status = Column(Boolean)
    date_of_birth = Column(Date)
    balance = Column(Float, default=5000.0)
    sex = Column(Boolean) #0 male, 1 woman
    description = Column(String(300))
    joined = Column(Date)
    coach_id = Column(Integer, ForeignKey("coaches.id"))
    subscriptions = relationship('Subscription', back_populates='client')
    coach = relationship("Coach", back_populates='clients')
    comments = relationship('Comment', back_populates='client')
    lessons = relationship('Lesson', back_populates='client')
    group_associations = relationship('ClientGroupAssociation', back_populates="client")
    groups = relationship("Group", secondary="client_group_association", viewonly=True)


class Group(Base):
    __tablename__ = 'groups'
    name = Column(String(60))
    description = Column(String(900), nullable=True)
    status = Column(Boolean, default=True)
    coach_id = Column(Integer, ForeignKey("coaches.id"))
    coach = relationship("Coach", back_populates='groups')
    client_associations = relationship('ClientGroupAssociation', back_populates="group")
    lessons = relationship('Lesson', back_populates='group')
    clients = relationship('Client', secondary="client_group_association", viewonly=True)


class Comment(Base):
    __tablename__ = 'comments'
    coach_id = Column(Integer, ForeignKey('coaches.id'))
    client_id = Column(Integer, ForeignKey('clients.id'))
    # Исправлена ссылка на группу
    group_id = Column(Integer, ForeignKey("groups.id"))
    comment_text = Column(String(300))
    rate = Column(Integer) # from 1 to 10
    coach = relationship('Coach', back_populates='comments')
    client = relationship("Client", back_populates='comments')


@event.listens_for(Lesson, 'before_insert')
def chack_balance(mapper, connection, lesson):
    session = Session(bind=connection)
    client = session.query(Client).get(lesson.client_id)
    if client and client.balance <lesson.price:
        raise Exception("Not enough money!")
    client.balance -= lesson.price
    session.commit()


@event.listens_for(Subscription, "before_insert")
def check_balance_for_sub(mapper,connection, subscription):
    session = Session(bind= connection)
    client = session.get(Client,subscription.client_id)
    template = session.get(SubscriptionTemplate,subscription.template_id)
    if not client:
        raise Exception(f"Client with id {subscription.client_id} does not exist in db")
    if not template:
        raise Exception(f'Subscription template with id {subscription.template_id} does not exist in db')
    if client.balance < template.price:
        raise Exception("Not enough money!")
    client.balance -= template.price
    session.commit()