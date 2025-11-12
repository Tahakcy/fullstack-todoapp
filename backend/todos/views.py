import json
from django.http import JsonResponse, HttpResponseNotAllowed
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from .models import User, Todo

@csrf_exempt
def register(req):
    if req.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    data = json.loads(req.body or "{}")
    email = (data.get("email") or "").strip()
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password or not email:
        return JsonResponse({"error": "Email, username and password required"}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "username already taken"}, status=400)

    if User.objects.filter(email=email).exists():
        return JsonResponse({"error": "email already taken"}, status=400)

    user = User(username=username, email=email, user_type='user')
    user.set_password(password)
    user.save()

    return JsonResponse({"ok": True, "user_id": str(user.id)})

@csrf_exempt
def login(req):
    if req.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    data = json.loads(req.body or "{}")
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return JsonResponse({"ok": False, "reason": "missing credentials"}, status=400)

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"ok": False, "reason": "wrong credentials"}, status=401)

    if not user.check_password(password):
        return JsonResponse({"ok": False, "reason": "wrong credentials"}, status=401)

    return JsonResponse({
        "ok": True, 
        "user_id": str(user.id), 
        "username": user.username,
        "user_type": user.user_type
    })

@csrf_exempt
def logout_view(req):
    if req.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    return JsonResponse({"ok": True})

@csrf_exempt
def changePassword(req):
    if req.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    data = json.loads(req.body or "{}")
    user_id = data.get("user_id")
    current_password = (data.get("current_password") or "").strip()
    new_password = (data.get("new_password") or "").strip()

    if not user_id or not current_password or not new_password:
        return JsonResponse({"error": "user_id, current_password, new_password required"}, status=400)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "invalid user_id"}, status=400)

    if not user.check_password(current_password):
        return JsonResponse({"error": "wrong password"}, status=401)

    user.set_password(new_password)
    user.save()
    return JsonResponse({"ok": True, "message": "password updated"})


def userInfo(req, id=None):
    if req.method != "GET":
        return JsonResponse({"error": "GET required"}, status=405)
    
    user_id = req.GET.get("user_id")
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    if user.user_type == 'admin':
        users = User.objects.all()
        user_data = [{
            "user_id": str(u.id),
            "username": u.username,
            "email": u.email,
            "user_type": u.user_type,
            "created_at": u.created_at.isoformat(),
        } for u in users]
        return JsonResponse(user_data, safe=False)
    
    user_data = {
        "user_id": str(user.id),
        "username": user.username,
        "email": user.email,
        "user_type": user.user_type,
        "created_at": user.created_at.isoformat(),
    }

    return JsonResponse(user_data)


@csrf_exempt
def todoList(req):
    if req.method == "GET":
        user_id = req.GET.get("user_id", "").strip()
        if not user_id:
            return JsonResponse({"error": "user_id required"}, status=400)

        user = get_object_or_404(User, id=user_id)

        if user.user_type == 'admin':
            todos = Todo.objects.all().order_by("-created_at")
        else:
            todos = Todo.objects.filter(user_id=user_id).order_by("-created_at")

        data = [{
            "id": str(t.id),
            "task": t.task,
            "completed": t.completed,
            "user_id": str(t.user.id),
            "username": t.user.username,
            "created_at": t.created_at.isoformat(),
        } for t in todos]

        return JsonResponse(data, safe=False)

    if req.method == "POST":
        data = json.loads(req.body or "{}")
        user_id = (data.get("user_id") or "").strip()
        if not user_id:
            return JsonResponse({"error": "user_id required"}, status=400)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({"error": "invalid user_id"}, status=400)

        task = (data.get("task") or "").strip()
        if not task:
            return JsonResponse({"error": "task required"}, status=400)

        if user.user_type == 'admin':
            return JsonResponse({"error": "Admins cannot create todos"}, status=403)

        todo = Todo.objects.create(user=user, task=task, completed=False)
        
        return JsonResponse({
            "id": str(todo.id),
            "task": todo.task,
            "completed": todo.completed,
            "user_id": str(todo.user.id),
            "username": todo.user.username,
            "created_at": todo.created_at.isoformat(),
        }, status=201)

    return HttpResponseNotAllowed(["GET", "POST"])


@csrf_exempt
def todo_detail(req, id):
    try:
        todo = Todo.objects.get(id=id)
    except Todo.DoesNotExist:
        return JsonResponse({"error": "Todo not found"}, status=404)

    if req.method == "GET":
        return JsonResponse({
            "id": str(todo.id),
            "task": todo.task,
            "completed": todo.completed,
            "user_id": str(todo.user.id),
            "username": todo.user.username,
            "created_at": todo.created_at.isoformat(),
        })

    if req.method == "PUT":
        data = json.loads(req.body or "{}")
        user_id = (data.get("user_id") or "").strip()
        
        if not user_id:
            return JsonResponse({"error": "user_id required"}, status=400)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({"error": "invalid user_id"}, status=400)

        if user.user_type == 'admin':
            return JsonResponse({"error": "Admins cannot update todos"}, status=403)

        if str(todo.user.id) != user_id:
            return JsonResponse({"error": "You can only update your own todos"}, status=403)

        task = data.get("task", "").strip()
        completed = data.get("completed", None)

        if task:
            todo.task = task
        if completed is not None:
            todo.completed = bool(completed)

        todo.save()
        return JsonResponse({
            "id": str(todo.id),
            "task": todo.task,
            "completed": todo.completed,
            "user_id": str(todo.user.id),
            "username": todo.user.username,
            "created_at": todo.created_at.isoformat(),
        })

    if req.method == "DELETE":
        data = json.loads(req.body or "{}")
        user_id = (data.get("user_id") or "").strip()
        
        if not user_id:
            return JsonResponse({"error": "user_id required"}, status=400)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({"error": "invalid user_id"}, status=400)

        if user.user_type == 'admin':
            return JsonResponse({"error": "Admins cannot delete todos"}, status=403)

        if str(todo.user.id) != user_id:
            return JsonResponse({"error": "You can only delete your own todos"}, status=403)

        todo.delete()
        return JsonResponse({"deleted": str(id)})

    return HttpResponseNotAllowed(["GET", "PUT", "DELETE"])