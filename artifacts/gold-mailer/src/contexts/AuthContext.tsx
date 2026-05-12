import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

interface User {
  id: number;
  email: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  age: number | null;
  gender: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  profileComplete: boolean;
  cardAdded: boolean;
  balance: number;
  hasDeposited: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => {
        if (r.ok) return r.json();
        return null;
      })
      .then(data => {
        if (data && data.id) setUser(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = (u: User) => setUser(u);
  const logout = () => {
    setUser(null);
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  };
  const updateUser = (u: User) => setUser(u);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
