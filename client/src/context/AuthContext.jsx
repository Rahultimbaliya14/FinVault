import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser } from '../api/auth';
import { setAuthTokens, clearAuthStorage, getRefreshToken } from '../api/client';

const AuthContext = createContext(null);
const USER_KEY = 'finvault_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, check if a session already exists from a previous visit.
  // We only need the ACCESS token to render as "logged in" immediately -
  // if it's actually expired, the very next API call's 401 will trigger
  // the refresh flow in client.js automatically and silently.
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    const refreshToken = getRefreshToken();
    if (storedUser && refreshToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await loginUser(email, password);
    const { accessToken, refreshToken, user: userData } = response.data;
    setAuthTokens(accessToken, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (email, password) => {
    const response = await registerUser(email, password);
    const { accessToken, refreshToken, user: userData } = response.data;
    setAuthTokens(accessToken, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    // Tell the backend to revoke this refresh token so it can never be
    // used again, even if it somehow leaked. Best-effort: if this call
    // fails (offline, etc.), still clear local storage and log out
    // locally - there's nothing more the user can do about that.
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await logoutUser(refreshToken);
      } catch (err) {
        // Ignore - we're logging out locally regardless
      }
    }
    clearAuthStorage();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook so components just call useAuth() instead of importing context directly
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};