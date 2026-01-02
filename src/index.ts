import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
// ★ここが重要：インストールした「標準版」の道具を使います
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// Gemini APIの準備
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ★モデル設定（gemini-1.5-flash）
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

app.post('/api/recipe', async (req, res) => {
    try {
        console.log("リクエスト:", req.body);
        const { ingredients, memo, lifelines, allergies } = req.body;

        const prompt = `
        以下の条件で災害時レシピを1つ提案して。
        【食材】: ${ingredients}
        【メモ】: ${memo}
        【ライフライン】: ${lifelines.join(', ')}
        【アレルギー除去】: ${allergies.join(', ')}
        
        出力: 料理名、材料、作り方、防災ポイント
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log("応答:", text);
        res.json({ result: text });

    } catch (error) {
        console.error("エラー:", error);
        res.status(500).json({ error: '生成失敗' });
    }
});

app.listen(port, () => {
    console.log(`サーバー起動: http://localhost:${port}`);
});