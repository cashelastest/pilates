from sqlalchemy.engine import create_engine
from sqlalchemy.orm import Session
from models import Base
class Connection:

    url = "mysql+pymysql://root:Sobaka1@localhost:3306/pilates"

    engine = create_engine(url)
    def get_session() -> Session:

        session = Session(bind = Connection.engine)
        return session
    def create_all_models():
        Base.metadata.create_all(Connection.engine)

Connection.create_all_models()