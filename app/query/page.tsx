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
  const [sub, setSub] = useState('');
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  // 预测相关状态
  const [smiles,setSmiles] = useState('');
  const [sequences,setSequences] = useState('');
  const [subName, setSubName] = useState('');
  const [predictResults,setPredictResults] = useState<any[]>([]);
  const [predicting,setPredicting] = useState(false);
  const [predictError,setPredictError] = useState('');

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
    
    if (!ecNumber && !protId && !sub) {
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
          protId: protId || undefined,
          sub: sub || undefined
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

  
  // 预测kcat
  const predictKcat = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!smiles || !sequences || !subName) {
      setPredictError('底物名称、SMILES结构和氨基酸序列都必须输入');
      return;
    }

    setPredicting(true);
    setPredictError('');

    try {
      // 构建请求数据 - 改为JSON格式
      const requestData = {
        substrate_name: subName,
        substrate_smiles: smiles,
        protein_sequence: sequences
      };

      // 通过Next.js API路由调用预测API - 解决CORS问题
      const response = await axios.post('http://localhost:3500/predict_kcat', 
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('预测响应:', response.data);
      
      if (response.data) {
        // 转换为数组格式以便复用结果显示组件
        setPredictResults([{
          sub: subName,
          smiles: smiles,
          sequences: sequences,
          kcat: response.data.kcat_value, // 修正字段名
          formattedKcat: response.data.kcat_value ? response.data.kcat_value.toFixed(4) : null,
          predicted: 1
        }]);
      } else {
        setPredictResults([]);
      }
    } catch (error: any) {
      console.error('预测出错:', error);

      if (error.response) {
        console.error('错误状态:', error.response.status);
        console.error('错误数据:', error.response.data);
        setPredictError(error.response.data?.error || '预测过程中出现错误');
      } else {
        setPredictError('无法连接到服务器，请检查网络连接');
      }

      setPredictResults([]);
    } finally {
      setPredicting(false);
    }
  };

  // 保存预测结果到数据库
  const savePredictionToDatabase = async (result: any) => {
    try {
      // 获取JWT令牌，用于身份验证
      const token = localStorage.getItem('token');
      
      // 构建要保存的酶数据（不再要求EC号和蛋白ID）
      const enzymeData = {
        sub: result.sub,
        smiles: result.smiles,
        sequences: result.sequences,
        kcat: result.kcat,
        predicted: 1 // 标记为预测值
      };
      
      // 发送请求保存到数据库
      const response = await axios.post('http://localhost:8080/api/enzyme/save', 
        enzymeData,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 200 || response.status === 201) {
        alert(`预测结果已成功保存到数据库！ID: ${response.data.id}`);
      }
    } catch (error: any) {
      console.error('保存到数据库失败:', error);
      alert('保存到数据库失败: ' + (error.response?.data?.error || error.message || '未知错误'));
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                  <div>
                    <label htmlFor="sub" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      底物名称
                    </label>
                    <input
                      type="text"
                      id="sub"
                      value={sub}
                      onChange={(e) => setSub(e.target.value)}
                      placeholder="例如: Glucose"
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
                          底物名称
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          kcat值
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          是否为预测值
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
                            {result.sub || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.formattedKcat || result.kcat}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.predicted || result.predicted}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {queryResults.length === 0 && !searching && !searchError && (
                <p className="py-3 text-gray-500">请输入查询条件并点击查询按钮</p>
              )}
              <hr className="my-8 border-t-2 border-dashed border-gray-200" />

              <h2 className=" text-2xl font-bold text-gray-900 mb-4">
                酶动力学参数预测
              </h2>
              <form onSubmit={predictKcat} className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label htmlFor="subName" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      底物名称
                    </label>
                    <input
                        type="text"
                        id="subName"
                        value={subName}
                        onChange={(e) => setSubName(e.target.value)}
                        placeholder="例如: Catechol"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="smiles" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      底物结构
                    </label>
                    <input
                        type="text"
                        id="smiles"
                        value={smiles}
                        onChange={(e) => setSmiles(e.target.value)}
                        placeholder="输入底物结构"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="sequences" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      氨基酸序列
                    </label>
                    <input
                        type="text"
                        id="sequences"
                        value={sequences}
                        onChange={(e) => setSequences(e.target.value)}
                        placeholder="输入蛋白质氨基酸序列"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                {predictError && (
                    <div className="text-red-500 text-sm mb-4">
                      {predictError}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={predicting}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:bg-indigo-300"
                >
                  {predicting ? '预测中...' : '预测'}
                </button>
              </form>

              {/* 预测结果表格 */}
              {predictResults.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          底物名称
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          底物结构
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          氨基酸序列
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          预测kcat值
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          是否为预测值
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                      {predictResults.map((result, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs overflow-hidden text-ellipsis">
                              {result.sub}
                            </td>
                            <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs overflow-hidden text-ellipsis">
                              {result.smiles}
                            </td>
                            <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs overflow-hidden text-ellipsis">
                              {result.sequences}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {result.formattedKcat || result.kcat}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {result.predicted === 1 ? '预测值' : '实验值'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => savePredictionToDatabase(result)}
                                className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                              >
                                保存到数据库
                              </button>
                            </td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
              )}

              {predictResults.length === 0 && !predicting && !predictError && (
                  <p className="py-3 text-gray-500">请输入底物结构和氨基酸序列并点击预测按钮</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2025 酶动力学参数预测系统. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}