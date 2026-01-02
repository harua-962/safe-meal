# Safe Meal Vision

災害時に限られた食材とライフラインで安全なレシピを提供するアプリケーションです。

## 機能

- 手元の食材からAIがレシピを提案
- ライフライン（電気・ガス・水）の利用可否を考慮
- アレルギー情報に基づいた安全なレシピ提案
- 災害時の防災ポイント付き

## セットアップ

### 方法1: ローカル環境での実行

#### 1. 依存関係のインストール
```bash
npm install
```

#### 2. 環境変数の設定
`.env.example`を`.env`にコピーして、Gemini API キーを設定してください。

```bash
cp .env.example .env
```

`.env`ファイルを編集:
```
GEMINI_API_KEY=あなたのAPIキー
PORT=3000
```

#### 3. アプリケーションの起動
```bash
npm run dev
```

#### 4. ブラウザでアクセス
```
http://localhost:3000
```

### 方法2: Dockerを使用した実行

#### 1. 環境変数の設定
`.env`ファイルにGemini API キーを設定してください。

#### 2. Docker Composeで起動
```bash
docker-compose up -d
```

#### 3. ブラウザでアクセス
```
http://localhost:3000
```

#### 停止
```bash
docker-compose down
```

## API エンドポイント

### GET /api/health

アプリケーションの状態を確認します。

**レスポンス:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-02T06:00:00.000Z",
  "version": "1.0.0"
}
```

### POST /api/recipe

災害時レシピを生成します。

**リクエスト:**
```json
{
  "ingredients": "パン, ツナ缶, トマト",
  "memo": "賞味期限切れのパンがあります",
  "lifelines": ["水"],
  "allergies": ["卵", "乳"]
}
```

**レスポンス:**
```json
{
  "result": "料理名: ツナトマトサンド\n材料: ...\n作り方: ..."
}
```

**エラーレスポンス:**
```json
{
  "error": "食材リストは必須です"
}
```

## 技術スタック

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **AI**: Google Gemini API

## セキュリティに関する注意

- `.env`ファイルは絶対にコミットしないでください
- 本番環境ではCORS設定を適切に制限してください
- API キーは安全に管理してください
