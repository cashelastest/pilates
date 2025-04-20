from fastapi import Request, FastAPI
from routers.dashboard import dashboard_router
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.include_router(dashboard_router)
app.mount('/static', StaticFiles(directory='static'),name = 'static')

@app.get("/")
def home()->set:
    return {'home page'}

