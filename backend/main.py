from fastapi import Request, FastAPI
from routers.dashboard import dashboard_router
from routers.client import client_router
from routers.clients import clients_router
from routers.coaches import coaches_router
from routers.subscription import subscription_router,api_subscription_router
from routers.socket import socket
from fastapi.staticfiles import StaticFiles
from routers.group import group_router
from auth.registration import auth_router,api_auth_router
from routers.stats import stats_router
from auth.middleware import AuthMiddleware
app = FastAPI()
routers = [
    dashboard_router,
    client_router,
    clients_router,
    group_router,
    socket,
    coaches_router,
    subscription_router,
    api_subscription_router,
    auth_router,
    api_auth_router,
    stats_router
]
for router in routers:
    app.include_router(router)
app.mount('/static', StaticFiles(directory='static'),name = 'static')
app.mount("/media", StaticFiles(directory="media"), name="media")
@app.get("/")
def home()->set:
    return {'home page'}
app.add_middleware(AuthMiddleware)
# В main.py или run.py
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, limit_concurrency=100)