
from typing import List,ClassVar


class RolePermissionsMixin:
    _role: ClassVar[str]= "user"
    _permissions: ClassVar[List[str]] = []

    @property
    def role(self) -> str:
        return self._role
    
    @property
    def permissions(self) -> List[str]:
        return self._permissions

class UserMixin(RolePermissionsMixin):
    _role: str = "user"
    _permissions: List[str] = [] #* Here I will add all permissions for users


class CoachMixin(RolePermissionsMixin):
    _role: str = "coach"
    _permissions: List[str] = [] #* Here I will add all permissions for users


class AdminMixin(RolePermissionsMixin):
    _role: str = "admin"
    _permissions: List[str] = [] #* Here I will add all permissions for users