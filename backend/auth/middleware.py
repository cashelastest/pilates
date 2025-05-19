from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.templating import Jinja2Templates

template = Jinja2Templates(directory='templates')

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request:Request, call_next):
        response = await call_next(request)

        if response.status_code == 401:
            return template.TemplateResponse(
                request=request, name="forbidden.html"
            )
        return response