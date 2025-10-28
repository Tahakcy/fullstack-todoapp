from django.contrib import admin
from .models import User, Todo

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email', 'created_at')
    search_fields = ('username', 'email')

@admin.register(Todo)
class TodoAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'task', 'completed', 'created_at')
    list_filter = ('completed',)
    search_fields = ('task',)
