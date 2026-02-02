/**
 * Vercel Serverless Function
 * API 代理：隐藏真实的 API Key
 *
 * 请求流程：浏览器 -> /api/chat -> 硅基流动 API
 * 密钥只存在于服务器端，用户无法获取
 */

export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 从环境变量获取 API Key
  const apiKey = process.env.SILICONFLOW_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key not configured' });
  }

  try {
    // 转发请求到硅基流动
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // 返回响应
    return res.status(response.status).json(data);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch AI response' });
  }
}
