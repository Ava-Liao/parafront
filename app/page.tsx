'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";

type ModelType = 'UniKP' | 'DLTKcat';

interface ModelInfo {
  title: string;
  description: string;
  image: string;
}

export default function Home() {
  const router = useRouter();
  const [currentModel, setCurrentModel] = useState<ModelType>('UniKP'); // 默认显示UniKP模型

  const modelInfo: Record<ModelType, ModelInfo> = {
    UniKP: {
      title: 'UniKP 模型',
      description: '这是一个用于酶动力学参数预测的统一知识预训练模型。该模型通过整合多源数据和先验知识，提供了更准确的参数预测能力。',
      image: '/images/UniKP/UniKP_1.webp',
    },
    DLTKcat: {
      title: 'DLTKcat 模型',
      description: '这是一个专门用于预测酶促反应Kcat值的深度学习模型。该模型利用先进的深度学习技术，实现了高精度的Kcat预测。',
      image: '/images/DLTKcat/DLTKcat_1.jpeg',
    },
  };

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
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative h-96 w-full">
                <Image
                  src={modelInfo[currentModel].image}
                  alt={modelInfo[currentModel].title}
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
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
