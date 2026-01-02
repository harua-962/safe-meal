document.addEventListener('DOMContentLoaded', () => {
    // 要素取得
    const analyzeBtn = document.getElementById('analyze-btn');
    const buttonText = document.getElementById('button-text');
    const ingredientsInput = document.getElementById('ingredientsInput');
    const ingredientsMemo = document.getElementById('ingredientsMemo');
    const lifelineBtns = document.querySelectorAll('#lifelines .toggle-btn');
    const allergyBtns = document.querySelectorAll('#allergies .toggle-btn');
    const otherAllergy = document.getElementById('otherAllergy');
    const resultCard = document.getElementById('resultCard');
    const resultContent = document.getElementById('resultContent');

    // ボタンactive切り替え
    lifelineBtns.forEach(btn => {
        btn.addEventListener('click', () => btn.classList.toggle('active'));
    });
    allergyBtns.forEach(btn => {
        btn.addEventListener('click', () => btn.classList.toggle('active'));
    });

    //ここからがAIに送信する処理
    analyzeBtn.addEventListener('click', async () => {
        // 入力値の取得と整形
        const rawInput = ingredientsInput.value. trim();
        
        // 改行で分割して、空行やスペースのみの行を除去し、カンマ区切りに変換
        const ingredients = rawInput
            .split('\n')
            .map(line => line.trim())
            .filter(line => line. length > 0)
            .join(', ');
        
        const memo = ingredientsMemo.value.trim();
        
        const lifelines = Array.from(lifelineBtns)
            .filter(btn => btn.classList.contains('active'))
            .map(btn => btn.dataset.value);
            
        const allergies = [
            ...Array.from(allergyBtns)
                .filter(btn => btn.classList. contains('active'))
                .map(btn => btn.dataset.value),
            ...(otherAllergy.value. trim() ? [otherAllergy.value.trim()] : []),
        ];

        // 必須チェック
        if (!ingredients || lifelines.length === 0) {
            alert("食材と、使えるライフライン(最低1つ)は必須です！");
            return;
        }

        // 画面を「考え中」モードにする
        analyzeBtn.disabled = true;
        buttonText.innerText = "AIシェフが思考中...  🧑‍🍳";
        resultCard.style.display = 'none';

        try {
            // サーバーにデータを送る
            const response = await fetch('/api/recipe', {  // 送信先URL
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ingredients,
                    memo,
                    lifelines,
                    allergies
                })
            });

            const data = await response. json();

            if (! response.ok || data.error) {
                // サーバーからのエラーメッセージを表示
                alert("エラー: " + (data.error || "レシピの生成に失敗しました"));
            } else {
                // HTMLエスケープ関数（XSS対策）
                function escapeHtml(text) {
                    const div = document.createElement('div');
                    div.textContent = text;
                    return div.innerHTML;
                }
                
                // 結果を表示する - マークダウン形式を簡易的にHTMLに変換
                // まずHTMLエスケープしてから、安全なマークダウン変換を適用
                let formattedResult = escapeHtml(data.result)
                    // ## 見出しを太字の大きな見出しに変換
                    .replace(/^## (.+)$/gm, '<h3 style="color:#ff6b6b; font-size:1.3em; margin-top:20px; margin-bottom:10px; border-bottom:2px solid #ff6b6b; padding-bottom:5px;">$1</h3>')
                    // リスト項目を変換（番号付き）
                    .replace(/^(\d+)\. (.+)$/gm, '<div style="margin-left:20px; margin-bottom:8px;"><strong>$1.</strong> $2</div>')
                    // リスト項目を変換（箇条書き）
                    .replace(/^- (.+)$/gm, '<div style="margin-left:20px; margin-bottom:8px;">• $1</div>')
                    // 改行を保持
                    .replace(/\n/g, '<br>');
                
                resultContent.innerHTML = `
                    <h2 style="color:#ff6b6b; border-bottom:2px solid #ff6b6b; padding-bottom:10px; margin-bottom:20px;">🍳 提案レシピ</h2>
                    <div style="line-height: 1.8;">${formattedResult}</div>
                `;
                resultCard.style.display = 'block';
            }

        } catch (error) {
            console.error(error);
            alert("ネットワークエラーが発生しました。インターネット接続を確認してください。");
        } finally {
            // ボタンを元に戻す
            analyzeBtn.disabled = false;
            buttonText.innerText = "この条件でレシピを聞く 🍳";
        }
    });
});
