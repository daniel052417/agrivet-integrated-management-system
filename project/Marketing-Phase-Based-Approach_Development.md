Excellent — that’s exactly how professional system development teams plan feature rollouts 👏

You want each phase (like *Promotions, Insights, Rewards, Facebook Integration*) to have **its own mini phase-based development cycle** — e.g. **Phase 1A: UI/UX**, **Phase 1B: Backend**, **Phase 1C: Integration**, etc.

Here’s the **fully structured, phase-based breakdown** of your **Agrivet ERP Marketing Module** roadmap — detailed enough for implementation planning, task assignment, and developer handoff.

---

# 🧭 AGRIVET ERP – Marketing Module Development Roadmap

**Goal:** Build a semi-automated, data-driven marketing system integrated with Sales and PWA.

---

## ⚙️ **PHASE 1 – Promotions Management Foundation**

### 🎯 Goal:

Allow the owner to create and manage product promotions that automatically appear on the PWA and expire based on dates.

---

### 🧩 **Phase 1A – UI/UX Design & Front-End Setup**

**Objective:** Design and implement the user interface for managing promotions.

#### UI Components:

1. **Promotions List Page**

   * Columns: Promo Name, Validity, Status, Channels (PWA/Facebook), Actions (Edit/Delete/View)
   * Filters: Status (Active, Upcoming, Expired)
   * Search Bar

2. **Create/Edit Promotion Modal or Page**

   * Fields:

     * Promo Name
     * Description
     * Start Date / End Date
     * Discount Type (₱ or %)
     * Discount Value
     * Select Products / Categories
     * Show on PWA (toggle)
     * Show on Facebook (toggle – for later phase)
   * Buttons:

     * **Save** – creates or updates record
     * **Cancel** – closes modal

#### Deliverables:

* Responsive UI (desktop-first)
* Promo table with pagination
* Form validation
* Status color badges (Active = green, Expired = red, Upcoming = yellow)

---

### ⚙️ **Phase 1B – Backend Logic & Database**

**Objective:** Create database and API routes to handle promotions.

#### Tables:

**`promotions`**

| Field            | Type                                | Description              |
| ---------------- | ----------------------------------- | ------------------------ |
| id               | UUID                                | Primary Key              |
| title            | text                                | Promo name               |
| description      | text                                | Details of the promotion |
| start_date       | date                                | Promo start              |
| end_date         | date                                | Promo end                |
| discount_type    | enum(‘flat’, ‘percent’)             | Type of discount         |
| discount_value   | decimal                             | Discount amount          |
| products         | jsonb                               | List of product IDs      |
| show_on_pwa      | boolean                             | Flag for PWA visibility  |
| show_on_facebook | boolean                             | Flag for FB posting      |
| status           | enum(‘active’,‘upcoming’,‘expired’) | Auto-updated             |
| created_by       | UUID                                | User who created         |
| created_at       | timestamp                           | Date created             |

#### Backend Functions:

* `GET /api/promotions` → list all promotions
* `POST /api/promotions` → create promo
* `PUT /api/promotions/:id` → update promo
* `DELETE /api/promotions/:id` → delete promo
* **Scheduled Job**: Update status nightly (`end_date < now()` → expired)

---

### 🔗 **Phase 1C – Integration & Automation**

**Objective:** Connect the promotions to other modules.

* Integrate with **PWA** via `/api/pwa/promotions`

  * Only return active promos
  * Auto-hide expired ones
* Integrate with **Sales Module** (optional: track sales made under promo)
* Prepare future **Facebook API hooks**

---

### 🧪 **Phase 1D – Testing & QA**

* Test promo creation and auto-expiry logic
* Verify promo visibility on PWA
* Test filtering and searching
* Confirm CRUD permissions (owner-only)

---

---

## 📊 **PHASE 2 – Insights & Analytics Dashboard**

### 🎯 Goal:

Provide data-driven insights for top-selling products, loyal customers, and promo effectiveness.

---

### 🧩 **Phase 2A – UI/UX Design**

**Dashboard Layout:**

1. **Header Filters**

   * Branch (All/Specific)
   * Date Range (Daily/Weekly/Monthly)
2. **Stat Cards**

   * Active Promotions
   * Total Engaged Customers
   * Top Product
   * Total Sales
3. **Charts**

   * Monthly Sales Trend (Line Chart)
   * Top 5 Products (Bar Chart)
4. **Table**

   * Loyal Buyers (Customer Name, Purchases, Total Spent, Last Purchase)

#### Buttons:

* **Export Report (PDF/Excel)**
* **Filter Apply / Reset**

---

### ⚙️ **Phase 2B – Backend Logic**

* Query from `sales` and `promotions` tables:

  * Sales grouped by month
  * Top-selling & least-selling products
  * Loyal buyers (e.g., ≥5 purchases in 3 months)
* Create API routes:

  * `GET /api/marketing/insights`
  * `GET /api/marketing/loyal-customers`

---

### 🔗 **Phase 2C – Integration**

* Link dashboard charts with live data from Sales module.
* Cache results for performance (optional).

---

### 🧪 **Phase 2D – Testing**

* Verify chart data matches Sales totals.
* Validate loyal buyer logic accuracy.
* Test report export functionality.

---

---

## 🎁 **PHASE 3 – Customer Engagement & Rewards**

### 🎯 Goal:

Reward loyal buyers and send notifications through the PWA for promos and restocks.

---

### 🧩 **Phase 3A – UI/UX Design**

**Page: Rewards & Notifications**

1. **Rewards Configuration**

   * Fields:

     * Reward Name
     * Purchase Threshold
     * Reward Type (₱ discount)
     * Discount Value
     * Validity Date (optional)
   * Buttons: Save / Cancel

2. **Customer Reward Status Table**

   * Columns: Customer, Purchases, Status (Eligible/Rewarded), Actions (Send Notification)

3. **Notifications Log**

   * Columns: Message, Recipient, Sent Date, Status (Delivered/Read)

---

### ⚙️ **Phase 3B – Backend Logic**

**Tables:**
`rewards`, `notifications`

| Field        | Description                  |
| ------------ | ---------------------------- |
| reward_id    | link to promo or sales logic |
| customer_id  | user reference               |
| reward_type  | “discount”                   |
| reward_value | ₱50                          |
| threshold    | min purchases                |
| is_redeemed  | boolean                      |
| notified     | boolean                      |

**Automations:**

* Check sales records daily → mark customers as eligible.
* Auto-generate reward entry.
* Send PWA notification via `/api/pwa/notify`.

---

### 🔗 **Phase 3C – Integration**

* Hook into Sales:

  * When checkout → check if customer has eligible discount.
* Hook into PWA:

  * In-app notification display.

---

### 🧪 **Phase 3D – Testing**

* Test reward generation after threshold reached.
* Confirm discount applies in next sale.
* Test PWA notification delivery.

---

---

## 🌐 **PHASE 4 – Facebook Integration**

### 🎯 Goal:

Automatically post ERP promotions to the official Facebook Page via Meta API.

---

### 🧩 **Phase 4A – UI/UX**

**Page: Facebook Integration Settings**

* Connect Page (OAuth)
* Show Linked Page Details
* Toggle: Auto-post promotions
* Post Logs Table (Promo Name, Post Date, Status)

---

### ⚙️ **Phase 4B – Backend Logic**

* Meta Graph API Integration:

  * Store `page_access_token` securely.
  * API call: `POST /{page-id}/feed`
* Store Facebook post IDs in `promotions` table.

---

### 🔗 **Phase 4C – Integration**

* When a promotion is published with `show_on_facebook = true`, trigger the API call.
* Update dashboard with success/fail status.

---

### 🧪 **Phase 4D – Testing**

* Test token authentication and posting.
* Verify duplicate post prevention.
* Check that failed posts retry.

---

---

## 📅 **PROJECT EXECUTION SUMMARY**

| Phase     | Sub-Phase               | Focus                | Deliverables                     | Priority |
| --------- | ----------------------- | -------------------- | -------------------------------- | -------- |
| **1A–1D** | Promotions CRUD + UI    | Base system setup    | Full promo management + PWA sync | 🔥 High  |
| **2A–2D** | Insights & Analytics    | Dashboards, charts   | Data-driven marketing insights   | 🔥 High  |
| **3A–3D** | Rewards & Notifications | Engagement features  | ₱50 reward logic + PWA alerts    | ⚡ Medium |
| **4A–4D** | Facebook Integration    | External API posting | Auto-publish promos              | 🌙 Low   |

---
