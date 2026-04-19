import { supabase, getCurrentUser, getCurrentSession } from '../lib/supabase';
import type { Profile } from '../types/database';

// 检查是否为本地模式
const isLocalMode = !import.meta.env.VITE_SUPABASE_URL || 
                    import.meta.env.VITE_SUPABASE_URL === 'your_supabase_project_url';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthResponse {
  user: any;
  profile: Profile | null;
  error: Error | null;
}

// 本地模式辅助函数
const createLocalUser = (email: string, fullName?: string) => {
  const userId = `local-${Date.now()}`;
  return {
    id: userId,
    email,
    created_at: new Date().toISOString(),
    user_metadata: {
      full_name: fullName || email.split('@')[0],
    },
  };
};

const createLocalProfile = (userId: string, fullName?: string): Profile => {
  return {
    id: userId,
    user_id: userId,
    full_name: fullName || null,
    avatar_url: null,
    level: 1,
    streak_days: 0,
    total_meditation_minutes: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

// 登录
export async function login(data: LoginData): Promise<AuthResponse> {
  if (isLocalMode) {
    // 本地模式登录
    try {
      const localUser = createLocalUser(data.email);
      const localProfile = createLocalProfile(localUser.id, data.email.split('@')[0]);
      
      // 保存到本地存储
      localStorage.setItem('local_user', JSON.stringify(localUser));
      localStorage.setItem('local_profile', JSON.stringify(localProfile));
      
      return { user: localUser, profile: localProfile, error: null };
    } catch (error) {
      return {
        user: null,
        profile: null,
        error: error as Error,
      };
    }
  }

  // Supabase 模式登录
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      return { user: null, profile: null, error: authError };
    }

    // 获取用户 profile
    const profile = await getProfile(authData.user.id);

    return { user: authData.user, profile, error: null };
  } catch (error) {
    return {
      user: null,
      profile: null,
      error: error as Error,
    };
  }
}

// 注册
export async function register(data: RegisterData): Promise<AuthResponse> {
  if (isLocalMode) {
    // 本地模式注册
    try {
      const localUser = createLocalUser(data.email, data.fullName);
      const localProfile = createLocalProfile(localUser.id, data.fullName);
      
      // 保存到本地存储
      localStorage.setItem('local_user', JSON.stringify(localUser));
      localStorage.setItem('local_profile', JSON.stringify(localProfile));
      
      return { user: localUser, profile: localProfile, error: null };
    } catch (error) {
      return {
        user: null,
        profile: null,
        error: error as Error,
      };
    }
  }

  // Supabase 模式注册
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName || '',
        },
      },
    });

    if (authError) {
      return { user: null, profile: null, error: authError };
    }

    // 如果邮箱确认已禁用，profile 会自动创建
    // 如果需要邮箱确认，profile 会在用户确认后创建
    let profile = null;
    if (authData.user) {
      profile = await getProfile(authData.user.id);
    }

    return { user: authData.user, profile, error: null };
  } catch (error) {
    return {
      user: null,
      profile: null,
      error: error as Error,
    };
  }
}

// 登出
export async function logout(): Promise<{ error: Error | null }> {
  if (isLocalMode) {
    // 本地模式登出
    localStorage.removeItem('local_user');
    localStorage.removeItem('local_profile');
    return { error: null };
  }

  // Supabase 模式登出
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return { error: error as Error };
  }
}

// 获取当前用户
export async function getCurrentUserProfile(): Promise<{ user: any; profile: Profile | null; error: Error | null }> {
  if (isLocalMode) {
    // 本地模式获取用户
    try {
      const localUserStr = localStorage.getItem('local_user');
      const localProfileStr = localStorage.getItem('local_profile');
      
      if (!localUserStr || !localProfileStr) {
        return { user: null, profile: null, error: null };
      }
      
      return { 
        user: JSON.parse(localUserStr), 
        profile: JSON.parse(localProfileStr), 
        error: null 
      };
    } catch (error) {
      return { user: null, profile: null, error: error as Error };
    }
  }

  // Supabase 模式获取用户
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { user: null, profile: null, error: new Error('No user found') };
    }

    const profile = await getProfile(user.id);

    return { user, profile, error: null };
  } catch (error) {
    return {
      user: null,
      profile: null,
      error: error as Error,
    };
  }
}

// 获取用户 profile
export async function getProfile(userId: string): Promise<Profile | null> {
  if (isLocalMode) {
    // 本地模式获取 profile
    try {
      const localProfileStr = localStorage.getItem('local_profile');
      if (localProfileStr) {
        return JSON.parse(localProfileStr);
      }
      return null;
    } catch (error) {
      console.error('Error fetching local profile:', error);
      return null;
    }
  }

  // Supabase 模式获取 profile
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

// 更新用户 profile
export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<{ profile: Profile | null; error: Error | null }> {
  if (isLocalMode) {
    // 本地模式更新 profile
    try {
      const localProfileStr = localStorage.getItem('local_profile');
      if (localProfileStr) {
        const localProfile = JSON.parse(localProfileStr);
        const updatedProfile = { ...localProfile, ...updates, updated_at: new Date().toISOString() };
        localStorage.setItem('local_profile', JSON.stringify(updatedProfile));
        return { profile: updatedProfile, error: null };
      }
      return { profile: null, error: new Error('Profile not found') };
    } catch (error) {
      return { profile: null, error: error as Error };
    }
  }

  // Supabase 模式更新 profile
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { profile: null, error };
    }

    return { profile: data, error: null };
  } catch (error) {
    return { profile: null, error: error as Error };
  }
}

// 更新用户冥想进度
export async function updateMeditationProgress(
  userId: string,
  duration: number
): Promise<{ profile: Profile | null; error: Error | null }> {
  try {
    // 先获取当前进度
    const currentProfile = await getProfile(userId);
    if (!currentProfile) {
      return { profile: null, error: new Error('Profile not found') };
    }

    // 更新总冥想时间
    const totalMinutes = currentProfile.total_meditation_minutes + duration;

    // 计算等级（每 100 分钟升一级）
    const newLevel = Math.floor(totalMinutes / 100) + 1;

    if (isLocalMode) {
      // 本地模式更新
      const updatedProfile = {
        ...currentProfile,
        total_meditation_minutes: totalMinutes,
        level: newLevel,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('local_profile', JSON.stringify(updatedProfile));
      return { profile: updatedProfile, error: null };
    }

    // Supabase 模式更新
    const { data, error } = await supabase
      .from('profiles')
      .update({
        total_meditation_minutes: totalMinutes,
        level: newLevel,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { profile: null, error };
    }

    return { profile: data, error: null };
  } catch (error) {
    return { profile: null, error: error as Error };
  }
}

// 更新连续打卡天数
export async function updateStreakDays(
  userId: string,
  increment: boolean = true
): Promise<{ profile: Profile | null; error: Error | null }> {
  try {
    const currentProfile = await getProfile(userId);
    if (!currentProfile) {
      return { profile: null, error: new Error('Profile not found') };
    }

    const newStreakDays = increment
      ? currentProfile.streak_days + 1
      : Math.max(0, currentProfile.streak_days - 1);

    if (isLocalMode) {
      // 本地模式更新
      const updatedProfile = {
        ...currentProfile,
        streak_days: newStreakDays,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('local_profile', JSON.stringify(updatedProfile));
      return { profile: updatedProfile, error: null };
    }

    // Supabase 模式更新
    const { data, error } = await supabase
      .from('profiles')
      .update({
        streak_days: newStreakDays,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { profile: null, error };
    }

    return { profile: data, error: null };
  } catch (error) {
    return { profile: null, error: error as Error };
  }
}

// 重置密码
export async function resetPassword(email: string): Promise<{ error: Error | null }> {
  if (isLocalMode) {
    // 本地模式不支持密码重置
    return { error: new Error('本地模式不支持密码重置') };
  }

  // Supabase 模式
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
}

// 更新密码
export async function updatePassword(newPassword: string): Promise<{ error: Error | null }> {
  if (isLocalMode) {
    // 本地模式不支持密码更新
    return { error: new Error('本地模式不支持密码更新') };
  }

  // Supabase 模式
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
}

// 监听认证状态变化
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  if (isLocalMode) {
    // 本地模式：直接调用回调
    try {
      const localUserStr = localStorage.getItem('local_user');
      if (localUserStr) {
        const localUser = JSON.parse(localUserStr);
        callback('SIGNED_IN', { user: localUser });
      }
    } catch (error) {
      console.error('Local auth state change error:', error);
    }
    
    // 返回一个 mock subscription 对象
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  
  // Supabase 模式
  return supabase.auth.onAuthStateChange(callback);
}