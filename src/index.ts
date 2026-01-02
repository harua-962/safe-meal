import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RecipeRequest, RecipeResponse, ErrorResponse } from './types';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 環境変数のバリデーション
const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey) {
    console.error('エラー:  GEMINI_API_KEYが設定されていません。. envファイルを確認してください。');
    process.exit(1);
}

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// CORS設定
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env. ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:3000'];

app. use((req, res, next) => {
    const origin = req. headers.origin;
    if (origin && (allowedOrigins. includes('*') || allowedOrigins.includes(origin))) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Methods', 'Content-Type');
    next();
});

// Gemini APIの準備 - より利用制限の緩いモデルに変更
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// 入力バリデーション関数
function validateRecipeRequest(body: any): { valid: boolean; error?: string } {
    if (!body.ingredients || typeof body.ingredients !== 'string' || body.ingredients.trim() === '') {
        return { valid:  false, error: '食材リストは必須です' };
    }
    
    if (! body.lifelines || !Array. isArray(body.lifelines) || body.lifelines.length === 0) {
        return { valid: false, error: '使えるライフラインを最低1つ選択してください' };
    }
    
    if (!Array.isArray(body.allergies)) {
        return { valid: false, error:  'アレルギー情報の形式が不正です' };
    }
    
    // 入力値のサニタイゼーション（基本的なチェック）
    const ingredientsLength = body.ingredients.trim().length;
    if (ingredientsLength > 1000) {
        return { valid: false, error:  '食材リストが長すぎます（1000文字以内）' };
    }
    
    return { valid:  true };
}

// ヘルスチェックエンドポイント
app.get('/api/health', (req:  Request, res: Response) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.post('/api/recipe', async (req: Request<{}, RecipeResponse | ErrorResponse, RecipeRequest>, res: Response<RecipeResponse | ErrorResponse>) => {
    try {
        // 入力バリデーション
        const validation = validateRecipeRequest(req. body);
        if (!validation. valid) {
            return res. status(400).json({ error: validation.error || '入力が不正です' });
        }

        const { ingredients, memo, lifelines, allergies } = req. body;

        const prompt = `
        以下の条件で災害時レシピを1つ提案してください。
        【食材】: ${ingredients.trim()}
        【メモ】: ${memo ? memo.trim() : 'なし'}
        【ライフライン】: ${lifelines.join(', ')}
        【アレルギー除去】: ${allergies.length > 0 ? allergies.join(', ') : 'なし'}
        
        以下の形式で出力してください:
        
        ## 料理名
        [料理名を太字で表示]
        
        ## 材料
        - [材料1]
        - [材料2]
        ...
        
        ## 作り方
        1. [手順1]
2. [手順2]
        ...
        
        ## 防災ポイント
        - [ポイント1]
        - [ポイント2]
        ...
        
        重要: 見出しは「##」を使い、リスト項目は「-」または数字を使って、読みやすく整理された形式で出力してください。
        `;

        const result = await model.generateContent(prompt);
        const response = await result. response;
        const text = response.text();
        
        res.json({ result: text });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console. error("APIエラー:", errorMessage);
        
        // エラーの種類に応じて適切なメッセージを返す
        if (errorMessage.includes('API_KEY')) {
            return res.status(500).json({ error: 'API設定エラーが発生しました。管理者に連絡してください。' });
        }
        
        res.status(500).json({ error: 'レシピ生成中にエラーが発生しました。もう一度お試しください。' });
    }
});

app.listen(port, () => {
    console.log(`サーバー起動: http://localhost:${port}`);
});
