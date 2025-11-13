# Stock Out Feature - Full Functionality Requirements

## Overview
The Stock Out feature needs to track inventory reductions with proper financial impact based on the reason for stock removal. Each reason has different accounting treatment.

---

## 📊 **1. Database Schema Requirements**

### **A. Stock Out Transactions Table** (NEW)
```sql
CREATE TABLE IF NOT EXISTS public.stock_out_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  
  -- Stock Out Details
  stock_out_reason VARCHAR(50) NOT NULL CHECK (stock_out_reason IN (
    'expired', 
    'damaged', 
    'returned_to_supplier', 
    'transferred', 
    'adjustment_correction', 
    'lost_missing'
  )),
  quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(10, 2) NOT NULL, -- Cost at time of stock out for loss calculation
  total_loss_amount NUMERIC(12, 2) DEFAULT 0, -- Calculated: quantity * unit_cost (for loss reasons)
  
  -- Financial Impact Classification
  financial_impact VARCHAR(20) NOT NULL CHECK (financial_impact IN ('loss', 'neutral', 'depends')),
  
  -- Reference Information
  reference_number VARCHAR(100) NULL, -- Auto-generated: SO-YYYYMMDD-XXX
  related_transfer_id UUID NULL REFERENCES stock_out_transactions(id), -- For transferred items (links source and destination)
  related_supplier_return_id UUID NULL, -- For returned to supplier items
  related_adjustment_id UUID NULL, -- For adjustment/correction items
  
  -- Branch Transfer Details (if reason = 'transferred')
  destination_branch_id UUID NULL REFERENCES branches(id),
  
  -- Approval & Audit
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  notes TEXT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID NULL REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE NULL,
  
  -- Timestamps
  stock_out_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX idx_stock_out_transactions_product_id ON stock_out_transactions(product_id);
CREATE INDEX idx_stock_out_transactions_branch_id ON stock_out_transactions(branch_id);
CREATE INDEX idx_stock_out_transactions_reason ON stock_out_transactions(stock_out_reason);
CREATE INDEX idx_stock_out_transactions_status ON stock_out_transactions(status);
CREATE INDEX idx_stock_out_transactions_date ON stock_out_transactions(stock_out_date DESC);
CREATE INDEX idx_stock_out_transactions_reference ON stock_out_transactions(reference_number);
```

### **B. Update `inventory_movements` Table**
Add new movement types to the existing constraint:
```sql
ALTER TABLE inventory_movements 
DROP CONSTRAINT IF EXISTS inventory_movements_type_check;

ALTER TABLE inventory_movements
ADD CONSTRAINT inventory_movements_type_check CHECK (
  (movement_type)::text = ANY (ARRAY[
    'purchase'::text,
    'sale'::text,
    'adjustment'::text,
    'transfer_in'::text,
    'transfer_out'::text,
    'return'::text,
    'damage'::text,
    'expired'::text,
    'count_adjustment'::text,
    'stock_out_expired'::text,
    'stock_out_damaged'::text,
    'stock_out_returned'::text,
    'stock_out_transferred'::text,
    'stock_out_adjustment'::text,
    'stock_out_lost'::text
  ])
);
```

---

## 💰 **2. Financial Impact Classification**

### **Financial Impact by Reason:**

| Reason | Financial Impact | Treatment | Account Mapping |
|--------|------------------|-----------|-----------------|
| **Expired** | 🔴 **Loss** | Record under "Inventory Loss - Expired Goods" | Debit: Inventory Loss - Expired<br>Credit: Inventory |
| **Damaged** | 🔴 **Loss** | Record under "Inventory Loss - Damaged Goods" | Debit: Inventory Loss - Damaged<br>Credit: Inventory |
| **Returned to Supplier** | ⚪ **Neutral** | Inventory decreases, but supplier issues credit/replacement | Debit: Accounts Payable (credit memo)<br>Credit: Inventory |
| **Transferred** | ⚪ **Neutral** | Inventory moves between branches; no gain/loss | Debit: Inventory (destination branch)<br>Credit: Inventory (source branch) |
| **Adjustment / Correction** | ⚠️ **Depends** | If clerical error → neutral; if missing stock → loss | Conditional accounting entry |
| **Lost / Missing** | 🔴 **Loss** | Record under "Inventory Shrinkage / Theft Loss" | Debit: Inventory Shrinkage Loss<br>Credit: Inventory |

---

## 📝 **3. Accounting Journal Entry Requirements**

### **A. Required Chart of Accounts (COA)**

The following accounts need to exist in the `accounts` table:

```sql
-- Inventory Loss Accounts (Expense accounts)
'Inventory Loss - Expired Goods'     (account_type: 'expense')
'Inventory Loss - Damaged Goods'     (account_type: 'expense')
'Inventory Shrinkage / Theft Loss'   (account_type: 'expense')

-- Inventory Asset Accounts (Asset accounts)
'Inventory - [Branch Name]'          (account_type: 'asset', per branch)

-- Accounts Payable
'Accounts Payable - Supplier Returns' (account_type: 'liability')
```

### **B. Journal Entry Creation Logic**

For each stock out transaction, create corresponding `gl_transactions` and `gl_transaction_items`:

#### **Loss Reasons (Expired, Damaged, Lost/Missing):**
```sql
-- GL Transaction
transaction_type: 'adjustment'
description: 'Stock Out - [Reason]: [Product Name] - [Quantity] [Unit]'
reference_number: [stock_out_reference_number]

-- GL Transaction Items
Item 1: Debit  -> Inventory Loss Account (based on reason) -> amount = total_loss_amount
Item 2: Credit -> Inventory Account (branch)               -> amount = total_loss_amount
```

#### **Neutral Reasons:**

**Returned to Supplier:**
```sql
Item 1: Debit  -> Accounts Payable - Supplier Returns  -> amount = total_loss_amount
Item 2: Credit -> Inventory Account (branch)            -> amount = total_loss_amount
```

**Transferred:**
```sql
Item 1: Debit  -> Inventory Account (destination branch) -> amount = total_loss_amount
Item 2: Credit -> Inventory Account (source branch)      -> amount = total_loss_amount
```

**Adjustment / Correction:**
```sql
-- If clerical error (neutral):
Item 1: Debit  -> Inventory Account (adjusted branch) -> amount = difference
Item 2: Credit -> Inventory Account (current branch)  -> amount = difference

-- If missing stock (loss):
Item 1: Debit  -> Inventory Shrinkage Loss -> amount = total_loss_amount
Item 2: Credit -> Inventory Account (branch) -> amount = total_loss_amount
```

---

## 🔧 **4. Service Layer Requirements**

### **A. Stock Out Service (`stockOutService.ts`)**

```typescript
interface StockOutData {
  inventory_id: string;
  product_id: string;
  branch_id: string;
  stock_out_reason: 'expired' | 'damaged' | 'returned_to_supplier' | 'transferred' | 'adjustment_correction' | 'lost_missing';
  quantity: number;
  notes?: string;
  destination_branch_id?: string; // Required if reason = 'transferred'
  supplier_return_reference?: string; // Optional for returned_to_supplier
}

interface StockOutResult {
  stock_out_transaction_id: string;
  reference_number: string;
  inventory_movement_id: string;
  gl_transaction_id?: string; // Only for loss reasons
  financial_impact: 'loss' | 'neutral' | 'depends';
  loss_amount: number; // 0 if neutral
}

class StockOutService {
  // Main function to process stock out
  async processStockOut(data: StockOutData, userId: string): Promise<StockOutResult>
  
  // Calculate unit cost (FIFO/LIFO/Weighted Average)
  private async calculateUnitCost(productId: string, branchId: string): Promise<number>
  
  // Generate reference number
  private generateReferenceNumber(): string
  
  // Determine financial impact
  private getFinancialImpact(reason: string): 'loss' | 'neutral' | 'depends'
  
  // Create inventory movement record
  private async createInventoryMovement(stockOutId: string, data: StockOutData): Promise<string>
  
  // Update inventory quantity
  private async updateInventoryQuantity(inventoryId: string, quantity: number): Promise<void>
  
  // Create journal entries
  private async createJournalEntries(stockOutId: string, data: StockOutData, lossAmount: number): Promise<string | null>
  
  // Handle transferred items (create matching entry in destination branch)
  private async handleTransfer(destinationBranchId: string, sourceStockOut: StockOutResult): Promise<void>
  
  // Handle supplier return (create accounts payable entry)
  private async handleSupplierReturn(data: StockOutData, lossAmount: number): Promise<void>
}
```

### **B. Business Logic Flow**

```
1. Validate stock out request
   ├─ Check quantity doesn't exceed available stock
   ├─ Validate reason-specific requirements (e.g., destination_branch_id for transfers)
   └─ Check user permissions

2. Calculate unit cost
   ├─ Retrieve current inventory cost (FIFO/LIFO/Weighted Average)
   └─ Calculate total_loss_amount = quantity * unit_cost

3. Create stock_out_transaction record
   ├─ Generate reference_number (SO-YYYYMMDD-XXX)
   ├─ Set financial_impact based on reason
   └─ Set status = 'pending' (or 'approved' if auto-approval enabled)

4. Update inventory
   ├─ Decrease quantity_on_hand
   └─ Update updated_at timestamp

5. Create inventory_movement record
   ├─ Link to stock_out_transaction
   ├─ Set movement_type based on reason
   └─ Record quantity as negative (stock out)

6. Create financial journal entries (based on financial_impact)
   ├─ Loss reasons: Create GL transaction with loss account
   ├─ Neutral (Returned): Create accounts payable credit
   ├─ Neutral (Transferred): Create matching entry for destination branch
   └─ Depends (Adjustment): Conditional logic based on adjustment type

7. Handle special cases
   ├─ Transferred: Create inventory increase in destination branch
   ├─ Returned to Supplier: Link to supplier return record
   └─ Adjustment: Link to inventory adjustment record

8. Return result with all created IDs
```

---

## ✅ **5. Validation Rules**

### **Pre-Processing Validations:**
- ✅ Quantity must be > 0
- ✅ Quantity must not exceed `quantity_available` in inventory
- ✅ Product must exist and be active
- ✅ Branch must exist and be active
- ✅ User must have permission to perform stock out
- ✅ For 'transferred' reason: `destination_branch_id` is required
- ✅ For 'transferred' reason: destination branch must be different from source
- ✅ For 'returned_to_supplier': supplier_id must exist in product record
- ✅ Batch number and expiry date must match if specified

### **Post-Processing Validations:**
- ✅ Inventory quantity_on_hand >= 0 after stock out
- ✅ GL transaction items must balance (total debits = total credits)
- ✅ Reference number must be unique
- ✅ If transferred, destination branch inventory must increase by same quantity

---

## 📊 **6. Reporting & Analytics Requirements**

### **A. Stock Out Reports**
- Stock Out by Reason (grouped by reason type)
- Stock Out by Product
- Stock Out by Branch
- Stock Out Loss Summary (total losses by reason)
- Stock Out Trends (time-series analysis)

### **B. Financial Reports Integration**
- Update P&L Statement to include inventory loss expenses
- Update Inventory Valuation Report
- Update Cost of Goods Sold (COGS) calculations
- Branch-level profit/loss including stock out losses

---

## 🔗 **7. Integration Points**

### **A. Inventory Management Module**
- ✅ Update `InventoryManagement.tsx` to call `StockOutService.processStockOut()`
- ✅ Refresh inventory table after stock out
- ✅ Show stock out history in product details

### **B. Finance Module**
- ✅ Display stock out losses in Expenses report
- ✅ Link stock out transactions to GL entries
- ✅ Reconcile inventory losses in financial reports

### **C. Reporting Module**
- ✅ Add Stock Out reports to Reports & Analytics
- ✅ Include stock out data in inventory turnover calculations
- ✅ Track stock out trends over time

### **D. Supplier Management**
- ✅ Link "Returned to Supplier" stock outs to supplier records
- ✅ Track supplier return credits
- ✅ Generate supplier return documentation

---

## 🎯 **8. UI/UX Enhancements**

### **Additional Fields Needed in Stock Out Modal:**

1. **For "Returned to Supplier":**
   - Supplier dropdown selection
   - Supplier return reference number input
   - Credit memo number input

2. **For "Transferred":**
   - Destination branch dropdown
   - Transfer reference number (auto-generated)

3. **For "Adjustment / Correction":**
   - Adjustment type radio: "Clerical Error" | "Missing Stock"
   - Original quantity field (for comparison)

4. **Financial Preview:**
   - Display calculated loss amount (for loss reasons)
   - Show which GL accounts will be affected
   - Preview journal entry summary

---

## 📋 **9. Audit Trail Requirements**

### **Track:**
- Who created the stock out
- When it was created
- Who approved it (if approval workflow exists)
- When it was approved
- Original quantity before stock out
- New quantity after stock out
- Cost basis used for calculation
- All related financial transactions

---

## 🚀 **10. Implementation Priority**

### **Phase 1: Core Functionality (MVP)**
1. ✅ Create `stock_out_transactions` table
2. ✅ Implement basic stock out service (inventory update only)
3. ✅ Create inventory movement records
4. ✅ Basic validation

### **Phase 2: Financial Integration**
1. ✅ Add financial impact classification
2. ✅ Create GL transaction entries for loss reasons
3. ✅ Link to accounts (COA setup)
4. ✅ Financial validation

### **Phase 3: Advanced Features**
1. ✅ Transferred items handling
2. ✅ Supplier return integration
3. ✅ Adjustment/correction logic
4. ✅ Approval workflow

### **Phase 4: Reporting & Analytics**
1. ✅ Stock out reports
2. ✅ Financial impact reports
3. ✅ Trend analysis
4. ✅ Dashboard widgets

---

## ⚠️ **11. Important Considerations**

1. **Cost Calculation Method:** Decide on FIFO, LIFO, or Weighted Average for unit cost calculation
2. **Approval Workflow:** Consider if stock outs need approval based on amount or reason
3. **Reversibility:** Can stock outs be reversed? If yes, need reversal logic for GL entries
4. **Batch/Expiry Tracking:** Link stock outs to specific batches for expiry tracking
5. **Tax Implications:** Some losses may be tax-deductible; track for tax reporting
6. **Compliance:** Ensure stock out records meet audit requirements
7. **Performance:** Index properly for large-scale inventory operations

---

## 📝 **Summary Checklist**

- [ ] Database tables created (`stock_out_transactions`)
- [ ] `inventory_movements` table updated with new movement types
- [ ] Chart of Accounts updated with inventory loss accounts
- [ ] `StockOutService` implemented with full business logic
- [ ] Journal entry creation for all financial impacts
- [ ] UI updated with reason-specific fields
- [ ] Validation rules implemented
- [ ] Financial reports updated to include stock out losses
- [ ] Stock out reports created
- [ ] Integration with Inventory Management module
- [ ] Integration with Finance module
- [ ] Audit trail implemented
- [ ] Unit tests for service layer
- [ ] Integration tests for full flow

