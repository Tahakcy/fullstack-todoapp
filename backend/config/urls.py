# backend/urls.py
from django.contrib import admin
from django.urls import path
from todos.views import (
    register, login, logout_view,
    userInfo, changePassword,
    todoList,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/register/', register),
    path('api/login/', login),
    path('api/logout/', logout_view),

    path('api/users/<uuid:id>/', userInfo),
    path('api/change-password/', changePassword),

    path('api/todos/', todoList), 
    path('api/todos/<uuid:id>/', todoList),      
]
