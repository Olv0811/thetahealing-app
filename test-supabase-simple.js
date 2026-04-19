// 简单的 Supabase 连接测试
const SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';

async function testConnection() {
    console.log('开始测试 Supabase 连接...');
    console.log('URL:', SUPABASE_URL);
    console.log('Key:', SUPABASE_KEY.substring(0, 20) + '...');

    // 测试 1: 简单的 ping 请求
    try {
        console.log('\n测试 1: 简单的 API 请求...');
        const start = Date.now();
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
            }
        });
        const duration = Date.now() - start;
        console.log(`响应时间: ${duration}ms`);
        console.log('响应状态:', response.status);
        console.log('响应头:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const data = await response.text();
            console.log('响应数据:', data);
        } else {
            console.log('响应错误:', await response.text());
        }
    } catch (error) {
        console.error('测试 1 失败:', error.message);
    }

    // 测试 2: 查询 profiles 表
    try {
        console.log('\n测试 2: 查询 profiles 表...');
        const start = Date.now();
        const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        const duration = Date.now() - start;
        console.log(`响应时间: ${duration}ms`);
        console.log('响应状态:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('响应数据:', data);
        } else {
            const error = await response.json();
            console.error('响应错误:', error);
        }
    } catch (error) {
        console.error('测试 2 失败:', error.message);
    }

    // 测试 3: 查询 journal_entries 表
    try {
        console.log('\n测试 3: 查询 journal_entries 表...');
        const start = Date.now();
        const response = await fetch(`${SUPABASE_URL}/rest/v1/journal_entries?select=id&limit=1`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        const duration = Date.now() - start;
        console.log(`响应时间: ${duration}ms`);
        console.log('响应状态:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('响应数据:', data);
        } else {
            const error = await response.json();
            console.error('响应错误:', error);
        }
    } catch (error) {
        console.error('测试 3 失败:', error.message);
    }

    // 测试 4: 获取认证状态
    try {
        console.log('\n测试 4: 获取认证状态...');
        const start = Date.now();
        const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        const duration = Date.now() - start;
        console.log(`响应时间: ${duration}ms`);
        console.log('响应状态:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('认证状态:', data);
        } else {
            const error = await response.json();
            console.error('认证错误:', error);
        }
    } catch (error) {
        console.error('测试 4 失败:', error.message);
    }

    console.log('\n测试完成！');
}

// 运行测试
testConnection().catch(console.error);