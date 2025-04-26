import axios from 'axios';

// 定义预测结果接口
export interface PredictionResult {
  sub: string;
  smiles: string;
  sequences: string;
  kcat: number;
  temperature?: number;
  formattedKcat?: string | null;
  predicted: number;
  model: string;
}

// 根据SMILES从PubChem查询底物名称
export const fetchSubstrateNameBySmiles = async (smiles: string): Promise<string | null> => {
  try {
    const response = await axios.get(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/property/Title/JSON`
    );
    
    // 检查是否有有效的结果
    if (response.data?.PropertyTable?.Properties?.[0]?.Title) {
      return response.data.PropertyTable.Properties[0].Title;
    }
    return null;
  } catch (error) {
    console.error('从PubChem获取底物名称失败:', error);
    return null;
  }
};

// 查询酶数据的底层API调用
export const fetchEnzymeData = async (
  params: {
    sub?: string;
    smiles?: string;
  },
  setSearching: (value: boolean) => void,
  setSearchError: (value: string) => void,
  setQueryResults: (value: any[]) => void,
  onAuthError?: () => void
) => {
  // 检查是否有任何条件
  if (!params.sub && !params.smiles) {
    setSearchError('请至少输入底物名称或底物结构');
    return;
  }
  
  setSearching(true);
  setSearchError('');
  
  try {
    // 获取JWT令牌
    const token = localStorage.getItem('token');
    
    const response = await axios.get('http://localhost:8080/api/enzyme/findKcat', {
      params: {
        sub: params.sub || undefined,
        smiles: params.smiles || undefined
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
        if (onAuthError) {
          setTimeout(() => {
            onAuthError();
          }, 2000);
        }
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

// UniKP模型预测的底层API调用
export const fetchUniKPPrediction = async (
  uniSmiles: string,
  uniSequences: string,
  setUniPredicting: (value: boolean) => void,
  setUniPredictError: (value: string) => void,
  setUniPredictResults: (value: PredictionResult[]) => void
) => {
  if (!uniSmiles || !uniSequences) {
    setUniPredictError('SMILES结构和氨基酸序列必须输入');
    return;
  }

  setUniPredicting(true);
  setUniPredictError('');

  try {
    // 构建请求数据
    const requestData = {
      substrate_smiles: uniSmiles,
      protein_sequence: uniSequences
    };

    // 尝试从PubChem获取底物名称
    let substrateName = 'UniKP预测';
    try {
      const pubchemName = await fetchSubstrateNameBySmiles(uniSmiles);
      if (pubchemName) {
        substrateName = pubchemName;
      }
    } catch (nameError) {
      console.error('获取底物名称失败:', nameError);
      // 失败时继续使用默认名称
    }

    // 调用UniKP预测API
    const response = await axios.post('http://localhost:3501/predict_kcat', 
      requestData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('UniKP预测响应:', response.data);
    
    if (response.data) {
      setUniPredictResults([{
        sub: substrateName,
        smiles: uniSmiles,
        sequences: uniSequences,
        kcat: response.data.kcat_value,
        formattedKcat: response.data.kcat_value ? response.data.kcat_value.toFixed(4) : null,
        predicted: 1, // UniKP模型预测标记为1
        model: 'UniKP'
      }]);
    } else {
      setUniPredictResults([]);
    }
  } catch (error: any) {
    console.error('UniKP预测出错:', error);

    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', error.response.data);
      setUniPredictError(error.response.data?.error || '预测过程中出现错误');
    } else {
      setUniPredictError('无法连接到服务器，请检查网络连接');
    }

    setUniPredictResults([]);
  } finally {
    setUniPredicting(false);
  }
};

// 为表单处理封装的UniKP预测函数
export const predictUniKP = (
  uniSmiles: string,
  uniSequences: string,
  setUniPredicting: (value: boolean) => void,
  setUniPredictError: (value: string) => void,
  setUniPredictResults: (value: PredictionResult[]) => void
) => {
  return (e: React.FormEvent) => {
    e.preventDefault();
    fetchUniKPPrediction(uniSmiles, uniSequences, setUniPredicting, setUniPredictError, setUniPredictResults);
  };
};

// DLTKcat模型预测的底层API调用
export const fetchDLTKcatPrediction = async (
  dltSmiles: string, 
  dltSequences: string,
  dltTemperature: number,
  setDltPredicting: (value: boolean) => void,
  setDltPredictError: (value: string) => void,
  setDltPredictResults: (value: PredictionResult[]) => void
) => {
  if (!dltSmiles || !dltSequences) {
    setDltPredictError('SMILES结构和氨基酸序列必须输入');
    return;
  }

  setDltPredicting(true);
  setDltPredictError('');

  try {
    // 构建请求数据
    const requestData = {
      smiles: dltSmiles,
      seq: dltSequences,
      temperature_celsius: dltTemperature
    };

    // 尝试从PubChem获取底物名称
    let substrateName = 'DLTKcat预测';
    try {
      const pubchemName = await fetchSubstrateNameBySmiles(dltSmiles);
      if (pubchemName) {
        substrateName = pubchemName;
      }
    } catch (nameError) {
      console.error('获取底物名称失败:', nameError);
      // 失败时继续使用默认名称
    }

    // 调用DLTKcat预测API
    const response = await axios.post('http://localhost:3502/predict', 
      requestData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('DLTKcat预测响应:', response.data);
    
    if (response.data) {
      setDltPredictResults([{
        sub: substrateName,
        smiles: dltSmiles,
        sequences: dltSequences,
        temperature: dltTemperature,
        kcat: response.data.kcat,
        formattedKcat: response.data.kcat ? response.data.kcat.toFixed(4) : null,
        predicted: 2, // DLTKcat模型预测标记为2
        model: 'DLTKcat'
      }]);
    } else {
      setDltPredictResults([]);
    }
  } catch (error: any) {
    console.error('DLTKcat预测出错:', error);

    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', error.response.data);
      setDltPredictError(error.response.data?.error || '预测过程中出现错误');
    } else {
      setDltPredictError('无法连接到服务器，请检查网络连接');
    }

    setDltPredictResults([]);
  } finally {
    setDltPredicting(false);
  }
};

// 为表单处理封装的DLTKcat预测函数
export const predictDLTKcat = (
  dltSmiles: string, 
  dltSequences: string,
  dltTemperature: number,
  setDltPredicting: (value: boolean) => void,
  setDltPredictError: (value: string) => void,
  setDltPredictResults: (value: PredictionResult[]) => void
) => {
  return (e: React.FormEvent) => {
    e.preventDefault();
    fetchDLTKcatPrediction(dltSmiles, dltSequences, dltTemperature, setDltPredicting, setDltPredictError, setDltPredictResults);
  };
};

// 保存预测结果到数据库
export const savePredictionToDatabase = async (result: PredictionResult) => {
  try {
    // 获取JWT令牌，用于身份验证
    const token = localStorage.getItem('token');
    
    // 如果没有底物名称但有SMILES，尝试从PubChem获取底物名称
    let subName = result.sub;
    if ((!subName || subName === 'UniKP预测' || subName === 'DLTKcat预测') && result.smiles) {
      const pubchemName = await fetchSubstrateNameBySmiles(result.smiles);
      if (pubchemName) {
        subName = pubchemName;
      }
    }
    
    // 构建要保存的酶数据 - 保持predicted字段的值，不再统一设为1
    const enzymeData = {
      sub: subName,
      smiles: result.smiles,
      sequences: result.sequences,
      kcat: result.kcat,
      temperature: result.temperature,
      predicted: result.predicted // 使用结果中的predicted值，不再统一设为1
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