import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChange } from '../services/auth.service';
import type { Profile } from '../types/database';

interface AuthContextType {
  user: any;
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 获取用户资料的辅助函数
  const fetchProfile = async (userId: string) => {
    try {
      const { getCurrentUserProfile } = await import('../services/auth.service');
      const { profile: userProfile } = await getCurrentUserProfile();
      setProfile(userProfile);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err as Error);
    }
  };

  // 初始化：监听认证状态变化
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('开始初始化认证系统...');
        const result = await onAuthStateChange(async (event, session) => {
          console.log('认证状态变化:', { event, hasSession: !!session, hasUser: !!session?.user });
          if (!mounted) return;

          if (session?.user) {
            console.log('用户已登录:', session.user.id);
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else {
            console.log('用户未登录');
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        });

        const session = (result as any).data?.session;
        console.log('初始会话状态:', { hasSession: !!session, hasUser: !!session?.user });
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err as Error);
      } finally {
        if (mounted) {
          console.log('认证初始化完成，设置loading为false');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // 登录
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const { login: loginFn } = await import('../services/auth.service');
      const { user: loggedInUser, profile: userProfile } = await loginFn({ email, password });
      setUser(loggedInUser);
      setProfile(userProfile);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 注册
  const register = async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true);
      setError(null);
      const { register: registerFn } = await import('../services/auth.service');
      const { user: registeredUser, profile: userProfile } = await registerFn({
        email,
        password,
        fullName,
      });
      setUser(registeredUser);
      setProfile(userProfile);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 登出
  const logout = async () => {
    try {
      setLoading(true);
      const { logout: logoutFn } = await import('../services/auth.service');
      await logoutFn();
      setUser(null);
      setProfile(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 刷新用户资料
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    error,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 自定义 Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}