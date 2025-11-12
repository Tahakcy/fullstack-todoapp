from django.urls import path
from todos import views

urlpatterns = [
    path('api/register/', views.register),
    path('api/login/', views.login),
    path('api/logout/', views.logout_view),
    path('api/users/', views.userInfo),
    path('api/users/<uuid:id>/', views.userInfo),
    path('api/change-password/', views.changePassword),
    path('api/todos/', views.todoList),
    path('api/todos/<uuid:id>/', views.todo_detail),
]
