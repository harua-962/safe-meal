document.addEventListener('DOMContentLoaded', () => {
    // 要素取得
    const inputPage = document.getElementById('inputPage');
    const resultPage = document.getElementById('resultPage');
    const analyzeBtn = document.getElementById('analyze-btn');
    const buttonText = document.getElementById('button-text');
    const backBtn = document.getElementById('back-btn');
    const ingredientsInput = document.getElementById('ingredientsInput');
    const ingredientsMemo = document.getElementById('ingredientsMemo');
    const lifelineBtns = document.querySelectorAll('#lifelines .toggle-btn');
    const allergyBtns = document.querySelectorAll('#allergies .toggle-btn');
    const otherAllergy = document.getElementById('otherAllergy');
    const resultContent = document.getElementById('resultContent');

    // 現在のレシピテキストを保存する変数
    let currentRecipeText = '';
    let currentIngredients = '';

    // ページ切り替え関数
    function scrollToTop() {
        // ページ切り替え時に確実にトップにスクロール
        requestAnimationFrame(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        });
    }

    function showInputPage() {
        inputPage.classList.add('active');
        resultPage.classList.remove('active');
        scrollToTop();
    }

    function showResultPage() {
        inputPage.classList.remove('active');
        resultPage.classList.add('active');
        scrollToTop();
    }

    // SNS共有URL生成関数
    function updateShareButtons() {
        const lineShareBtn = document.getElementById('lineShareBtn');
        const twitterShareBtn = document.getElementById('twitterShareBtn');
        
        // ボタンが存在するか確認
        if (! lineShareBtn || !twitterShareBtn) {
            console.error('共有ボタンが見つかりません');
            return;
        }
        
        const appUrl = window.location.origin;
        
        // 共有用のテキストを生成（最初の100文字程度）
        const recipeTitle = currentRecipeText.split('\n')[0] || '災害時レシピ';
        const shareText = `Safe Meal 🍽️\n${currentIngredients}で作る災害時レシピを生成しました！\n\n${recipeTitle}`;
        
        // LINEの共有URL
        const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`;
        lineShareBtn.href = lineUrl;
        
        // Twitter(X)の共有URL
        const twitterText = `${shareText}\n\n#SafeMealVision #災害時レシピ #防災`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(appUrl)}`;
        twitterShareBtn.href = twitterUrl;
    }

    // 戻るボタンのイベント
    backBtn.addEventListener('click', () => {
        showInputPage();
    });

    // ボタンactive切り替え
    lifelineBtns.forEach(btn => {
        btn.addEventListener('click', () => btn.classList.toggle('active'));
    });
    allergyBtns.forEach(btn => {
        btn. addEventListener('click', () => btn.classList.toggle('active'));
    });

    //ここからがAIに送信する処理
    analyzeBtn.addEventListener('click', async () => {
        // 入力値の取得と整形
        const rawInput = ingredientsInput.value. trim();
       
        const ingredients = rawInput
            .split('\n')
            .map(line => line.trim())
            .filter(line => line. length > 0)
            .join(', ');
        
        currentIngredients = ingredients; // 共有用に保存
        
        const memo = ingredientsMemo.value. trim();
        
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

        try {
            // サーバーにデータを送る
            const response = await fetch('/api/recipe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ingredients,
                    memo,
                    lifelines,
                    allergies
                })
            });

            const data = await response.json();

            if (! response.ok || data.error) {
                // サーバーからのエラーメッセージを表示
                alert("エラー: " + (data.error || "レシピの生成に失敗しました"));
            } else {
                // 生成されたレシピテキストを保存
                currentRecipeText = data.result;
                
                // HTMLエスケープ関数（XSS対策）
                function escapeHtml(text) {
                    const div = document.createElement('div');
                    div.textContent = text;
                    return div. innerHTML;
                }
                
                // 結果を表示する - マークダウン形式を簡易的にHTMLに変換
                let formattedResult = escapeHtml(data. result)
                    // まず ** を削除（太字記法を除去）
                    .replace(/\*\*/g, '')
                    // ### 見出し（h3相当）を太字の大きな見出しに変換
                    .replace(/^### (. +)$/gm, '<h3 style="color:#ff6b6b; font-size:1.2em; font-weight:bold; margin-top:25px; margin-bottom:12px; border-left:4px solid #ff6b6b; padding-left:10px; background:#fff5f5;">$1</h3>')
                    // ## 見出し（h2相当）を太字の大きな見出しに変換
                    .replace(/^## (.+)$/gm, '<h2 style="color:#ff6b6b; font-size:1.4em; font-weight:bold; margin-top:30px; margin-bottom:15px; border-bottom:3px solid #ff6b6b; padding-bottom:8px;">$1</h2>')
                    // リスト項目を変換（番号付き）
                    . replace(/^(\d+)\. (.+)$/gm, '<div style="margin-left:20px; margin-bottom: 10px; line-height:1.6;"><strong style="color:#ff6b6b; font-weight:bold;">$1.</strong> $2</div>')
                    // リスト項目を変換（箇条書き）
                    .replace(/^- (.+)$/gm, '<div style="margin-left:20px; margin-bottom:10px; line-height:1.6;"><span style="color:#ff6b6b; font-weight:bold;">•</span> $1</div>')
                    // 改行を保持
                    .replace(/\n/g, '<br>');
                
                resultContent. innerHTML = formattedResult;
                
                // レシピ結果ページに遷移
                showResultPage();
                
                // ページ遷移後にSNS共有ボタンを更新
                updateShareButtons();
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