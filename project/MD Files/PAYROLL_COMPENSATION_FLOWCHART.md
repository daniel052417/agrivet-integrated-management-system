# PayrollCompensation System Flowchart

## Main System Workflow

```mermaid
flowchart TD
    A[User Access PayrollCompensation] --> B{Check User Role}
    B -->|Admin/HR/Manager| C[Load Dashboard]
    B -->|Unauthorized| D[Access Denied]
    
    C --> E[Load Initial Data]
    E --> F[Fetch Payroll Periods]
    E --> G[Fetch Tax Rates]
    E --> H[Fetch Benefits]
    E --> I[Fetch Payroll Records]
    
    F --> J[Display Dashboard]
    G --> J
    H --> J
    I --> J
    
    J --> K{Select Tab}
    K -->|Payroll| L[Payroll Tab]
    K -->|Benefits| M[Benefits Tab]
    K -->|Tax Management| N[Tax Tab]
    K -->|Reports| O[Reports Tab]
```

## Payroll Processing Workflow

```mermaid
flowchart TD
    A[Payroll Tab] --> B{Select Period}
    B -->|Existing Period| C[Load Period Data]
    B -->|Create New Period| D[New Period Form]
    
    D --> E[Enter Period Details]
    E --> F[Period Name]
    E --> G[Period Type]
    E --> H[Start Date]
    E --> I[End Date]
    E --> J[Pay Date]
    
    F --> K[Validate Dates]
    G --> K
    H --> K
    I --> K
    J --> K
    
    K -->|Valid| L[Create Period]
    K -->|Invalid| M[Show Error]
    M --> E
    
    L --> N[Period Created]
    C --> O[Display Period Summary]
    N --> O
    
    O --> P{Process Payroll?}
    P -->|Yes| Q[Start Processing]
    P -->|No| R[View Records]
    
    Q --> S[Fetch Active Staff]
    S --> T[Calculate Payroll for Each Employee]
    T --> U[Base Salary Calculation]
    T --> V[Overtime Calculation]
    T --> W[Tax Calculations]
    T --> X[Benefits Deductions]
    
    U --> Y[Gross Pay]
    V --> Y
    W --> Z[Total Deductions]
    X --> Z
    Y --> AA[Net Pay Calculation]
    Z --> AA
    
    AA --> BB[Save Payroll Record]
    BB --> CC{More Employees?}
    CC -->|Yes| T
    CC -->|No| DD[Update Period Totals]
    
    DD --> EE[Processing Complete]
    EE --> FF[Display Results]
    FF --> R
    
    R --> GG[Payroll Records Table]
    GG --> HH[Search/Filter Records]
    GG --> II[View Individual Records]
    GG --> JJ[Export Records]
```

## Tax Calculation Workflow

```mermaid
flowchart TD
    A[Tax Calculation] --> B[Get Employee Salary]
    B --> C[Calculate SSS Contribution]
    B --> D[Calculate PhilHealth]
    B --> E[Calculate Pag-IBIG]
    B --> F[Calculate Withholding Tax]
    
    C --> G[SSS: 11% of salary<br/>Max: ₱2,750]
    D --> H[PhilHealth: 5% of salary<br/>Max: ₱5,000]
    E --> I[Pag-IBIG: ₱100 fixed]
    F --> J{Salary > ₱20,833.33?}
    
    J -->|Yes| K[Withholding Tax:<br/>20% of excess]
    J -->|No| L[Withholding Tax: ₱0]
    
    G --> M[Total Tax Amount]
    H --> M
    I --> M
    K --> M
    L --> M
    
    M --> N[Return Tax Calculations]
```

## Benefits Management Workflow

```mermaid
flowchart TD
    A[Benefits Tab] --> B[Load Benefits Data]
    B --> C[Display Benefits Summary]
    C --> D[Total Benefits Cost]
    C --> E[Employer Contribution]
    C --> F[Active Benefits Count]
    
    C --> G[Benefits Management Table]
    G --> H[View All Benefits]
    H --> I[Benefit Name]
    H --> J[Benefit Type]
    H --> K[Cost Breakdown]
    H --> L[Status]
    
    G --> M{User Action}
    M -->|Add Benefit| N[Add Benefit Form]
    M -->|Edit Benefit| O[Edit Benefit Form]
    M -->|View Details| P[Benefit Details]
    
    N --> Q[Enter Benefit Details]
    Q --> R[Benefit Name]
    Q --> S[Benefit Type]
    Q --> T[Cost Type]
    Q --> U[Cost Value]
    Q --> V[Employer Contribution]
    Q --> W[Employee Contribution]
    
    R --> X[Save Benefit]
    S --> X
    T --> X
    U --> X
    V --> X
    W --> X
    
    X --> Y[Benefit Created]
    Y --> Z[Refresh Benefits List]
    
    O --> AA[Load Benefit Data]
    AA --> BB[Update Benefit]
    BB --> Z
    
    P --> CC[Display Benefit Info]
```

## Tax Rates Management Workflow

```mermaid
flowchart TD
    A[Tax Management Tab] --> B[Load Tax Rates]
    B --> C[Display Tax Summary]
    C --> D[Withholding Tax Rate]
    C --> E[SSS Contribution]
    C --> F[PhilHealth Rate]
    C --> G[Pag-IBIG Amount]
    
    C --> H[Tax Rates Table]
    H --> I[Tax Name]
    H --> J[Tax Type]
    H --> K[Rate Value]
    H --> L[Min/Max Amounts]
    H --> M[Status]
    
    H --> N{User Action}
    N -->|Add Tax Rate| O[Add Tax Rate Form]
    N -->|Edit Tax Rate| P[Edit Tax Rate Form]
    N -->|View Details| Q[Tax Rate Details]
    
    O --> R[Enter Tax Rate Details]
    R --> S[Tax Name]
    R --> T[Tax Type]
    R --> U[Rate Type]
    R --> V[Rate Value]
    R --> W[Min Amount]
    R --> X[Max Amount]
    
    S --> Y[Save Tax Rate]
    T --> Y
    U --> Y
    V --> Y
    W --> Y
    X --> Y
    
    Y --> Z[Tax Rate Created]
    Z --> AA[Refresh Tax Rates List]
    
    P --> BB[Load Tax Rate Data]
    BB --> CC[Update Tax Rate]
    CC --> AA
    
    Q --> DD[Display Tax Rate Info]
```

## Reports Generation Workflow

```mermaid
flowchart TD
    A[Reports Tab] --> B[Load Reports Interface]
    B --> C[Payroll Reports Section]
    B --> D[Quick Actions Section]
    
    C --> E[Monthly Payroll Summary]
    C --> F[Employee Pay Stubs]
    C --> G[Tax Reports]
    C --> H[Benefits Summary]
    
    D --> I[Process Payroll]
    D --> J[Generate Detailed Report]
    D --> K[Tax Calculations]
    D --> L[Benefits Audit]
    
    E --> M{Select Period?}
    F --> M
    G --> M
    H --> M
    I --> M
    J --> M
    K --> M
    L --> M
    
    M -->|Yes| N[Generate Report]
    M -->|No| O[Show Error: Select Period]
    
    N --> P[Create Report Record]
    P --> Q[Set Status: Generating]
    Q --> R[Process Report Data]
    
    R --> S{Report Type}
    S -->|Summary| T[Generate Summary Report]
    S -->|Pay Stubs| U[Generate Pay Stubs]
    S -->|Tax Report| V[Generate Tax Report]
    S -->|Benefits| W[Generate Benefits Report]
    S -->|Detailed| X[Generate Detailed Report]
    
    T --> Y[Save Report File]
    U --> Y
    V --> Y
    W --> Y
    X --> Y
    
    Y --> Z[Update Report Status]
    Z --> AA[Report Generated]
    AA --> BB[Display Download Link]
    
    O --> CC[Return to Reports Tab]
```

## Data Flow Architecture

```mermaid
flowchart LR
    A[PayrollCompensation Component] --> B[payrollApi.ts]
    B --> C[Supabase Client]
    C --> D[Database Tables]
    
    D --> E[payroll_periods]
    D --> F[payroll_records]
    D --> G[tax_rates]
    D --> H[payroll_benefits]
    D --> I[employee_payroll_benefits]
    D --> J[payroll_components]
    D --> K[payroll_reports]
    D --> L[payroll_audit_log]
    
    B --> M[API Functions]
    M --> N[payrollPeriodApi]
    M --> O[payrollRecordsApi]
    M --> P[taxRatesApi]
    M --> Q[payrollBenefitsApi]
    M --> R[payrollReportsApi]
    M --> S[payrollUtils]
    
    N --> T[CRUD Operations]
    O --> T
    P --> T
    Q --> T
    R --> T
    
    T --> U[Create]
    T --> V[Read]
    T --> W[Update]
    T --> X[Delete]
    
    S --> Y[Utility Functions]
    Y --> Z[formatCurrency]
    Y --> AA[calculateTaxBracket]
    Y --> BB[generatePeriodName]
    Y --> CC[validatePeriodDates]
```

## User Role & Permission Flow

```mermaid
flowchart TD
    A[User Login] --> B{Check User Role}
    B -->|Admin| C[Full Access]
    B -->|HR| D[HR Access]
    B -->|Manager| E[Manager Access]
    B -->|Other| F[Limited Access]
    
    C --> G[All Payroll Operations]
    C --> H[All Benefits Management]
    C --> I[All Tax Management]
    C --> J[All Reports]
    C --> K[User Management]
    
    D --> L[Payroll Processing]
    D --> M[Benefits Management]
    D --> N[Tax Management]
    D --> O[Reports Generation]
    D --> P[Staff Management]
    
    E --> Q[View Payroll Data]
    E --> R[Approve Payroll]
    E --> S[Generate Reports]
    E --> T[View Benefits]
    
    F --> U[View Own Payroll]
    F --> V[View Own Benefits]
    
    G --> W[RLS Policies Applied]
    H --> W
    I --> W
    J --> W
    K --> W
    L --> W
    M --> W
    N --> W
    O --> W
    P --> W
    Q --> W
    R --> W
    S --> W
    T --> W
    U --> W
    V --> W
```

## Error Handling & Validation Flow

```mermaid
flowchart TD
    A[User Action] --> B[Form Validation]
    B -->|Valid| C[API Call]
    B -->|Invalid| D[Show Validation Error]
    
    C --> E{API Response}
    E -->|Success| F[Update UI State]
    E -->|Error| G[Handle API Error]
    
    G --> H{Error Type}
    H -->|Network Error| I[Show Network Error]
    H -->|Validation Error| J[Show Validation Error]
    H -->|Permission Error| K[Show Permission Error]
    H -->|Server Error| L[Show Server Error]
    
    I --> M[Retry Option]
    J --> N[Fix Form Data]
    K --> O[Contact Admin]
    L --> P[Report Issue]
    
    D --> Q[Return to Form]
    M --> C
    N --> B
    O --> R[End Process]
    P --> R
    Q --> S[User Corrects Data]
    S --> B
    
    F --> T[Success Message]
    T --> U[Refresh Data]
    U --> V[Update Dashboard]
```

This comprehensive flowchart covers all the major workflows, data flows, and user interactions in your PayrollCompensation system. Each diagram shows a different aspect of the system, from the main user flow to technical implementation details.
