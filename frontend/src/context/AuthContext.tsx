import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface User {
  id: number;
  username: string;
}

interface LoginResponse {
  status: string;
  duo_url?: string;
  user?: User;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (formData: FormData) => Promise<LoginResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/status", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      console.log("Auth status:", data);

      if (data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Retry authentication check if it fails
  useEffect(() => {
    if (!isLoading && !user && retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount((count) => count + 1);
        checkAuthStatus();
      }, 1000 * (retryCount + 1)); // Exponential backoff

      return () => clearTimeout(timer);
    }
  }, [isLoading, user, retryCount]);

  const login = async (formData: FormData): Promise<LoginResponse> => {
    const response = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    if (data.status === "success" && data.user) {
      setUser(data.user);
      setRetryCount(0); // Reset retry count on successful login
    }

    return data;
  };

  const logout = async () => {
    try {
      // First, clear the local state
      setUser(null);

      const response = await fetch("http://localhost:5000/api/logout", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Wait a bit before checking auth status to ensure session is cleared
      await new Promise((resolve) => setTimeout(resolve, 100));
      await checkAuthStatus();

      setRetryCount(0); // Reset retry count on logout
    } catch (error) {
      console.error("Error during logout:", error);
      // If logout fails, recheck auth status
      await checkAuthStatus();
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
