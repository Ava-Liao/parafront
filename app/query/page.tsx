'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  predictUniKP,
  predictDLTKcat,
  PredictionResult, 
  fetchEnzymeData, 
  savePredictionToDatabase
} from './api';

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
  const [smiles, setSmiles] = useState('');
  const [sub, setSub] = useState('');
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // UniKP模型预测相关状态
  const [uniSmiles, setUniSmiles] = useState('');
  const [uniSequences, setUniSequences] = useState('');
  const [uniPredictResults, setUniPredictResults] = useState<PredictionResult[]>([]);
  const [uniPredicting, setUniPredicting] = useState(false);
  const [uniPredictError, setUniPredictError] = useState('');
  
  // DLTKcat模型预测相关状态
  const [dltSmiles, setDltSmiles] = useState('');
  const [dltSequences, setDltSequences] = useState('');
  const [dltTemperature, setDltTemperature] = useState(25); // 默认温度为25℃
  const [dltPredictResults, setDltPredictResults] = useState<PredictionResult[]>([]);
  const [dltPredicting, setDltPredicting] = useState(false);
  const [dltPredictError, setDltPredictError] = useState('');

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

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    redirectToLogin();
  };

  // 合并两个模型的预测结果用于显示
  const allPredictResults = [...uniPredictResults, ...dltPredictResults];

  // 处理搜索表达提交
  const handleSearch = async(e:React.FormEvent) => {
    e.preventDefault();
    await fetchEnzymeData(
      { sub, smiles },
      setSearching,
      setSearchError,
      setQueryResults,
      redirectToLogin
    );
  };

  // 渲染数据来源
  const renderDataSource = (predicted:number) => {
    switch(predicted){
      case 0:
        return "实验数据";
      case 1:
        return "UniKP预测";
      case 2:
        return "DLTKcat预测";
      default:
        return `其他来源(${predicted})`;
    }
  }

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
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                酶动力学参数查询
              </h2>
              <form onSubmit={handleSearch} className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                  <div>
                    <label htmlFor="smiles" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      底物结构 (SMILES)
                    </label>
                    <input
                      type="text"
                      id="smiles"
                      value={smiles}
                      onChange={(e) => setSmiles(e.target.value)}
                      placeholder="例如: C1=CC=C(C(=C1)O)O"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">输入SMILES格式的底物结构进行精确查询</p>
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
                          底物名称
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          底物结构
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          kcat值
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          数据来源
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {queryResults.map((result, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.sub||'-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.smiles || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.formattedKcat || result.kcat}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderDataSource(result.predicted)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {queryResults.length === 0 && !searching && !searchError && (
                 <p className="py-3 text-gray-500">请输入底物名称或底物结构并点击查询按钮</p>
              )}
            </div>
          </div>

          {/* 预测模块 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* UniKP模型预测 */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  UniKP模型预测
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  该模型只需要SMILES结构和氨基酸序列进行预测
                </p>
                <form onSubmit={predictUniKP(uniSmiles, uniSequences, setUniPredicting, setUniPredictError, setUniPredictResults)} className="mb-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="uniSmiles" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        底物结构 (SMILES)
                      </label>
                      <input
                        type="text"
                        id="uniSmiles"
                        value={uniSmiles}
                        onChange={(e) => setUniSmiles(e.target.value)}
                        placeholder="例如: C1=CC=C(C(=C1)O)O"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="uniSequences" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        氨基酸序列
                      </label>
                      <input
                        type="text"
                        id="uniSequences"
                        value={uniSequences}
                        onChange={(e) => setUniSequences(e.target.value)}
                        placeholder="输入蛋白质氨基酸序列"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                  
                  {uniPredictError && (
                    <div className="text-red-500 text-sm mt-2 mb-2">
                      {uniPredictError}
                    </div>
                  )}

                  <div className="mt-4">
                    <button
                      type="submit"
                      disabled={uniPredicting}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-blue-300"
                    >
                      {uniPredicting ? '预测中...' : '使用UniKP模型预测'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* DLTKcat模型预测 */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  DLTKcat模型预测
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  该模型需要SMILES结构、氨基酸序列和温度参数进行预测
                </p>
                <form onSubmit={predictDLTKcat(dltSmiles, dltSequences, dltTemperature, setDltPredicting, setDltPredictError, setDltPredictResults)} className="mb-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="dltSmiles" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        底物结构 (SMILES)
                      </label>
                      <input
                        type="text"
                        id="dltSmiles"
                        value={dltSmiles}
                        onChange={(e) => setDltSmiles(e.target.value)}
                        placeholder="例如: CCO"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="dltSequences" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        氨基酸序列
                      </label>
                      <input
                        type="text"
                        id="dltSequences"
                        value={dltSequences}
                        onChange={(e) => setDltSequences(e.target.value)}
                        placeholder="输入蛋白质氨基酸序列"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="dltTemperature" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        温度 (°C)
                      </label>
                      <input
                        type="number"
                        id="dltTemperature"
                        value={dltTemperature}
                        onChange={(e) => setDltTemperature(Number(e.target.value))}
                        placeholder="例如: 25"
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                  
                  {dltPredictError && (
                    <div className="text-red-500 text-sm mt-2 mb-2">
                      {dltPredictError}
                    </div>
                  )}

                  <div className="mt-4">
                    <button
                      type="submit"
                      disabled={dltPredicting}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:bg-green-300"
                    >
                      {dltPredicting ? '预测中...' : '使用DLTKcat模型预测'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* 预测结果表格 */}
          {allPredictResults.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mt-8">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  预测结果
                </h2>
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
                          温度(°C)
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          预测模型
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          数据来源标记
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allPredictResults.map((result, index) => (
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
                            {result.temperature || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              result.model === 'UniKP' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {result.model}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.predicted} {/* 显示预测标记值 */}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => savePredictionToDatabase(result)}
                              className="px-3 py-1 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md"
                            >
                              保存到数据库
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {allPredictResults.length === 0 && !(uniPredicting || dltPredicting) && !(uniPredictError || dltPredictError) && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mt-8 p-6">
              <p className="py-3 text-gray-500 text-center">请在对应模型下输入参数并点击预测按钮</p>
            </div>
          )}
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-50 mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2025 酶动力学参数预测系统. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}