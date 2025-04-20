from sqlalchemy import Column, String, Integer, Boolean, Float, ForeignKey, Time, Date
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import as_declarative


@as_declarative()
class Base:
    id = Column(Integer, autoincrement=True, primary_key=True)


class Position(Base):
    __tablename__ = 'positions'
    position_name =Column(String(60))


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


class Coach(Base):
    __tablename__ = 'coaches'
    name = Column(String(60))
    position = Column(Integer,ForeignKey('positions.id'))
    description = Column(String(300))
    schedules = relationship("CoachSchedule", back_populates='coach')
    clients = relationship("Client", back_populates='coach')
    comments = relationship('Comment', back_populates='coach')
    groups = relationship('Group', back_populates="coach")
    lessons = relationship('Lesson', back_populates='coach')


class SubscriptionSchedule(Base):
    __tablename__ = 'subscriptionschedule'
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"))
    subscription = relationship('Subscription', back_populates='schedules')
    date = Column(Date)
    start_time = Column(Time)
    end_time = Column(Time)
    day_of_the_week = Column(Integer, nullable=True) # 0-6 Monday-Sunday


class Lesson(Base):
    __tablename__ = 'lessons'
    price = Column(Float, nullable=False)
    date = Column(Date)
    start_time = Column(Time)
    end_time = Column(Time)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"),nullable=True)
    subscription = relationship('Subscription', back_populates='lessons')
    is_cancelled = Column(Boolean, default=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    coach_id = Column(Integer, ForeignKey("coaches.id"))
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    group = relationship('Group', back_populates= 'lessons')
    client = relationship('Client', back_populates='lessons')
    coach = relationship("Coach", back_populates='lessons')





class Subscription(Base):
    __tablename__ = 'subscriptions'
    name = Column(String(60))
    price = Column(Float)
    lessons = relationship('Lesson', back_populates='subscription')
    schedules = relationship('SubscriptionSchedule', back_populates='subscription')


class Client(Base):
    __tablename__ = 'clients'
    username = Column(String(60))
    name = Column(String(60))
    email = Column(String(60))
    password = Column(String(20))
    status = Column(Boolean)
    date_of_birth = Column(Date)
    sex = Column(Boolean) #0 male, 1 woman
    description = Column(String(300))
    joined = Column(Date)
    coach_id = Column(Integer, ForeignKey("coaches.id"))
    group_id = Column(Integer, ForeignKey("groups.id"))
    group = relationship("Group", back_populates= 'clients')
    coach = relationship("Coach", back_populates='clients')
    comments = relationship('Comment', back_populates='client')
    lessons = relationship('Lesson', back_populates='client')

class Group(Base):
    __tablename__ ='groups'
    name = Column(String(60))
    clients = relationship('Client', back_populates='group')
    coach_id = Column(Integer, ForeignKey("coaches.id"))
    coach = relationship("Coach", back_populates='groups')

    lessons = relationship('Lesson', back_populates='group')

class Comment(Base):
    __tablename__ = 'comments'
    coach_id = Column(Integer, ForeignKey('coaches.id'))
    client_id = Column(Integer,  ForeignKey('clients.id'))
    comment_text = Column(String(300))
    rate = Column(Integer) # from 1 to 10
    coach = relationship('Coach', back_populates='comments')
    client = relationship("Client", back_populates='comments')

