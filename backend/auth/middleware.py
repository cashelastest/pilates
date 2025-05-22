
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse

template = Jinja2Templates(directory='templates')

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        if response.status_code == 401:
            # Проверяем, это API запрос или запрос к странице
            if request.url.path.startswith('/api/'):
                # Для API возвращаем JSON
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Unauthorized"}
                )
            else:
                # Для страниц возвращаем HTML
                return template.TemplateResponse(
                    request=request, name="forbidden.html"
                )
        return response