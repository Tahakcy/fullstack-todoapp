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

  const [showProfile, setShowProfile] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [editID, setEditID] = useState(null);
  const [editTask, setEditTask] = useState("");

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
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    saveUser({ user_id: lg.user_id, username: lg.username });
    setPassword(""); setEmail("");
  }

  async function doLogin() {
    const lg = await api("/login/", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    saveUser({ user_id: lg.user_id, username: lg.username });
    setPassword("");
  }

  useEffect(() => {
    if (!user?.user_id) { setTodos([]); setUserInfo(null); return; }

    Promise.all([
      fetch(`${API}/todos/?user_id=${user.user_id}`).then(r => r.json()).catch(() => []),
      fetch(`${API}/users/${user.user_id}/`).then(r => r.json()).catch(() => null),
    ]).then(([list, info]) => {
      setTodos(Array.isArray(list) ? list : []);
      setUserInfo(info);
    });
  }, [user?.user_id]);

  async function handleRegister(e){ e.preventDefault();
    try { await doRegister(); } catch (err) { alert(err.message); } }

  async function handleLogin(e){ e.preventDefault();
    try { await doLogin(); } catch (err) { alert(err.message); } }

  function handleLogout(e){ e.preventDefault();
    clearUser(); setUsername(""); setPassword(""); setEmail("");
    setTodos([]); setNewTask(""); setEditID(null); setEditTask("");
    setUserInfo(null); setShowProfile(false); setView("login");
  }

  async function handleAdd(e){ e.preventDefault();
    if (!newTask.trim() || !user?.user_id) return;
    try {
      const item = await api("/todos/", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, task: newTask.trim() }),
      });
      setTodos(prev => [item, ...prev]); setNewTask("");
    } catch (err) { alert(err.message); }
  }

  async function handleToggle(e, todo){ e.preventDefault();
    try {
      const updated = await api(`/todos/${todo.id}/`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, completed: !todo.completed }),
      });
      setTodos(prev => prev.map(t => t.id === todo.id ? updated : t));
    } catch (err) { alert(err.message); }
  }

  function handleEditStart(e, todo){ e.preventDefault();
    setEditID(todo.id); setEditTask(todo.task);
  }

  async function handleEditSave(e, todo){ e.preventDefault();
    if (!editTask.trim()) return;
    try {
      const updated = await api(`/todos/${todo.id}/`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, task: editTask.trim() }),
      });
      setTodos(prev => prev.map(t => t.id === todo.id ? updated : t));
      setEditID(null); setEditTask("");
    } catch (err) { alert(err.message); }
  }

  function handleEditCancel(e){ e.preventDefault(); setEditID(null); setEditTask(""); }

  async function handleDelete(e, todo){ e.preventDefault();
    try {
      await api(`/todos/${todo.id}/`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id }),
      });
      setTodos(prev => prev.filter(t => t.id !== todo.id));
    } catch (err) { alert(err.message); }
  }

  async function handleChangePassword(e){ e.preventDefault();
    if (!currentPassword || !newPassword) { alert("Mevcut ve yeni şifre girin"); return; }
    try {
      const res = await api("/change-password/", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      if (!res?.ok) { alert(res?.error || "Şifre değişmedi"); return; }
      alert("Şifre güncellendi");
      setCurrentPassword(""); setNewPassword("");
    } catch (err) { alert(err.message); }
  }

  if (!user?.user_id) {
    return (
      <div style={{ maxWidth: 420, margin: "24px auto", fontFamily: "system-ui" }}>
        <h2>Auth</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={() => setView("login")} disabled={view === "login"}>Login</button>
          <button onClick={() => setView("register")} disabled={view === "register"}>Register</button>
        </div>

        {view === "login" && (
          <form onSubmit={handleLogin} style={{ display: "grid", gap: 8 }}>
            <input placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} />
            <input type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
            <button type="submit">Login</button>
          </form>
        )}

        {view === "register" && (
          <form onSubmit={handleRegister} style={{ display: "grid", gap: 8 }}>
            <input placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} />
            <input type="email" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
            <button type="submit">Register</button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "24px auto", fontFamily: "system-ui", display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, position: "relative" }}>
        <button type="button" onClick={() => setShowProfile(s => !s)}>Profile</button>
        <form onSubmit={handleLogout}><button type="submit">Logout</button></form>

        {showProfile && (
          <div style={{ position: "absolute", top: 40, right: 0, minWidth: 240, padding: 12, background: "white", border: "1px solid #ddd", borderRadius: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>User Info</div>
            <div style={{ display: "grid", gap: 6, fontSize: 14 }}>
              <div><strong>Username:</strong> {userInfo?.username ?? user.username}</div>
              <div><strong>Email:</strong> {userInfo?.email ?? "-"}</div>
              <div style={{ fontSize: 12, color: "#777" }}><strong>ID:</strong> {user.user_id}</div>
            </div>
            <div style={{ height: 1, background: "#eee", margin: 10 }} />
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Change Password</div>
            <form onSubmit={handleChangePassword} style={{ display: "grid", gap: 6 }}>
              <input type="password" placeholder="current password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} />
              <input type="password" placeholder="new password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
              <button type="submit">Update Password</button>
            </form>
          </div>
        )}
      </div>

      <h2>Todos</h2>

      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input placeholder="New task" value={newTask} onChange={e=>setNewTask(e.target.value)} style={{ flex: 1 }} />
        <button type="submit">Add</button>
      </form>

      <ul style={{ display: "grid", gap: 10, paddingLeft: 16 }}>
        {todos.map(todo => (
          <li key={todo.id} style={{ display: "grid", gap: 6 }}>
            <form onSubmit={e=>handleToggle(e, todo)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={!!todo.completed} onChange={e=>e.currentTarget.form.requestSubmit()} />
              <span style={{ flex: 1, textDecoration: todo.completed ? "line-through" : "none" }}>{todo.task}</span>
            </form>

            {editID !== todo.id && (
              <form onSubmit={e=>handleEditStart(e, todo)}><button type="submit">Edit</button></form>
            )}
            {editID === todo.id && (
              <form onSubmit={e=>handleEditSave(e, todo)} style={{ display: "flex", gap: 8 }}>
                <input value={editTask} onChange={e=>setEditTask(e.target.value)} />
                <button type="submit">Save</button>
                <button type="button" onClick={e=>{ e.preventDefault(); setEditID(null); setEditTask(""); }}>Cancel</button>
              </form>
            )}

            <form onSubmit={e=>handleDelete(e, todo)}><button type="submit">Delete</button></form>
          </li>
        ))}
      </ul>
    </div>
  );
}
