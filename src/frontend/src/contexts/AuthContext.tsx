import {
  DEFAULT_USERS,
  type User,
  type UserRole,
  useDataStore,
} from "@/contexts/DataStoreContext";
import { createContext, useContext, useEffect, useState } from "react";

export type { User, UserRole };

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

const CURRENT_USER_KEY = "ls_current_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { users, updateUsers } = useDataStore();

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Session (current user) is still stored locally for persistence across refreshes
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  });

  // When users list updates from backend (e.g., another admin blocked this user),
  // re-validate the current session
  useEffect(() => {
    if (!currentUser) return;
    const freshUser = users.find((u) => u.username === currentUser.username);
    if (!freshUser) {
      // User was deleted
      setCurrentUser(null);
      localStorage.removeItem(CURRENT_USER_KEY);
      return;
    }
    if (freshUser.blocked) {
      // User was blocked
      setCurrentUser(null);
      localStorage.removeItem(CURRENT_USER_KEY);
      return;
    }
    // Update local session with fresh data (e.g., password change)
    if (
      freshUser.password !== currentUser.password ||
      freshUser.role !== currentUser.role
    ) {
      setCurrentUser(freshUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(freshUser));
    }
  }, [users, currentUser]);

  const login = (
    username: string,
    password: string,
  ): "ok" | "blocked" | "invalid" => {
    // Use DEFAULT_USERS as fallback if users list is somehow empty
    const userList = users.length > 0 ? users : DEFAULT_USERS;
    const user = userList.find(
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
    updateUsers([...users, newUser]);
    return true;
  };

  const deleteUser = (username: string) => {
    updateUsers(users.filter((u) => u.username !== username));
  };

  const blockUser = (username: string) => {
    updateUsers(
      users.map((u) => (u.username === username ? { ...u, blocked: true } : u)),
    );
  };

  const unblockUser = (username: string) => {
    updateUsers(
      users.map((u) =>
        u.username === username ? { ...u, blocked: false } : u,
      ),
    );
  };

  const changeCredentials = (
    username: string,
    newUsername: string,
    newPassword: string,
  ): boolean => {
    const normalizedNew = newUsername.toLowerCase().trim();
    if (
      normalizedNew !== username &&
      users.find((u) => u.username === normalizedNew)
    )
      return false;
    const updatedUsers = users.map((u) =>
      u.username === username
        ? { ...u, username: normalizedNew, password: newPassword }
        : u,
    );
    updateUsers(updatedUsers);
    // Update session if the changed user is currently logged in
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
