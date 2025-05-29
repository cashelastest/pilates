
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse

template = Jinja2Templates(directory='templates')

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        if response.status_code == 401:
            if request.url.path.startswith('/api/'):
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Unauthorized"}
                )
            else:
                return template.TemplateResponse(
                    request=request, name="forbidden.html"
                )
        if response.status_code == 404:
            if request.url.path.startswith("/api/"):
                return JSONResponse(
                    status_code=404,
                    content="Not Found"
                )
            else:
                return template.TemplateResponse(
                    request=request, name='not_found.html'
                )
        return response