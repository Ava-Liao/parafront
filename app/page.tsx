'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";

type ModelType = 'UniKP' | 'DLTKcat';

interface ModelInfo {
  title: string;
  description: string;
  image: string;
}

interface User {
  number: number;
  username: string;
  email: string;
}

export default function Home() {
  const router = useRouter();
  const [currentModel, setCurrentModel] = useState<ModelType>('UniKP'); // 默认显示UniKP模型
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 检查用户是否已登录
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('无法解析用户数据');
        }
      }
      
      setLoading(false);
    };
    
    checkLoginStatus();
  }, []);

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // 跳转到查询页面
  const goToQuery = () => {
    router.push('/query');
  };

  const modelInfo: Record<ModelType, ModelInfo> = {
    UniKP: {
      title: 'UniKP 模型',
      description: '基于预训练模型和机器学习模型的酶动力学预测框架。该框架仅通过给定酶的氨基酸序列和底物结构信息实现预测酶动力学参数',
      image: '/images/UniKP/UniKP_1.webp',
    },
    DLTKcat: {
      title: 'DLTKcat 模型',
      description: '双向注意力CPI深度学习模型,考虑温度对酶动力学参数的影响。该模型的数据集里增加温度值再利用模型提取特征进而预测kcat值。',
      image: '/images/DLTKcat/DLTKcat_1.jpeg',
    },
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
              <span className="text-xl font-semibold">酶动力学参数预测系统</span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-700">欢迎，{user.username}</span>
                  <button
                    onClick={goToQuery}
                    className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-gray-100 rounded-md"
                  >
                    查询和预测系统
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    退出登录
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/login')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    登录
                  </button>
                  <button
                    onClick={() => router.push('/register')}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    注册
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            欢迎使用酶动力学参数预测系统
          </h1>

          {/* 模型选择按钮 */}
          <div className="flex justify-center space-x-4 mb-8">
            <button
              onClick={() => setCurrentModel('UniKP')}
              className={`px-6 py-3 text-sm font-medium rounded-md ${
                currentModel === 'UniKP'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              UniKP
            </button>
            <button
              onClick={() => setCurrentModel('DLTKcat')}
              className={`px-6 py-3 text-sm font-medium rounded-md ${
                currentModel === 'DLTKcat'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              DLTKcat
            </button>
          </div>

          {/* 模型展示区域 */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative h-96 w-full">
                <Image
                  src={modelInfo[currentModel].image}
                  alt={modelInfo[currentModel].title}
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                  quality={100}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {modelInfo[currentModel].title}
                </h2>
                <p className="text-gray-600">
                  {modelInfo[currentModel].description}
                </p>
              </div>
            </div>
          </div>

          {/* 模型评估 */}
          <div className="max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                数据分布
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">UniKP 数据分布</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      UniKP模型训练数据的分布情况，展示了kcat值的分布范围和频率。
                    </p>
                    <div className="relative h-64 w-full">
                      <Image 
                        src="/images/unikpdis.png"
                        alt="UniKP 数据分布图"
                        fill
                        style={{ objectFit: 'contain' }}
                        priority
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">DLTKcat 数据分布</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      DLTKcat模型训练数据的分布情况，显示了不同kcat值区间的数据频次。
                    </p>
                    <div className="relative h-64 w-full">
                      <Image 
                        src="/images/dltkcatdis.png"
                        alt="DLTKcat 数据分布图"
                        fill
                        style={{ objectFit: 'contain' }}
                        priority
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              模型性能
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">决定系数(R²)比较</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    R²值越接近1，表示模型解释的数据变异性越高，预测性能越好。
                  </p>
                  <div className="relative h-64 w-full">
                    <Image 
                      src="/images/r2.png"
                      alt="R² 比较图"
                      fill
                      style={{ objectFit: 'contain' }}
                      priority
                    />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">均方根误差(RMSE)比较</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    RMSE值越低，表示模型预测结果与实际值的偏差越小，预测性能越好。
                  </p>
                  <div className="relative h-64 w-full">
                    <Image 
                      src="/images/rmse.png"
                      alt="RMSE 比较图"
                      fill
                      style={{ objectFit: 'contain' }}
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white rounded-lg shadow-lg">
              <p className="text-gray-700">
                从上述图表可以看出，UniKP模型在R²和RMSE指标上均优于DLTKcat模型，表明UniKP模型具有更高的预测精度和更低的预测误差。
              </p>
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