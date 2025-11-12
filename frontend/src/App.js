import React, { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000/api";

export default function App() {
  const [view, setView] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("todo_user");
    return raw ? JSON.parse(raw) : null;
  });

  const [todos, setTodos] = useState([]);
  const [users, setUsers] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [editID, setEditID] = useState(null);
  const [editTask, setEditTask] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  function saveUser(u) {
    localStorage.setItem("todo_user", JSON.stringify(u));
    setUser(u);
  }

  function clearUser() {
    localStorage.removeItem("todo_user");
    setUser(null);
  }

  async function api(path, opts) {
    const res = await fetch(`${API}${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Request failed");
    return data;
  }

  async function doRegister() {
    await api("/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const lg = await api("/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    saveUser({ user_id: lg.user_id, username: lg.username, user_type: lg.user_type });
    setPassword("");
    setEmail("");
  }

  async function doLogin() {
    const lg = await api("/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    saveUser({ user_id: lg.user_id, username: lg.username, user_type: lg.user_type });
    setPassword("");
  }

  function handleLogout(e) {
    e.preventDefault();
    clearUser();
    setUsername("");
    setPassword("");
    setEmail("");
    setTodos([]);
    setUsers([]);
    setNewTask("");
    setEditID(null);
    setEditTask("");
    setCurrentPassword("");
    setNewPassword("");
    setView("login");
  }

  useEffect(() => {
    if (!user?.user_id) return;

    fetch(`${API}/todos/?user_id=${user.user_id}`)
      .then((r) => r.json())
      .then((data) => setTodos(data))
      .catch(() => setTodos([]));

    if (user.user_type === "admin") {
      fetch(`${API}/users/?user_id=${user.user_id}`)
        .then((res) => res.json())
        .then((data) => setUsers(data))
        .catch(() => setUsers([]));
    }
  }, [user?.user_id, user?.user_type]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      const item = await api("/todos/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, task: newTask.trim() }),
      });
      setTodos((prev) => [item, ...prev]);
      setNewTask("");
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleToggle(e, todo) {
    e.preventDefault();
    try {
      const updated = await api(`/todos/${todo.id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, completed: !todo.completed }),
      });
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
    } catch (err) {
      alert(err.message);
    }
  }

  function handleEditStart(e, todo) {
    e.preventDefault();
    setEditID(todo.id);
    setEditTask(todo.task);
  }

  function handleEditCancel(e) {
    e.preventDefault();
    setEditID(null);
    setEditTask("");
  }

  async function handleEditSave(e, todo) {
    e.preventDefault();
    if (!editTask.trim()) return;
    try {
      const updated = await api(`/todos/${todo.id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, task: editTask.trim() }),
      });
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
      setEditID(null);
      setEditTask("");
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(e, todo) {
    e.preventDefault();
    try {
      await api(`/todos/${todo.id}/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id }),
      });
      setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      alert("Lütfen mevcut ve yeni şifreyi girin.");
      return;
    }

    try {
      const res = await api("/change-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      alert("Şifre güncellendi");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      alert(err.message);
    }
  }

  if (!user?.user_id) {
    return (
      <div style={{ maxWidth: 420, margin: "24px auto", fontFamily: "system-ui" }}>
        <h2>Giriş / Kayıt</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={() => setView("login")} disabled={view === "login"}>
            Giriş
          </button>
          <button onClick={() => setView("register")} disabled={view === "register"}>
            Kayıt
          </button>
        </div>

        {view === "login" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              doLogin().catch((err) => alert(err.message));
            }}
            style={{ display: "grid", gap: 8 }}
          >
            <input
              placeholder="Kullanıcı adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Giriş Yap</button>
          </form>
        )}

        {view === "register" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              doRegister().catch((err) => alert(err.message));
            }}
            style={{ display: "grid", gap: 8 }}
          >
            <input
              placeholder="Kullanıcı adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Kayıt Ol</button>
          </form>
        )}
      </div>
    );
  }

  if (user.user_type === "admin") {
    return (
      <div style={{ maxWidth: 900, margin: "24px auto", fontFamily: "system-ui" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
          <h2>Admin Panel</h2>
          <form onSubmit={handleLogout}>
            <button type="submit">Çıkış</button>
          </form>
        </div>

        <h3>Kayıtlı Kullanıcılar</h3>
        <table border="1" cellPadding={8} style={{ width: "100%", marginBottom: 32 }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th>ID</th>
              <th>Kullanıcı Adı</th>
              <th>Email</th>
              <th>Tip</th>
              <th>Kayıt Tarihi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td style={{ fontSize: "0.85em" }}>{u.user_id}</td>
                <td><strong>{u.username}</strong></td>
                <td>{u.email}</td>
                <td>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      backgroundColor: u.user_type === "admin" ? "#ffe0b2" : "#e3f2fd",
                      fontSize: "0.85em",
                    }}
                  >
                    {u.user_type}
                  </span>
                </td>
                <td>{new Date(u.created_at).toLocaleString("tr-TR")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Tüm Görevler (Salt Okunur)</h3>
        <table border="1" cellPadding={8} style={{ width: "100%" }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th>Todo ID</th>
              <th>Kullanıcı</th>
              <th>Görev</th>
              <th>Durum</th>
              <th>Oluşturma Tarihi</th>
            </tr>
          </thead>
          <tbody>
            {todos.map((todo) => (
              <tr key={todo.id}>
                <td style={{ fontSize: "0.85em" }}>{todo.id}</td>
                <td><strong>{todo.username}</strong></td>
                <td
                  style={{
                    textDecoration: todo.completed ? "line-through" : "none",
                    color: todo.completed ? "#999" : "#000",
                  }}
                >
                  {todo.task}
                </td>
                <td>
                  <input type="checkbox" checked={!!todo.completed} disabled />
                </td>
                <td>{new Date(todo.created_at).toLocaleString("tr-TR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 560,
        margin: "24px auto",
        fontFamily: "system-ui",
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Merhaba, {user.username}</h2>
        <form onSubmit={handleLogout}>
          <button type="submit">Çıkış</button>
        </form>
      </div>

      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Yeni görev"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit">Ekle</button>
      </form>

      <ul style={{ display: "grid", gap: 10, paddingLeft: 16 }}>
        {todos.map((todo) => (
          <li key={todo.id} style={{ display: "grid", gap: 6 }}>
            <form
              onSubmit={(e) => handleToggle(e, todo)}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <input
                type="checkbox"
                checked={!!todo.completed}
                onChange={(e) => e.currentTarget.form.requestSubmit()}
              />
              <span
                style={{
                  flex: 1,
                  textDecoration: todo.completed ? "line-through" : "none",
                }}
              >
                {todo.task}
              </span>
            </form>

            {editID !== todo.id && (
              <div style={{ display: "flex", gap: 8 }}>
                <form onSubmit={(e) => handleEditStart(e, todo)}>
                  <button type="submit">Düzenle</button>
                </form>
                <form onSubmit={(e) => handleDelete(e, todo)}>
                  <button type="submit">Sil</button>
                </form>
              </div>
            )}

            {editID === todo.id && (
              <form
                onSubmit={(e) => handleEditSave(e, todo)}
                style={{ display: "flex", gap: 8 }}
              >
                <input
                  value={editTask}
                  onChange={(e) => setEditTask(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit">Kaydet</button>
                <button type="button" onClick={handleEditCancel}>
                  İptal
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>

      <div style={{ borderTop: "1px solid #ccc", paddingTop: 12, marginTop: 12 }}>
        <h4> Şifre Değiştir</h4>
        <form onSubmit={handleChangePassword} style={{ display: "grid", gap: 6 }}>
          <input
            type="password"
            placeholder="Mevcut şifre"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Yeni şifre"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button type="submit">Şifreyi Güncelle</button>
        </form>
      </div>
    </div>
  );
}