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

    user = User(username=username, email=email)
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

    return JsonResponse({"ok": True, "user_id": str(user.id), "username": user.username})


@csrf_exempt
def logout_view(req):
    if req.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    return JsonResponse({"ok": True})


def userInfo(req, id):
    if req.method != "GET":
        return JsonResponse({"error": "GET required"}, status=405)

    user = get_object_or_404(User, id=id)
    return JsonResponse({
        "user_id": str(user.id),
        "username": user.username,
        "email": user.email,
    })


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


@csrf_exempt
def todoList(req, id=None):
    
    if req.method == "GET":
        user_id = (req.GET.get("user_id") or "").strip()
        if not user_id:
            return JsonResponse({"error": "user_id required"}, status=400)

        todos = Todo.objects.filter(user_id=user_id).order_by("-created_at")
        data = [{
            "id": str(t.id),
            "task": t.task,
            "completed": t.completed,
        } for t in todos]
        return JsonResponse(data, safe=False)

    data = json.loads(req.body or "{}")
    user_id = (data.get("user_id") or "").strip()
    if not user_id:
        return JsonResponse({"error": "user_id required"}, status=400)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "invalid user_id"}, status=400)

    if req.method == "POST":
        task = (data.get("task") or "").strip()
        if not task:
            return JsonResponse({"error": "task required"}, status=400)

        todo = Todo.objects.create(user=user, task=task, completed=False)
        return JsonResponse({
            "id": str(todo.id),
            "task": todo.task,
            "completed": todo.completed,
        }, status=201)

    if req.method == "PUT":
        if id is None:
            return JsonResponse({"error": "todo id required in URL"}, status=400)

        todo = get_object_or_404(Todo, id=id, user_id=user_id)

        if "task" in data:
            new_task = (data.get("task") or "").strip()
            if not new_task:
                return JsonResponse({"error": "task cannot be empty"}, status=400)
            todo.task = new_task

        if "completed" in data:
            todo.completed = bool(data["completed"])

        todo.save()
        return JsonResponse({
            "id": str(todo.id),
            "task": todo.task,
            "completed": todo.completed,
        })

    if req.method == "DELETE":
        if id is None:
            return JsonResponse({"error": "todo id required in URL"}, status=400)
        get_object_or_404(Todo, id=id, user_id=user_id).delete()
        return JsonResponse({"deleted": str(id)})

    return HttpResponseNotAllowed(["GET", "POST", "PUT", "DELETE"])
