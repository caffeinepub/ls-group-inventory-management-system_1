import { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "admin" | "staff";

export interface User {
  username: string;
  password: string;
  role: UserRole;
  blocked?: boolean;
}

interface AuthContextValue {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => "ok" | "blocked" | "invalid";
  logout: () => void;
  addUser: (username: string, password: string, role: UserRole) => boolean;
  deleteUser: (username: string) => void;
  blockUser: (username: string) => void;
  unblockUser: (username: string) => void;
  changeCredentials: (
    username: string,
    newUsername: string,
    newPassword: string,
  ) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEFAULT_USERS: User[] = [
  { username: "akshay", password: "lsgroup", role: "admin" },
  { username: "harshul", password: "lsgroup", role: "admin" },
  { username: "ashok", password: "lsgroup", role: "admin" },
  { username: "chandan", password: "lsgroup", role: "admin" },
  { username: "ashish", password: "lsgroup", role: "admin" },
];

const USERS_KEY = "ls_users";
const CURRENT_USER_KEY = "ls_current_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  const login = (
    username: string,
    password: string,
  ): "ok" | "blocked" | "invalid" => {
    const user = users.find(
      (u) => u.username === username.toLowerCase() && u.password === password,
    );
    if (!user) return "invalid";
    if (user.blocked) return "blocked";
    setCurrentUser(user);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return "ok";
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const addUser = (
    username: string,
    password: string,
    role: UserRole,
  ): boolean => {
    const normalized = username.toLowerCase().trim();
    if (users.find((u) => u.username === normalized)) return false;
    const newUser: User = { username: normalized, password, role };
    setUsers((prev) => [...prev, newUser]);
    return true;
  };

  const deleteUser = (username: string) => {
    setUsers((prev) => prev.filter((u) => u.username !== username));
  };

  const blockUser = (username: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.username === username ? { ...u, blocked: true } : u)),
    );
  };

  const unblockUser = (username: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.username === username ? { ...u, blocked: false } : u)),
    );
  };

  const changeCredentials = (
    username: string,
    newUsername: string,
    newPassword: string,
  ): boolean => {
    const normalizedNew = newUsername.toLowerCase().trim();
    // Check if newUsername is taken by another user
    if (
      normalizedNew !== username &&
      users.find((u) => u.username === normalizedNew)
    )
      return false;
    setUsers((prev) =>
      prev.map((u) =>
        u.username === username
          ? { ...u, username: normalizedNew, password: newPassword }
          : u,
      ),
    );
    // If the changed user is the current logged-in user, update session
    if (currentUser?.username === username) {
      const updated = {
        ...currentUser,
        username: normalizedNew,
        password: newPassword,
      };
      setCurrentUser(updated);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        addUser,
        deleteUser,
        blockUser,
        unblockUser,
        changeCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
