from fastapi import Request, FastAPI
from routers.dashboard import dashboard_router
from routers.client import client_router
from routers.socket import socket
from fastapi.staticfiles import StaticFiles
from routers.group import group_router
app = FastAPI()

app.include_router(dashboard_router)
app.include_router(client_router)
app.include_router(group_router)
app.include_router(socket)
app.mount('/static', StaticFiles(directory='static'),name = 'static')

@app.get("/")
def home()->set:
    return {'home page'}

