import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser } from '../api/auth';
import { setAuthTokens, clearAuthStorage, getRefreshToken } from '../api/client';

const AuthContext = createContext(null);
const USER_KEY = 'cashledger_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

    return response.data;
  };

  const logout = async () => {

    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await logoutUser(refreshToken);
      } catch (err) {
       
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