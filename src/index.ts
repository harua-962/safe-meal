import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RecipeRequest, RecipeResponse, ErrorResponse } from './types';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 環境変数のバリデーション
if (!process.env.GEMINI_API_KEY) {
    console.error('エラー: GEMINI_API_KEYが設定されていません。.envファイルを確認してください。');
    process.exit(1);
}

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// CORS設定（本番環境では適切なオリジンに制限すること）
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Gemini APIの準備
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// 入力バリデーション関数
function validateRecipeRequest(body: any): { valid: boolean; error?: string } {
    if (!body.ingredients || typeof body.ingredients !== 'string' || body.ingredients.trim() === '') {
        return { valid: false, error: '食材リストは必須です' };
    }
    
    if (!body.lifelines || !Array.isArray(body.lifelines) || body.lifelines.length === 0) {
        return { valid: false, error: '使えるライフラインを最低1つ選択してください' };
    }
    
    if (!Array.isArray(body.allergies)) {
        return { valid: false, error: 'アレルギー情報の形式が不正です' };
    }
    
    // 入力値のサニタイゼーション（基本的なチェック）
    const ingredientsLength = body.ingredients.trim().length;
    if (ingredientsLength > 1000) {
        return { valid: false, error: '食材リストが長すぎます（1000文字以内）' };
    }
    
    return { valid: true };
}

app.post('/api/recipe', async (req: Request<{}, RecipeResponse | ErrorResponse, RecipeRequest>, res: Response<RecipeResponse | ErrorResponse>) => {
    try {
        // 入力バリデーション
        const validation = validateRecipeRequest(req.body);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error || '入力が不正です' });
        }

        const { ingredients, memo, lifelines, allergies } = req.body;

        const prompt = `
        以下の条件で災害時レシピを1つ提案して。
        【食材】: ${ingredients.trim()}
        【メモ】: ${memo ? memo.trim() : 'なし'}
        【ライフライン】: ${lifelines.join(', ')}
        【アレルギー除去】: ${allergies.length > 0 ? allergies.join(', ') : 'なし'}
        
        出力: 料理名、材料、作り方、防災ポイント
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        res.json({ result: text });

    } catch (error: any) {
        console.error("APIエラー:", error.message);
        
        // エラーの種類に応じて適切なメッセージを返す
        if (error.message?.includes('API_KEY')) {
            return res.status(500).json({ error: 'API設定エラーが発生しました。管理者に連絡してください。' });
        }
        
        res.status(500).json({ error: 'レシピ生成中にエラーが発生しました。もう一度お試しください。' });
    }
});

app.listen(port, () => {
    console.log(`サーバー起動: http://localhost:${port}`);
});