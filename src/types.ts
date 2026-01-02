// リクエストとレスポンスの型定義
export interface RecipeRequest {
    ingredients: string;
    memo: string;
    lifelines: string[];
    allergies: string[];
}

export interface RecipeResponse {
    result: string;
}

export interface ErrorResponse {
    error: string;
}
