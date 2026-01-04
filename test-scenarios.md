# Test Scenarios for Water-Only Lifeline Fix

## Scenario 1: Water Only with Safe Ingredients
**Input:**
- Ingredients: パン, ツナ缶, トマト
- Lifelines: 水 (Water only)
- Expected: Should generate a recipe without cooking (e.g., sandwich or salad)

## Scenario 2: Water Only with Raw Meat (Unsafe)
**Input:**
- Ingredients: 鶏肉, 米
- Lifelines: 水 (Water only)
- Expected: Should NOT generate a recipe. Should return message: "水のみでは調理できません。加熱が必要な食材が含まれています。"

## Scenario 3: Water Only with Raw Fish (Unsafe)
**Input:**
- Ingredients: 生魚, 野菜
- Lifelines: 水 (Water only)
- Expected: Should NOT generate a recipe. Should return safety message.

## Scenario 4: Water Only with Canned Foods (Safe)
**Input:**
- Ingredients: ツナ缶, トマト缶, パン
- Lifelines: 水 (Water only)
- Expected: Should generate a recipe without cooking

## Scenario 5: Electricity/Gas Available
**Input:**
- Ingredients: 鶏肉, 野菜
- Lifelines: 電気, ガス
- Expected: Can generate recipes with cooking

## Implementation Details

The fix adds three key safety checks in the prompt:

1. **Water Only (hasWaterOnly = true):**
   - Explicitly forbids all heating methods (煮る, 焼く, 炒める, 茹でる, 温める)
   - Only allows ingredients that are safe to eat raw
   - Instructs AI to reject recipes if raw meat/fish/eggs are present
   - Allows pre-processed canned/retort foods

2. **No Heat Source (no electricity and no gas):**
   - Forbids heating
   - Only allows ingredients safe to eat raw

3. **With Heat Source:**
   - Normal cooking with available utilities
