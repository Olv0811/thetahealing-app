import { createClient, type AuthChangeEvent, type Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 检查配置是否有效
const isValidConfig = supabaseUrl && 
                      supabaseAnonKey && 
                      supabaseUrl !== 'your_supabase_project_url' &&
                      supabaseAnonKey !== 'your_supabase_anon_key';

// Mock Supabase 客户端（用于本地模式）
const createMockSupabaseClient = () => {
  const mockAuth = {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: null, error: { message: '本地模式，认证功能已禁用' } }),
    signUp: async () => ({ data: null, error: { message: '本地模式，注册功能已禁用' } }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: (callback: any) => {
      // 模拟本地用户状态
      const localUser = localStorage.getItem('local_user');
      if (localUser) {
        callback('SIGNED_IN', JSON.parse(localUser));
      }
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    updateUser: async () => ({ data: { user: null }, error: { message: '本地模式' } }),
    resetPasswordForEmail: async () => ({ error: null }),
  };

  const mockDb = {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null })
          }),
          single: () => Promise.resolve({ data: null, error: null })
        })
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: { message: '本地模式' } })
        })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: '本地模式' } })
          })
        })
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null })
      })
    })
  };

  return {
    auth: mockAuth,
    from: mockDb.from,
  };
};

// 创建真实的或 mock 客户端
let supabase: any;

if (isValidConfig) {
  console.log('Supabase 客户端初始化...');
  console.log('URL:', supabaseUrl);
  console.log('Anon Key:', supabaseAnonKey.substring(0, 20) + '...');

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  });
} else {
  console.log('使用本地模式（Supabase 未配置）');
  supabase = createMockSupabaseClient();
}

export { supabase };

// 类型安全的表查询辅助函数
export function from<T = any>(table: string) {
  return supabase.from(table);
}

// 检查是否为本地模式
const isLocalMode = !isValidConfig;

// 获取当前用户
export async function getCurrentUser() {
  if (isLocalMode) {
    // 本地模式获取用户
    try {
      const localUserStr = localStorage.getItem('local_user');
      if (localUserStr) {
        return JSON.parse(localUserStr);
      }
      return null;
    } catch (error) {
      console.error('Error getting local user:', error);
      return null;
    }
  }

  // Supabase 模式获取用户
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting user:', error);
    return null;
  }

  return user;
}

// 获取当前会话
export async function getCurrentSession() {
  if (isLocalMode) {
    // 本地模式获取会话
    try {
      const localUserStr = localStorage.getItem('local_user');
      if (localUserStr) {
        const user = JSON.parse(localUserStr);
        return { user, access_token: 'local_token' };
      }
      return null;
    } catch (error) {
      console.error('Error getting local session:', error);
      return null;
    }
  }

  // Supabase 模式获取会话
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session:', error);
    return null;
  }

  return session;
}

// 监听认证状态变化
export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  if (isLocalMode) {
    // 本地模式监听
    try {
      const localUserStr = localStorage.getItem('local_user');
      if (localUserStr) {
        const user = JSON.parse(localUserStr);
        callback('SIGNED_IN', { user, access_token: 'local_token' });
      } else {
        callback('SIGNED_OUT', null);
      }
    } catch (error) {
      console.error('Local auth state change error:', error);
      callback('SIGNED_OUT', null);
    }
    
    // 返回 mock subscription
    return { data: { subscription: { unsubscribe: () => {} } } } as any;
  }

  // Supabase 模式监听
  return supabase.auth.onAuthStateChange(callback) as any;
}