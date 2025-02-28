import { useEffect, useState } from "react";

interface Admin {
  id: number;
  username: string;
  isDefault: boolean;
}

interface User {
  id: number;
  username: string;
}

export default function AdminPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDefaultAdmin, setIsDefaultAdmin] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [newUserForm, setNewUserForm] = useState({
    username: "",
    password: "",
  });
  const [newAdminForm, setNewAdminForm] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const showMessage = (text: string, type: "error" | "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const checkAdminStatus = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/admin-check", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.logged_in) {
        setIsLoggedIn(true);
        setIsDefaultAdmin(data.is_default_admin);
        setAdminUsername(data.admin_username);
        setAdmins(
          data.admins.map((admin: [number, string, boolean]) => ({
            id: admin[0],
            username: admin[1],
            isDefault: admin[2],
          }))
        );
        await updateUserList();
      }
    } catch {
      showMessage("Failed to check login status", "error");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("username", loginForm.username);
      formData.append("password", loginForm.password);

      const response = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setIsLoggedIn(true);
        setIsDefaultAdmin(data.is_default_admin);
        setAdminUsername(loginForm.username);
        setAdmins(
          data.admins.map((admin: [number, string, boolean]) => ({
            id: admin[0],
            username: admin[1],
            isDefault: admin[2],
          }))
        );
        await updateUserList();
        showMessage("Login successful", "success");
        setLoginForm({ username: "", password: "" });
      } else {
        showMessage(data.message || "Invalid credentials", "error");
      }
    } catch {
      showMessage("An error occurred. Please try again.", "error");
    }
  };

  const updateUserList = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/admin/users", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch {
      showMessage("Failed to load users", "error");
    }
  };

  const handleAddUser = async () => {
    try {
      const formData = new FormData();
      formData.append("username", newUserForm.username);
      formData.append("password", newUserForm.password);

      const response = await fetch(
        "http://localhost:5000/api/admin/users/add",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );
      const data = await response.json();

      if (data.success) {
        showMessage(data.message || "User added successfully", "success");
        setNewUserForm({ username: "", password: "" });
        setShowAddUser(false);
        await updateUserList();
      } else {
        showMessage(data.message || "Failed to add user", "error");
      }
    } catch {
      showMessage("Failed to add user", "error");
    }
  };

  const handleAddAdmin = async () => {
    try {
      const formData = new FormData();
      formData.append("username", newAdminForm.username);
      formData.append("password", newAdminForm.password);

      const response = await fetch("http://localhost:5000/api/admin/add", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        showMessage(data.message || "Admin added successfully", "success");
        setNewAdminForm({ username: "", password: "" });
        setShowAddAdmin(false);
        setAdmins(
          data.admins.map((admin: [number, string, boolean]) => ({
            id: admin[0],
            username: admin[1],
            isDefault: admin[2],
          }))
        );
      } else {
        showMessage(data.message || "Failed to add admin", "error");
      }
    } catch {
      showMessage("Failed to add admin", "error");
    }
  };

  const handleRemoveAdmin = async (adminId: number) => {
    if (!window.confirm("Are you sure you want to remove this admin?")) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/remove/${adminId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      const data = await response.json();

      if (data.success) {
        showMessage(data.message || "Admin removed successfully", "success");
        setAdmins(
          data.admins.map((admin: [number, string, boolean]) => ({
            id: admin[0],
            username: admin[1],
            isDefault: admin[2],
          }))
        );
      } else {
        showMessage(data.message || "Failed to remove admin", "error");
      }
    } catch {
      showMessage("Failed to remove admin", "error");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/users/${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await response.json();

      if (data.success) {
        showMessage(data.message || "User deleted successfully", "success");
        await updateUserList();
      } else {
        showMessage(data.message || "Failed to delete user", "error");
      }
    } catch {
      showMessage("Failed to delete user", "error");
    }
  };

  const handleResetPassword = async (userId: number) => {
    const newPassword = window.prompt("Enter new password:");
    if (!newPassword) return;

    try {
      const formData = new FormData();
      formData.append("user_id", userId.toString());
      formData.append("new_password", newPassword);

      const response = await fetch(
        "http://localhost:5000/api/admin/users/reset-password",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );
      const data = await response.json();

      if (data.success) {
        showMessage(data.message || "Password reset successfully", "success");
      } else {
        showMessage(data.message || "Failed to reset password", "error");
      }
    } catch {
      showMessage("Failed to reset password", "error");
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        setIsLoggedIn(false);
        setIsDefaultAdmin(false);
        setAdminUsername("");
        setAdmins([]);
        setUsers([]);
        showMessage("Logged out successfully", "success");
      } else {
        showMessage(data.message || "Failed to logout", "error");
      }
    } catch {
      showMessage("Failed to logout", "error");
    }
  };

  return (
    <div className="admin-container">
      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {!isLoggedIn ? (
        <div id="login-section">
          <h2>ADMIN LOGIN</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, username: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                required
              />
            </div>
            <button type="submit" className="admin-btn">
              Login
            </button>
          </form>
        </div>
      ) : (
        <div id="admin-panel">
          <div className="admin-header">
            <div className="user-greeting">Hello {adminUsername}</div>
            <button onClick={handleLogout} className="small-btn">
              Logout
            </button>
          </div>

          <p className="section-desc">Manage users and administrative access</p>

          <h3>User Management</h3>
          <div className="user-actions">
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="action-btn"
            >
              {showAddUser ? "Cancel" : "+ Add User"}
            </button>
          </div>

          {showAddUser && (
            <div className="add-user-section">
              <div className="form-inline">
                <input
                  type="text"
                  placeholder="Username"
                  value={newUserForm.username}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, username: e.target.value })
                  }
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newUserForm.password}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, password: e.target.value })
                  }
                />
                <button onClick={handleAddUser} className="action-btn">
                  Add
                </button>
              </div>
            </div>
          )}

          <div className="list-container">
            {users.length === 0 ? (
              <p style={{ textAlign: "center", color: "#666" }}>
                No regular users found.
              </p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="user-item">
                  <span>{user.username}</span>
                  <div>
                    <button
                      onClick={() => handleResetPassword(user.id)}
                      className="action-btn"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="action-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <h3>Admin Management</h3>
          {isDefaultAdmin && (
            <div className="admin-actions">
              <button
                onClick={() => setShowAddAdmin(!showAddAdmin)}
                className="action-btn"
              >
                {showAddAdmin ? "Cancel" : "+ Add Admin"}
              </button>
            </div>
          )}

          {showAddAdmin && (
            <div className="add-admin-section">
              <div className="form-inline">
                <input
                  type="text"
                  placeholder="Username"
                  value={newAdminForm.username}
                  onChange={(e) =>
                    setNewAdminForm({
                      ...newAdminForm,
                      username: e.target.value,
                    })
                  }
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newAdminForm.password}
                  onChange={(e) =>
                    setNewAdminForm({
                      ...newAdminForm,
                      password: e.target.value,
                    })
                  }
                />
                <button onClick={handleAddAdmin} className="action-btn">
                  Add
                </button>
              </div>
            </div>
          )}

          <div className="list-container">
            {admins.length === 0 ? (
              <p style={{ textAlign: "center", color: "#666" }}>
                No administrators found.
              </p>
            ) : (
              admins.map((admin) => (
                <div key={admin.id} className="admin-item">
                  <span>
                    {admin.username}{" "}
                    {admin.isDefault && <small>(Default Admin)</small>}
                  </span>
                  {admin.isDefault ? (
                    <span>Protected</span>
                  ) : (
                    isDefaultAdmin && (
                      <button
                        onClick={() => handleRemoveAdmin(admin.id)}
                        className="action-btn"
                      >
                        Remove
                      </button>
                    )
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>
        {`
        .admin-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
          background-color: #fff;
        }

        .admin-container h2 {
          color: #501214;
          margin-top: 0;
          text-align: center;
        }

        .admin-container h3 {
          color: #501214;
          margin-top: 20px;
          margin-bottom: 10px;
        }

        .section-desc {
          color: #666;
          margin-bottom: 15px;
          text-align: center;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .user-greeting {
          font-size: 16px;
          font-weight: bold;
          color: #501214;
        }

        .admin-btn {
          background-color: #501214;
          color: white;
          border: none;
          padding: 10px 15px;
          cursor: pointer;
          width: 100%;
          font-weight: bold;
          margin-top: 10px;
        }

        .small-btn {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          padding: 5px 10px;
          cursor: pointer;
        }

        .list-container {
          border: 1px solid #eee;
          padding: 10px;
          margin-bottom: 20px;
          max-height: 300px;
          overflow-y: auto;
          background-color: #fff;
        }

        .user-item,
        .admin-item {
          padding: 10px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #fff;
        }

        .user-item:last-child,
        .admin-item:last-child {
          border-bottom: none;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
          color: #333;
        }

        input[type="text"],
        input[type="password"] {
          padding: 8px;
          border: 1px solid #ddd;
          box-sizing: border-box;
          width: 100%;
        }

        .action-btn {
          background: none;
          border: 1px solid #ddd;
          padding: 3px 8px;
          margin-left: 5px;
          cursor: pointer;
        }

        .user-actions,
        .admin-actions {
          margin-bottom: 10px;
        }

        .add-user-section,
        .add-admin-section {
          margin-bottom: 10px;
          padding: 10px;
          background-color: #f9f9f9;
          border: 1px solid #eee;
        }

        .form-inline {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .form-inline input {
          flex: 1;
          min-width: 0;
        }

        .message {
          padding: 10px;
          margin-bottom: 15px;
          border-radius: 4px;
        }

        .message.error {
          background-color: #f8d7da;
          color: #721c24;
        }

        .message.success {
          background-color: #d4edda;
          color: #155724;
        }

        @media (max-width: 600px) {
          .form-inline {
            flex-direction: column;
            align-items: stretch;
          }

          .action-btn {
            margin-left: 0;
            margin-top: 5px;
          }
        }
      `}
      </style>
    </div>
  );
}
