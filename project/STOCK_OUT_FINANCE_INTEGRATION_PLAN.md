# Stock Out Feature - Finance Module Integration Plan

## Current Status ❌

**Stock Out Feature** is currently:
- ✅ Creating `stock_out_transactions` records
- ✅ Creating GL transactions for losses
- ✅ Updating inventory
- ❌ **NOT** integrated with `Expenses.tsx`
- ❌ **NOT** integrated with `Cashflowoverview.tsx`

---

## What Needs to Be Integrated

### 1. **Expenses.tsx Integration**

#### Current Behavior:
- Fetches data from `expenses` table only
- Shows expenses, expense requests, and payroll requests
- Does NOT include inventory losses from stock out

#### Required Integration:

**A. Include Stock Out Losses as Expenses:**
- Stock out transactions with `financial_impact = 'loss'` should appear as expenses
- These represent inventory losses (Expired, Damaged, Lost/Missing)
- Should show with source = "Inventory" or "Stock Out"
- Should be included in expense totals and category breakdown

**B. Add Stock Out as a Category:**
- Create "Inventory Losses" or "Stock Out" category in expense categories
- Or map stock out reasons to existing categories:
  - `expired` → "Inventory Loss - Expired"
  - `damaged` → "Inventory Loss - Damaged"  
  - `lost_missing` → "Inventory Loss - Shrinkage"
  - `returned_to_supplier` → "Supplier Returns"

**C. Files to Modify:**
1. **`useExpensesData.ts`** hook:
   - Add function to fetch stock out losses
   - Convert stock out transactions to expense format
   - Include in expense totals

2. **`Expenses.tsx`**:
   - Display stock out losses in unified table
   - Add "Inventory" or "Stock Out" to source filter
   - Show stock out reference numbers and reasons

---

### 2. **Cashflowoverview.tsx Integration**

#### Current Behavior:
- Inflows: Only from `pos_transactions` (sales)
- Outflows: Only from `expenses` and `payroll_requests`
- Does NOT include inventory losses

#### Required Integration:

**A. Include Stock Out Losses in Outflow:**
- Stock out losses are **non-cash expenses** but still affect profitability
- Should be included in total outflow calculations
- Should appear in recent transactions
- Should appear in daily cash flow breakdown

**B. Add to Cash Flow Categories:**
- Add "Inventory Losses" to outflow categories
- Break down by reason (Expired, Damaged, Lost/Missing, Supplier Returns)

**C. Files to Modify:**
1. **`useCashFlowData.ts`** hook:
   - `fetchTotalOutflow()`: Include stock out losses
   - `fetchDailyCashFlow()`: Include stock out losses by date
   - `fetchCashFlowCategories()`: Add inventory losses category
   - `fetchRecentTransactions()`: Include recent stock out transactions

2. **`Cashflowoverview.tsx`**:
   - Display inventory losses in categories
   - Show in recent transactions list

---

## Implementation Details

### 1. Stock Out Losses Query

```typescript
// Fetch stock out losses with financial impact = 'loss'
const fetchStockOutLosses = async (startDate: string, endDate: string, branchId?: string) => {
  let query = supabase
    .from('stock_out_transactions')
    .select(`
      id,
      stock_out_date,
      stock_out_reason,
      total_loss_amount,
      reference_number,
      branch_id,
      products(name, sku),
      branches(id, name),
      created_by,
      users(id, first_name, last_name)
    `)
    .eq('financial_impact', 'loss')
    .in('status', ['approved', 'completed'])
    .gte('stock_out_date', startDate)
    .lte('stock_out_date', endDate);

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  return await query;
};
```

### 2. Convert Stock Out to Expense Format

```typescript
const convertStockOutToExpense = (stockOut: StockOutTransaction): ExpenseRow => {
  const reasonMap: Record<string, string> = {
    'expired': 'Inventory Loss - Expired',
    'damaged': 'Inventory Loss - Damaged',
    'lost_missing': 'Inventory Loss - Shrinkage',
    'returned_to_supplier': 'Supplier Returns'
  };

  return {
    kind: 'expense',
    id: stockOut.id,
    date: stockOut.stock_out_date,
    description: `Stock Out - ${reasonMap[stockOut.stock_out_reason] || stockOut.stock_out_reason} (${stockOut.products?.name || 'N/A'})`,
    category: reasonMap[stockOut.stock_out_reason] || 'Inventory Loss',
    branch: stockOut.branches?.name || '—',
    source: 'Inventory',
    amount: stockOut.total_loss_amount || 0,
    status: 'approved',
    raw: stockOut
  };
};
```

### 3. Integration Points

#### In `useExpensesData.ts`:
- Add `fetchStockOutLosses()` function
- Include in `refreshData()`
- Convert stock out losses to expense format
- Merge with existing expenses

#### In `useCashFlowData.ts`:
- Update `fetchTotalOutflow()` to include stock out losses
- Update `fetchDailyCashFlow()` to aggregate by date
- Update `fetchCashFlowCategories()` to include "Inventory Losses"
- Update `fetchRecentTransactions()` to include recent stock outs

---

## Financial Impact Summary

### Stock Out Reasons and Their Financial Impact:

| Reason | Financial Impact | GL Account | Appears in Expenses? | Appears in Cash Flow? |
|--------|------------------|------------|---------------------|----------------------|
| **Expired** | Loss | Inventory Loss - Expired Goods | ✅ Yes | ✅ Yes (Non-cash) |
| **Damaged** | Loss | Inventory Loss - Damaged Goods | ✅ Yes | ✅ Yes (Non-cash) |
| **Lost/Missing** | Loss | Inventory Shrinkage / Theft Loss | ✅ Yes | ✅ Yes (Non-cash) |
| **Returned to Supplier** | Depends | Accounts Payable - Supplier Returns | ✅ Yes | ⚠️ Maybe (if affects AP) |
| **Transferred** | Neutral | Inventory Account (transfer only) | ❌ No | ❌ No |
| **Adjustment/Correction** | Depends | Inventory Account or Loss | ✅ Yes (if loss) | ✅ Yes (if loss) |

---

## Steps to Implement

1. **Update `useExpensesData.ts`:**
   - Add `fetchStockOutLosses()` function
   - Convert stock out losses to expense format
   - Include in expense totals and filtering

2. **Update `useCashFlowData.ts`:**
   - Add stock out losses to `fetchTotalOutflow()`
   - Add stock out losses to `fetchDailyCashFlow()`
   - Add "Inventory Losses" to `fetchCashFlowCategories()`
   - Add stock out losses to `fetchRecentTransactions()`

3. **Update `Expenses.tsx`:**
   - Handle stock out losses in unified table
   - Add "Inventory" to source filter
   - Display stock out reference and reason

4. **Update `Cashflowoverview.tsx`:**
   - Display inventory losses in categories
   - Show in recent transactions

5. **Testing:**
   - Verify stock out losses appear in expenses
   - Verify stock out losses appear in cash flow
   - Verify totals are correct
   - Verify RBAC filtering works

---

## Notes

- **Stock out losses are non-cash expenses** - they don't directly affect cash balance but do affect profitability
- **Supplier returns** may affect Accounts Payable, which could impact cash flow when paid
- **Transfers** are neutral and shouldn't appear as expenses (just inventory movement)
- **Adjustments** depend on whether they result in a loss or just a correction




