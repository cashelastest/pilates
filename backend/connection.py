from sqlalchemy.engine import create_engine
from sqlalchemy.orm import Session
from models import Base
from contextlib import contextmanager
import functools
from fastapi import HTTPException
import asyncio
from dotenv import load_dotenv
import os
load_dotenv()

def get_db():
    db = Connection.get_session()
    try:
        yield db
    finally:
        db.close()
class Connection:
    username = os.getenv('DATABASE_USERNAME')
    password = os.getenv("DATABASE_PASSWORD")
    host = os.getenv('HOST')
    port= os.getenv("PORT")
    database_name = os.getenv("DATABASE_NAME")
    url = f"mysql+pymysql://{username}:{password}@{host}:{port}/{database_name}"
    engine = create_engine(
        url,
        pool_size=20,
        max_overflow=30,  
        pool_timeout=60,      
        pool_recycle=3600,    
        pool_pre_ping=True     
    )
    
    @staticmethod
    def get_session() -> Session:
        session = Session(bind=Connection.engine)
        return session
    
    @staticmethod
    def create_all_models():
        Base.metadata.create_all(Connection.engine)

    @staticmethod
    @contextmanager
    def session_scope():

        session = Connection.get_session()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            print(f"Error in database: {e}")
            raise
        finally:
            session.close()
def db_session(func):
    @functools.wraps(func)
    async def async_wrapper(*args, **kwargs):
        with Connection.session_scope() as session:
            kwargs['session'] = session
            return await func(*args, **kwargs)
            
    @functools.wraps(func)
    def sync_wrapper(*args, **kwargs):
        with Connection.session_scope() as session:
            kwargs['session'] = session
            return func(*args, **kwargs)
    

    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    return sync_wrapper
Connection.create_all_models()