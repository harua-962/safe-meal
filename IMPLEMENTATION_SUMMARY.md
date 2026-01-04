# Implementation Summary: Water-Only Lifeline Safety Fix

## Problem Statement (Japanese)
APIで使えるライフラインを水のみにしたにも関わらず加熱調理が必要なレシピがでてきます。それを防止するためにコードを編集してください。食材が生もので生で食べられないものの場合、レシピを出さないなど安全対策も講じてください。

## Problem Statement (English)
Even when the API is set to use only water as the lifeline, recipes requiring heating/cooking are still appearing. The code needs to be edited to prevent this. Safety measures should also be implemented, such as not showing recipes when ingredients are raw and cannot be eaten raw.

## Solution

### Changes Made
Modified `/home/runner/work/safe-meal/safe-meal/src/index.ts` in the `/api/recipe` endpoint to add intelligent lifeline-aware constraints:

1. **Lifeline Detection Logic** (lines 83-86)
   - Detects if electricity is available
   - Detects if gas is available
   - Identifies water-only scenarios (water available, but no electricity or gas)

2. **Dynamic Constraint Generation** (lines 88-111)
   Three distinct constraint modes based on lifeline availability:
   
   **Mode A: Water Only** (hasWaterOnly = true)
   - Explicitly forbids ALL heating methods: 煮る (boiling), 焼く (grilling), 炒める (stir-frying), 茹でる (boiling), 温める (heating)
   - Requires ingredients to be safely edible raw
   - Instructs AI to REJECT recipes if raw meat, raw fish, or raw eggs are present
   - Allows pre-processed foods (canned goods, retort foods)
   - Returns safety message: "水のみでは調理できません。加熱が必要な食材が含まれています。"
   
   **Mode B: No Heat Source** (!hasElectricity && !hasGas, but not water-only)
   - Forbids heating
   - Requires ingredients to be safely edible raw
   
   **Mode C: Heat Available** (electricity or gas available)
   - Normal cooking constraints
   - Respects available utilities

3. **Prompt Integration** (line 119)
   - Constraint block is injected into the AI prompt
   - AI receives explicit, detailed instructions about what cooking methods are forbidden

### Technical Details

**File Modified**: `src/index.ts`
**Lines Added**: ~30 lines
**Lines Modified**: 1 line (prompt template)

**Logic Flow**:
```typescript
const hasElectricity = lifelines.includes('電気');
const hasGas = lifelines.includes('ガス');
const hasWaterOnly = lifelines.includes('水') && !hasElectricity && !hasGas;

if (hasWaterOnly) {
  // Most restrictive: Water only, no heating allowed
} else if (!hasElectricity && !hasGas) {
  // No heat source at all
} else {
  // Normal cooking with available utilities
}
```

### Testing & Validation

1. **Type Checking**: ✅ Passes (`npm run type-check`)
2. **Build**: ✅ Successful (`npm run build`)
3. **Logic Tests**: ✅ All 6 test scenarios pass
4. **Security Scan**: ✅ 0 vulnerabilities (CodeQL)
5. **Code Review**: ✅ Addressed all critical issues

### Test Scenarios Validated

| Scenario | Lifelines | Expected Behavior | Status |
|----------|-----------|-------------------|---------|
| 1 | 水 only | No cooking recipes | ✅ |
| 2 | 電気, ガス | Can cook | ✅ |
| 3 | 電気 only | Can cook with electricity | ✅ |
| 4 | ガス only | Can cook with gas | ✅ |
| 5 | 水, 電気 | Can cook with electricity | ✅ |
| 6 | None | No cooking | ✅ |

### Safety Improvements

1. **Prevents Heating When Unavailable**: When only water is available, the AI is explicitly instructed that no heating methods are possible
2. **Raw Ingredient Safety**: AI is instructed to reject recipes if dangerous raw ingredients (meat, fish, eggs) are present
3. **Clear Error Messages**: Users receive clear feedback when their ingredients cannot be used safely
4. **Processed Food Allowance**: Canned goods and retort foods are still allowed as they're pre-cooked

### Example Prompts Generated

**Water Only Scenario**:
```
【ライフライン】: 水
【重要な制約】
- 利用可能なのは水のみで、電気もガスも使えません
- 加熱調理は一切できません（煮る、焼く、炒める、茹でる、温める等は全て不可）
- 生で安全に食べられる食材のみを使用してください
- 生では食べられない食材（生肉、生魚、生卵など）が含まれている場合は、レシピを提案せず、「水のみでは調理できません。加熱が必要な食材が含まれています。」と返答してください
- 缶詰やレトルト食品など、そのまま食べられる加工食品は使用可能です
```

**With Heat Source**:
```
【ライフライン】: 電気, ガス
【調理方法の制約】
- 利用可能なライフライン: 電気, ガス
- 利用できないライフラインでの調理方法は使用しないでください
```

## Security Summary

- ✅ No security vulnerabilities detected by CodeQL
- ✅ No new security risks introduced
- ✅ Improves safety by preventing dangerous recipe suggestions
- ✅ Proper input validation maintained

## Conclusion

The implementation successfully addresses the issue by:
1. Detecting water-only scenarios
2. Adding explicit constraints against cooking
3. Implementing safety checks for raw ingredients
4. Maintaining backward compatibility for other lifeline combinations

The solution is minimal, focused, and surgical—changing only what's necessary to fix the reported issue.
