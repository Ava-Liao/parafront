'use client';

import { useState } from 'react';
import axios from 'axios';

interface EnzymeSearchProps {
  isLoggedIn: boolean;
}

export default function EnzymeSearch({ isLoggedIn }: EnzymeSearchProps) {
  const [ecNumber, setEcNumber] = useState('');
  const [protId, setProtId] = useState('');
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

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
      const response = await axios.get('http://localhost:8080/api/enzyme/findKcat', {
        params: {
          ecNumber: ecNumber || undefined,
          protId: protId || undefined
        }
      });
      
      setQueryResults(response.data.records || []);
    } catch (error: any) {
      console.error('查询出错:', error);
      setSearchError(error.response?.data?.error || '查询过程中出现错误');
      setQueryResults([]);
    } finally {
      setSearching(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              酶动力学参数查询
            </h2>
            <p className="text-gray-600 mb-4">
              请登录后使用此功能查询酶动力学参数
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
            >
              登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
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
                        {result.formattedKcat}
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
  );
} 