 'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface User {
  number: number;
  username: string;
  email: string;
}

export default function EnzymeQuery() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 查询相关状态
  const [ecNumber, setEcNumber] = useState('');
  const [protId, setProtId] = useState('');
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // 检查用户是否已登录
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setLoading(false);
        } catch (e) {
          console.error('无法解析用户数据');
          redirectToLogin();
        }
      } else {
        redirectToLogin();
      }
    };
    
    checkLoginStatus();
  }, []);

  const redirectToLogin = () => {
    router.push('/login');
  };

  // 查询酶数据
  const searchEnzyme = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ecNumber && !protId) {
      setSearchError('请至少输入一个搜索条件');
      return;
    }
    
    setSearching(true);
    setSearchError('');
    
    try {
      // 获取JWT令牌
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:8080/api/enzyme/findKcat', {
        params: {
          ecNumber: ecNumber || undefined,
          protId: protId || undefined
        },
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('查询响应:', response.data);
      setQueryResults(response.data.records || []);
    } catch (error: any) {
      console.error('查询出错:', error);
      
      if (error.response) {
        console.error('错误状态:', error.response.status);
        console.error('错误数据:', error.response.data);
        
        if (error.response.status === 403) {
          setSearchError('权限不足，请确认您已登录');
        } else if (error.response.status === 401) {
          setSearchError('登录已过期，请重新登录');
          setTimeout(() => {
            handleLogout();
          }, 2000);
        } else {
          setSearchError(error.response.data?.error || '查询过程中出现错误');
        }
      } else {
        setSearchError('无法连接到服务器，请检查网络连接');
      }
      
      setQueryResults([]);
    } finally {
      setSearching(false);
    }
  };

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    redirectToLogin();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span 
                onClick={() => router.push('/')}
                className="text-xl font-semibold cursor-pointer"
              >
                酶动力学参数预测系统
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">欢迎，{user?.username}</span>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                返回首页
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                酶动力学参数查询
              </h2>
              <form onSubmit={searchEnzyme} className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="ecNumber" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      EC号
                    </label>
                    <input
                      type="text"
                      id="ecNumber"
                      value={ecNumber}
                      onChange={(e) => setEcNumber(e.target.value)}
                      placeholder="例如: 1.1.1.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="protId" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      蛋白ID
                    </label>
                    <input
                      type="text"
                      id="protId"
                      value={protId}
                      onChange={(e) => setProtId(e.target.value)}
                      placeholder="例如: P12345"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                {searchError && (
                  <div className="text-red-500 text-sm mb-4">
                    {searchError}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={searching}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:bg-indigo-300"
                >
                  {searching ? '查询中...' : '查询'}
                </button>
              </form>
              
              {/* 查询结果表格 */}
              {queryResults.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          EC号
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          蛋白ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          kcat值
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {queryResults.map((result, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.ecNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.protId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.kcat}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {queryResults.length === 0 && !searching && !searchError && (
                <p className="text-gray-500">请输入查询条件并点击查询按钮</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2024 酶动力学参数预测系统. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}