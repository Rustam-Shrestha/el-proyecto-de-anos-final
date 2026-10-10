# **FINGUARD FRONTEND MASTER ENGINEERING PROMPT**

## **THE ABSOLUTE RULE**

**BEFORE WRITING ANY CODE FOR ANY FEATURE:**

1. **Check `/shared` folder** for existing reusable components, hooks, utilities
2. **Use custom icon set** — NO lucide-react imports, NO external CDNs
3. **Extend existing systems** — Do NOT duplicate state, API layers, validation
4. **Contribute to `/shared`** — Every new reusable pattern goes here first
5. **Follow TypeScript strictly** — All types in `/shared/types/`
6. **One source of truth** — No reimplementation of existing functionality

---

# **PART 1: ICON SYSTEM (CUSTOM SVG ONLY)**

## **Rule: ZERO External Icon Libraries**

All icons are self-contained SVG components in `/shared/icons/index.ts`

### **Icon Categories & Exports**

#### **Layout & Navigation**
```tsx
// Usage: import { LayoutDashboard, Menu, X } from '@/shared/icons'

LayoutDashboard          // Dashboard grid icon
Menu                     // Hamburger menu
X                        // Close/X button
ChevronLeft              // Left arrow
ChevronRight             // Right arrow
ChevronDown              // Dropdown arrow
LayoutDashboard          // 4-grid dashboard
FileText                 // Document/file icon
Gauge                    // Analytics/performance
ShieldCheck              // Security/verified
Users                    // Team/users icon
Briefcase                // Business/work
Landmark                 // Bank/institution
Building2                // Company/organization
```

#### **Actions & Controls**
```tsx
Plus                     // Add new
PencilLine               // Edit action
Trash2                   // Delete action
Download                 // Download/export
Upload (UploadArrow)     // Upload action
Check                    // Confirmation
ArrowRight               // Navigate right
ArrowLeft                // Navigate left
CloudUpload              // Cloud upload
CloudDownArrow           // Cloud download
```

#### **Status & Alerts**
```tsx
CheckCircle              // Success ✓
CheckCircle2             // Alt success ✓
CheckCheck               // Verified ✓✓
XCircle                  // Error ✗
AlertTriangleIcon        // Warning ⚠
InfoIcon                 // Information ℹ
CheckCircleIcon          // Success state
XCircleIcon              // Error state
BadgeCheck               // Badge verification
```

#### **Dashboard & Analytics**
```tsx
BarChart3                // Bar chart
Activity                 // Activity feed
CreditCard               // Payment/card
Wallet                   // Wallet/funds
FileBarChart2            // File with chart
FileCheck                // Checked/approved file
ClipboardCheck           // Checklist/tasks
HandCoins                // Loan/transaction
```

#### **User & Profile**
```tsx
UserCircle               // User avatar
UserCircle2              // Alt user avatar
GroupUserIcon            // Multiple users
UserIcon                 // Single user
```

#### **Communication**
```tsx
MessageSquare            // Chat/message bubble
MessageSquareText        // Chat with text
CommentIcon              // Comment
Bell                     // Notifications
SendIcon                 // Send message
SendHorizonal            // Send right arrow
ReplyIcon                // Reply action
```

#### **Time & Calendar**
```tsx
Calendar                 // Calendar picker
CalendarDays             // Calendar with days
CalenderIcon             // Calendar
Clock                    // Time/duration
ClockIcon                // Time display
```

#### **Input & Forms**
```tsx
Eye                      // Show password
EyeOff                   // Hide password
EyeIcon                  // View icon
FileSpreadsheet          // Excel/CSV upload
Table                    // Table view
FilterIcon               // Filter controls
SearchIcon               // Search field
PaperclipIcon            // File attachment
```

#### **Utilities & Common**
```tsx
DownArrow                // Scroll down
LeftIcon / RightIcon     // Directional
DollorIcon               // Currency/price
ColorIcon                // Color picker
QuestionIcon             // Help/FAQ
MoonIcon                 // Theme toggle
```

#### **Misc / Deprecated but available**
```tsx
EllipsisVerticalIcon     // More options (...)
DocumentIcon             // File document
EmailIcon                // Email address
TrashIcon                // Trash/delete
LogoutIcon               // Logout
```

### **Icon Component Signature**

```tsx
interface IconProps {
  className?: string  // Tailwind classes, default: "size-6"
}

// Usage Pattern
<CheckCircle className="size-5 text-green-600" />
<AlertTriangleIcon className="size-6 text-yellow-500" />
<XCircle className="size-7 text-red-600" />
```

### **Where to Import Icons**

```tsx
// ✓ CORRECT
import { CheckCircle, XCircle, AlertTriangleIcon } from '@/shared/icons'

// ✗ WRONG - NEVER
import { Icon } from 'lucide-react'
import { CheckCircle } from '@heroicons/react/24/outline'
```

---

# **PART 2: REUSABLE COMPONENT SYSTEM**

## **Rule: Use Existing Components, Do NOT Create Duplicates**

### **Shared Components Location**
All components in: `/shared/components/`

### **Core Input Components** (Form building blocks)

#### **InputField**
```tsx
// @/shared/components/InputField.tsx
import { InputField } from '@/shared/components'

<InputField
  label="Email Address"
  type="email"
  placeholder="user@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  required
  className="w-full"
/>
```

**Replaces:** `<input type="text|email|number|password" />`

---

#### **SelectField**
```tsx
// Replaces: <select><option /></select>

<SelectField
  label="Select Role"
  options={[
    { value: 'CUSTOMER', label: 'Customer' },
    { value: 'LOAN_OFFICER', label: 'Loan Officer' },
    { value: 'ADMIN', label: 'Admin' }
  ]}
  value={role}
  onChange={(val) => setRole(val)}
  placeholder="Choose a role"
  error={roleError}
/>
```

---

#### **CustomCheckbox**
```tsx
// Replaces: <input type="checkbox" />

<CustomCheckbox
  label="I agree to terms"
  checked={agreed}
  onChange={(e) => setAgreed(e.target.checked)}
  error={agreeError}
/>
```

---

#### **CustomRadioField**
```tsx
// Replaces: <input type="radio" />

<CustomRadioField
  label="Approval Status"
  options={[
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'PENDING', label: 'Pending Review' }
  ]}
  value={status}
  onChange={(val) => setStatus(val)}
/>
```

---

#### **CustomTextArea**
```tsx
// Replaces: <textarea />

<CustomTextArea
  label="Loan Officer Notes"
  placeholder="Add notes about this application..."
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  rows={4}
  maxLength={500}
  error={notesError}
/>
```

---

#### **CustomFileUpload**
```tsx
// Replaces: <input type="file" />

<CustomFileUpload
  label="Upload Document"
  accept=".pdf,.jpg,.png"
  onFileSelect={(file) => handleFileSelect(file)}
  maxSize={5 * 1024 * 1024}  // 5MB
  error={fileError}
  hint="Accepted: PDF, JPG, PNG (max 5MB)"
/>
```

---

#### **CustomDatePicker**
```tsx
// Replaces: <input type="date" />

<CustomDatePicker
  label="Date of Birth"
  value={dob}
  onChange={(date) => setDob(date)}
  maxDate={new Date()}
  error={dobError}
/>
```

---

#### **CustomTimePicker**
```tsx
// Replaces: <input type="time" />

<CustomTimePicker
  label="Appointment Time"
  value={time}
  onChange={(t) => setTime(t)}
/>
```

---

#### **MultiSelectField**
```tsx
// Replaces custom multi-select dropdowns

<MultiSelectField
  label="Select Document Types"
  options={[
    { value: 'ID_PROOF', label: 'ID Proof' },
    { value: 'ADDRESS_PROOF', label: 'Address Proof' },
    { value: 'INCOME_CERT', label: 'Income Certificate' }
  ]}
  value={selectedDocs}
  onChange={(vals) => setSelectedDocs(vals)}
  placeholder="Choose documents..."
/>
```

---

#### **MultiSelectDatePicker**
```tsx
// Replaces: manual date range selection UI

<MultiSelectDatePicker
  label="Select Date Range"
  startDate={startDate}
  endDate={endDate}
  onStartChange={(d) => setStartDate(d)}
  onEndChange={(d) => setEndDate(d)}
/>
```

---

### **Display Components**

#### **Button**
```tsx
// Replaces: <button />, <a href="" />

import { Button } from '@/shared/components'

<Button
  variant="primary"      // 'primary' | 'secondary' | 'danger' | 'success'
  size="md"              // 'sm' | 'md' | 'lg'
  disabled={false}
  onClick={() => handleSubmit()}
  className="w-full"
  icon={<CheckCircle />}
  loading={isLoading}
>
  Submit Application
</Button>

<Button variant="secondary" size="sm">
  Cancel
</Button>
```

---

#### **Card**
```tsx
// Replaces: <div className="bg-white rounded border p-4">

import { Card } from '@/shared/components'

<Card className="p-6">
  <h3 className="font-semibold">Loan Summary</h3>
  <p>Amount: ₹500,000</p>
</Card>
```

---

#### **StatusBadge**
```tsx
// Replaces: manually styled status labels

<StatusBadge status="APPROVED" />
// Output: Green badge "APPROVED"

<StatusBadge status="REJECTED" />
// Output: Red badge "REJECTED"

<StatusBadge status="PENDING" />
// Output: Yellow badge "PENDING"
```

---

#### **DocumentStatusBadge**
```tsx
// Replaces: manual document status styling

<DocumentStatusBadge status="VERIFIED" />
// Green checkmark + "VERIFIED"

<DocumentStatusBadge status="PENDING" />
// Yellow clock + "PENDING"

<DocumentStatusBadge status="REJECTED" />
// Red X + "REJECTED"
```

---

#### **AlertBox / ErrorAlert / SuccessAlert**
```tsx
// Replaces: manually styled alert divs

import { AlertBox, ErrorAlert, SuccessAlert } from '@/shared/components'

<ErrorAlert message="Invalid email address" />

<SuccessAlert message="Application submitted successfully" />

<AlertBox type="info" message="Your loan is under review" />
```

---

#### **LoadingSpinner**
```tsx
// Replaces: custom spinner implementations

import { LoadingSpinner } from '@/shared/components'

<LoadingSpinner size="md" color="blue" />
```

---

#### **SkeletonLoader**
```tsx
// Replaces: manual loading state UI

<SkeletonLoader rows={3} width="100%" height="20px" />
```

---

#### **EmptyState**
```tsx
// Replaces: "No data" message divs

import { EmptyState } from '@/shared/components'

<EmptyState
  icon={<Users />}
  title="No Applications Found"
  message="Start by creating a new loan application."
  action={<Button>Create New</Button>}
/>
```

---

#### **ErrorState**
```tsx
// Replaces: error display screens

<ErrorState
  icon={<AlertTriangleIcon />}
  title="Error Loading Data"
  message="Something went wrong. Please try again."
  retryAction={() => refetch()}
/>
```

---

### **Table Components**

#### **DataTable**
```tsx
// Replaces: <table> element + custom pagination + sorting

import { DataTable } from '@/shared/components'

<DataTable
  columns={[
    { key: 'id', label: 'Application ID', sortable: true },
    { key: 'name', label: 'Customer Name', sortable: true },
    { key: 'amount', label: 'Loan Amount', sortable: false },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> }
  ]}
  data={loans}
  pagination={{
    page: currentPage,
    pageSize: 10,
    total: totalLoans
  }}
  onPageChange={(newPage) => setCurrentPage(newPage)}
  onSort={(column, direction) => handleSort(column, direction)}
  isLoading={loading}
  onRowClick={(row) => navigate(`/loans/${row.id}`)}
/>
```

---

#### **TablePagination**
```tsx
// Replaces: custom pagination logic

<TablePagination
  currentPage={page}
  pageSize={10}
  total={total}
  onPageChange={(p) => setPage(p)}
/>
```

---

### **Layout Components**

#### **PageContainer**
```tsx
// Replaces: manual page wrapper divs

import { PageContainer } from '@/shared/components'

<PageContainer>
  {/* All page content automatically has consistent padding/max-width */}
</PageContainer>
```

---

#### **PageHeader**
```tsx
// Replaces: repeated heading/breadcrumb structures

<PageHeader
  title="Loan Applications"
  breadcrumbs={[
    { label: 'Dashboard', href: '/' },
    { label: 'Loans', href: '/loans' },
    { label: 'Applications', current: true }
  ]}
  action={<Button>New Application</Button>}
/>
```

---

#### **Navbar**
```tsx
// Replaces: custom navigation bar

import { Navbar } from '@/shared/components'

<Navbar
  logo="FinGuard"
  items={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Applications', href: '/loans' }
  ]}
  userMenu={<UserDropdown />}
/>
```

---

#### **Sidebar**
```tsx
// Replaces: custom side navigation

import { Sidebar } from '@/shared/components'

<Sidebar
  items={navItems}
  activeItem={currentPath}
  onItemClick={(path) => navigate(path)}
  collapsed={sidebarCollapsed}
/>
```

---

### **Modal/Dialog Components**

#### **Modal**
```tsx
// Replaces: custom dialog/modal implementations

import { Modal } from '@/shared/components'

<Modal
  isOpen={isOpen}
  title="Confirm Approval"
  onClose={() => setIsOpen(false)}
>
  <p>Are you sure you want to approve this loan?</p>
  <div className="flex gap-2 mt-4">
    <Button variant="primary" onClick={handleApprove}>Confirm</Button>
    <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
  </div>
</Modal>
```

---

#### **NotificationModal**
```tsx
// Replaces: custom notification popups

<NotificationModal
  type="success"
  title="Application Submitted"
  message="Your loan application has been submitted successfully."
  onClose={() => setShowNotif(false)}
/>
```

---

#### **NotificationBell**
```tsx
// Reusable notification trigger

<NotificationBell
  count={unreadCount}
  onClick={() => setShowNotifications(true)}
/>
```

---

### **Tooltip & Popover**

#### **Tooltip**
```tsx
// Replaces: title attribute + custom tooltips

import { Tooltip } from '@/shared/components'

<Tooltip text="Click to view details">
  <Button>More Info</Button>
</Tooltip>
```

---

### **Filter & Search**

#### **FilterBar**
```tsx
// Replaces: manual filter control implementations

import { FilterBar } from '@/shared/components'

<FilterBar
  filters={[
    { key: 'status', label: 'Status', options: ['PENDING', 'APPROVED', 'REJECTED'] },
    { key: 'loanOfficer', label: 'Loan Officer', options: loanOfficers }
  ]}
  onApplyFilters={(filters) => handleFilter(filters)}
  onReset={() => resetFilters()}
/>
```

---

### **Pagination**

#### **PaginationControls**
```tsx
// Replaces: custom pagination UI

<PaginationControls
  currentPage={page}
  totalPages={Math.ceil(total / pageSize)}
  onPrevious={() => setPage(page - 1)}
  onNext={() => setPage(page + 1)}
  onPageSelect={(p) => setPage(p)}
/>
```

---

# **PART 3: REUSABLE HOOKS SYSTEM**

## **Rule: Always Check Hooks First Before Writing New Logic**

### **Authentication Hooks**

#### **useAuth()**
```tsx
import { useAuth } from '@/shared/hooks'

const { user, isAuthenticated, login, logout, loading } = useAuth()

if (!isAuthenticated) {
  return <Navigate to="/login" />
}
```

**What it provides:**
- `user`: Current user object
- `isAuthenticated`: Boolean
- `login(email, password)`: Login action
- `logout()`: Clear auth state
- `loading`: Loading state
- Auto-token refresh

---

#### **useUser()**
```tsx
const { userId, userRole, tenantId, email } = useUser()
```

**What it provides:**
- Current user details
- User role (CUSTOMER, LOAN_OFFICER, ADMIN, SUPERADMIN)
- Tenant context
- Email

---

#### **useAdmin()**
```tsx
const { canAccessAdminPanel, canManageUsers, canViewReports } = useAdmin()

if (!canAccessAdminPanel) {
  return <AccessDenied />
}
```

**What it provides:**
- Admin permission checks
- RBAC boolean flags

---

#### **useTenant()**
```tsx
const { tenantId, tenantName, tenantMetadata } = useTenant()
```

**What it provides:**
- Current tenant context
- Tenant isolation
- Tenant metadata

---

### **API & Data Hooks**

#### **useApi()**
```tsx
// For one-off API calls

import { useApi } from '@/shared/hooks'

const { data, loading, error, execute } = useApi('/api/loans')

// Call it manually
execute({ method: 'POST', body: { amount: 500000 } })
```

---

#### **useApiQuery()**
```tsx
// For GET requests that run automatically

const { data: loans, loading, error, refetch } = useApiQuery('/api/loans/my-loans')

return (
  <>
    {loading ? <LoadingSpinner /> : <LoansList loans={loans} />}
    <Button onClick={refetch}>Refresh</Button>
  </>
)
```

---

#### **useApiMutation()**
```tsx
// For POST/PUT/DELETE operations

const { mutate: submitApplication, loading } = useApiMutation('/api/loans', 'POST')

const handleSubmit = async (formData) => {
  const result = await submitApplication(formData)
  if (result.success) {
    showSuccess('Application submitted!')
  }
}
```

---

### **UI & Form Hooks**

#### **useToast()**
```tsx
import { useToast } from '@/shared/hooks'

const { showSuccess, showError, showInfo } = useToast()

showSuccess('Loan approved successfully!')
showError('Failed to submit application')
showInfo('Your application is under review')
```

**Replaces:** Custom toast implementation

---

#### **useModal()**
```tsx
const { isOpen, open, close } = useModal()

return (
  <>
    <Button onClick={open}>Open Modal</Button>
    <Modal isOpen={isOpen} onClose={close}>
      {/* Modal content */}
    </Modal>
  </>
)
```

---

#### **useFormValidation()**
```tsx
import { useFormValidation } from '@/shared/hooks'

const { values, errors, touched, handleChange, handleBlur, isValid } = useFormValidation({
  initialValues: { email: '', amount: '' },
  validationSchema: applicationSchema,
  onSubmit: handleSubmit
})

return (
  <InputField
    value={values.email}
    onChange={handleChange('email')}
    onBlur={handleBlur('email')}
    error={touched.email && errors.email}
  />
)
```

---

### **Utility Hooks**

#### **useDebounce()**
```tsx
const [searchTerm, setSearchTerm] = useState('')
const debouncedTerm = useDebounce(searchTerm, 500)

useEffect(() => {
  // Only run search after user stops typing for 500ms
  performSearch(debouncedTerm)
}, [debouncedTerm])
```

---

#### **useClickOutside()**
```tsx
const modalRef = useRef(null)
useClickOutside(modalRef, () => closeModal())

return <div ref={modalRef}>{/* Modal content */}</div>
```

---

#### **useConfirmation()**
```tsx
const { confirm } = useConfirmation()

const handleDelete = async () => {
  const confirmed = await confirm('Are you sure you want to delete this?')
  if (confirmed) {
    deleteItem()
  }
}
```

---

#### **useLocalStorage()**
```tsx
const [theme, setTheme] = useLocalStorage('theme', 'light')

// Automatically persisted to localStorage
setTheme('dark')  // Also updates localStorage
```

---

### **Business Logic Hooks**

#### **useKyc()**
```tsx
const { kycStatus, submitKyc, verifyFace, getKycDocuments } = useKyc()

const handleDocumentUpload = (file) => {
  submitKyc({ documentType: 'ID_PROOF', file })
}
```

---

#### **useLoans()**
```tsx
const { loans, myLoans, submitApplication, approveApplication, loading } = useLoans()

// Fetch all loans (admin only)
const allLoans = loans

// Fetch current user's loans
const userLoans = myLoans
```

---

#### **useUsers()**
```tsx
const { users, createUser, updateUserRole, deleteUser } = useUsers()

// Only available to ADMIN role
```

---

#### **useUsersList()**
```tsx
const { users, total, page, pageSize, setPage, loading } = useUsersList({
  tenantId: currentTenant,
  limit: 20
})
```

---

# **PART 4: REUSABLE UTILITIES SYSTEM**

## **Rule: Use Utilities for Cross-Cutting Concerns**

All in: `/shared/utils/`

### **API Client**

```tsx
// /shared/utils/apiClient.ts
import { apiClient } from '@/shared/utils'

// Automatic:
// - Token injection from localStorage
// - Error handling
// - Base URL setup
// - Retry logic

const response = await apiClient.get('/loans/my-loans')
const result = await apiClient.post('/loans', { amount: 500000 })
const deleted = await apiClient.delete('/loans/123')
```

---

### **Socket Client**

```tsx
// /shared/utils/socketClient.ts
import { socketClient } from '@/shared/utils'

socketClient.emit('message:send', { receiverId: 5, content: 'Hello' })
socketClient.on('message:receive', (msg) => addMessageToChat(msg))
socketClient.disconnect()
```

---

### **Validators**

```tsx
// /shared/utils/validators.ts
import { validators } from '@/shared/utils'

validators.isValidEmail('user@example.com')  // true
validators.isValidPhone('+9771234567890')    // true
validators.isValidPAN('AAAPA5055K')          // true
validators.isStrongPassword('P@ssw0rd!')     // true
```

---

### **API Error Handling**

```tsx
// /shared/utils/apiError.ts
import { ApiError, handleApiError } from '@/shared/utils'

try {
  await apiClient.post('/loans', data)
} catch (error) {
  const { message, statusCode, details } = handleApiError(error)
  showError(message)
}
```

---

### **Role & Permission Utils**

```tsx
// /shared/utils/roleUtils.ts
import { roleUtils } from '@/shared/utils'

roleUtils.canApproveLoans(userRole)        // true if LOAN_OFFICER or ADMIN
roleUtils.canManageUsers(userRole)         // true if ADMIN or SUPERADMIN
roleUtils.canViewReports(userRole)         // true if ADMIN
roleUtils.isSuperAdmin(userRole)           // true if SUPERADMIN
```

---

### **Format Utilities**

```tsx
// /shared/utils/formatters.ts
import { formatters } from '@/shared/utils'

formatters.currency(500000)                // "₹5,00,000"
formatters.phone('+9771234567890')         // "+977 1234567890"
formatters.pan('AAAPA5055K')               // "AAAP A5055K"
formatters.date(new Date())                // "03 Oct 2026"
formatters.datetime(new Date())            // "03 Oct 2026, 4:30 PM"
formatters.percentage(0.85)                // "85%"
```

---

### **Export Utilities**

```tsx
// /shared/utils/exportData.ts
import { exportToExcel, exportToCSV, exportToPDF } from '@/shared/utils'

// Export table data
exportToExcel(tableData, 'loans-report.xlsx')
exportToCSV(tableData, 'loans-report.csv')
exportToPDF(tableData, 'loans-report.pdf')
```

---

### **Constants**

```tsx
// /shared/utils/constants.ts
import { LOAN_STATUSES, USER_ROLES, KYC_STATUSES, API_ENDPOINTS } from '@/shared/utils'

const loanStatus = LOAN_STATUSES.APPROVED  // 'APPROVED'
const role = USER_ROLES.LOAN_OFFICER       // 'LOAN_OFFICER'
const kycStatus = KYC_STATUSES.VERIFIED    // 'VERIFIED'
```

---

### **Environment Utilities**

```tsx
// /shared/utils/env.ts
import { env } from '@/shared/utils'

const apiBaseUrl = env.API_URL
const socketUrl = env.SOCKET_URL
const maxFileSize = env.MAX_FILE_SIZE
```

---

# **PART 5: STATE MANAGEMENT SYSTEM**

## **Rule: Extend Existing Slices, Do NOT Create New Global State**

All in: `/store/slices/`

### **Auth Slice**

```tsx
import { useAppDispatch, useAppSelector } from '@/store'
import { authSlice } from '@/store/slices'

// Get state
const { user, token, isAuthenticated } = useAppSelector(state => state.auth)

// Dispatch actions
const dispatch = useAppDispatch()
dispatch(authSlice.actions.login({ email, password }))
dispatch(authSlice.actions.logout())
dispatch(authSlice.actions.setUser(userData))
```

**Manage:**
- User authentication state
- JWT token
- Login/logout
- Token refresh

---

### **UI Slice**

```tsx
const { sidebarOpen, theme, notifications } = useAppSelector(state => state.ui)

dispatch(authSlice.actions.toggleSidebar())
dispatch(authSlice.actions.setTheme('dark'))
dispatch(authSlice.actions.addNotification(notifData))
```

**Manage:**
- UI state (sidebar, modal open/close)
- Theme
- Notifications
- Loading states

---

### **Account/Profile Slice**

```tsx
const { profile, settings, preferences } = useAppSelector(state => state.account)

dispatch(accountSlice.actions.updateProfile(newData))
dispatch(accountSlice.actions.changePassword(oldPwd, newPwd))
```

**Manage:**
- User profile data
- Account settings
- User preferences

---

### **Tenant Slice**

```tsx
const { currentTenant, tenants } = useAppSelector(state => state.tenant)

dispatch(tenantSlice.actions.setCurrentTenant(tenantId))
dispatch(tenantSlice.actions.fetchTenants())
```

**Manage:**
- Current tenant context
- Tenant list
- Tenant isolation

---

### **Rules for State Management**

**IF you need global state:**
1. Check if it already exists in existing slices
2. If not, extend the relevant slice (auth, ui, account, tenant)
3. NEVER create a new slice without team approval

**DO NOT use global state for:**
- Form data (use local state + hooks)
- Page-specific UI (use local state)
- One-off API responses (use `useApiQuery`)

---

# **PART 6: API & SERVICES SYSTEM**

## **Rule: Use Existing API Layers**

All in: `/shared/services/` and `/features/*/api/`

### **API Endpoints**

```tsx
// /shared/services/api/endpoints.ts
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
    verifyOtp: '/auth/verify-otp'
  },
  loans: {
    create: '/loans',
    getAll: '/loans',
    getById: (id) => `/loans/${id}`,
    approve: (id) => `/loans/${id}/approve`,
    reject: (id) => `/loans/${id}/reject`,
    update: (id) => `/loans/${id}`
  },
  kyc: {
    submit: '/kyc/submit',
    getStatus: '/kyc/status',
    uploadDocument: '/kyc/upload-document',
    verifyFace: '/kyc/verify-face'
  },
  users: {
    getAll: '/users',
    getById: (id) => `/users/${id}`,
    create: '/users',
    updateRole: (id) => `/users/${id}/role`,
    delete: (id) => `/users/${id}`
  }
}
```

**Usage:**
```tsx
import { API_ENDPOINTS } from '@/shared/services'

const url = API_ENDPOINTS.loans.getById(123)  // '/loans/123'
```

---

### **Query Factory**

```tsx
// /shared/services/queryFactory.ts
import { createQuery } from '@/shared/services'

// Automatically creates query with caching, refetch, etc.
const loansQuery = createQuery('/api/loans', { staleTime: 5 * 60 * 1000 })
```

---

### **Mutation Factory**

```tsx
// /shared/services/mutationFactory.ts
import { createMutation } from '@/shared/services'

// Automatically handles error, success, loading states
const submitLoanMutation = createMutation('/api/loans', 'POST')
```

---

### **Feature-Specific API**

```tsx
// /features/loans/api/loansApi.ts
// Use this for complex business logic wrapping multiple endpoints

export const loansApi = {
  submitApplicationWithDocuments: async (appData, documents) => {
    // 1. Upload documents first
    const docUrls = await Promise.all(documents.map(doc => uploadDocument(doc)))
    
    // 2. Then submit application
    return apiClient.post('/loans', { ...appData, documentUrls: docUrls })
  },
  
  getApplicationWithRiskScore: async (loanId) => {
    const app = await apiClient.get(`/loans/${loanId}`)
    const riskScore = await apiClient.get(`/loans/${loanId}/risk-score`)
    return { ...app, riskScore }
  }
}
```

**Usage:**
```tsx
import { loansApi } from '@/features/loans/api'

const result = await loansApi.submitApplicationWithDocuments(formData, files)
```

---

# **PART 7: FORMS & VALIDATION SYSTEM**

## **Rule: Use Validation Schema, Not Manual Checks**

All schemas in: `/shared/validation/schemas/`

### **Validation Schemas**

```tsx
// /shared/validation/schemas/applicationSchema.ts
import * as yup from 'yup'

export const applicationSchema = yup.object().shape({
  loanAmount: yup
    .number()
    .required('Loan amount is required')
    .min(10000, 'Minimum loan amount is ₹10,000')
    .max(1000000, 'Maximum loan amount is ₹10,00,000'),
  
  tenure: yup
    .number()
    .required('Tenure is required')
    .oneOf([6, 12, 24, 36, 48, 60], 'Invalid tenure'),
  
  purpose: yup
    .string()
    .required('Loan purpose is required'),
  
  annualIncome: yup
    .number()
    .required('Annual income is required')
    .positive('Income must be positive')
})

// Usage
const { values, errors, isValid } = useFormValidation({
  initialValues: { loanAmount: '', tenure: '', purpose: '', annualIncome: '' },
  validationSchema: applicationSchema,
  onSubmit: handleSubmit
})
```

---

### **Reusable Form Patterns**

#### **Simple Form**
```tsx
const SimpleForm = () => {
  const { values, errors, touched, handleChange, handleBlur, handleSubmit } = useFormValidation({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: handleLoginSubmit
  })

  return (
    <form onSubmit={handleSubmit}>
      <InputField
        label="Email"
        value={values.email}
        onChange={handleChange('email')}
        onBlur={handleBlur('email')}
        error={touched.email && errors.email}
      />
      
      <InputField
        label="Password"
        type="password"
        value={values.password}
        onChange={handleChange('password')}
        error={touched.password && errors.password}
      />
      
      <Button type="submit">Login</Button>
    </form>
  )
}
```

---

#### **Dynamic Form**
```tsx
const DynamicForm = ({ fields }) => {
  const { values, errors, handleChange, handleSubmit } = useFormValidation({
    initialValues: fields.reduce((acc, f) => ({ ...acc, [f.name]: '' }), {}),
    validationSchema: buildDynamicSchema(fields),
    onSubmit: handleFormSubmit
  })

  return (
    <form onSubmit={handleSubmit}>
      {fields.map(field => (
        <div key={field.name}>
          {field.type === 'text' && (
            <InputField value={values[field.name]} onChange={handleChange(field.name)} />
          )}
          {field.type === 'select' && (
            <SelectField options={field.options} value={values[field.name]} onChange={handleChange(field.name)} />
          )}
        </div>
      ))}
      <Button type="submit">Submit</Button>
    </form>
  )
}
```

---

#### **Multi-Step Form**
```tsx
const MultiStepForm = () => {
  const [step, setStep] = useState(1)
  
  const { values, errors, handleChange, handleSubmit, isValid } = useFormValidation({
    initialValues: { kycData: {}, financeData: {}, loanData: {} },
    validationSchema: multiStepSchema,
    onSubmit: handleFinalSubmit
  })

  return (
    <>
      {step === 1 && <KycStep values={values.kycData} onChange={(data) => updateStep('kycData', data)} />}
      {step === 2 && <FinanceStep values={values.financeData} onChange={(data) => updateStep('financeData', data)} />}
      {step === 3 && <LoanStep values={values.loanData} onChange={(data) => updateStep('loanData', data)} />}
      
      <Button onClick={() => setStep(step - 1)} disabled={step === 1}>Previous</Button>
      {step < 3 ? (
        <Button onClick={() => setStep(step + 1)}>Next</Button>
      ) : (
        <Button onClick={handleSubmit}>Submit</Button>
      )}
    </>
  )
}
```

---

# **PART 8: TYPES SYSTEM**

## **Rule: Define All Types in `/shared/types/`**

### **Type Organization**

```tsx
// /shared/types/index.ts
export * from './models'
export * from './api'
export * from './ui'
export * from './forms'
```

### **Models**

```tsx
// /shared/types/models.ts

export interface User {
  id: number
  email: string
  fullName: string
  role: UserRole
  tenantId?: number
  createdAt: string
}

export interface Loan {
  id: number
  customerId: number
  amount: number
  tenure: number
  status: LoanStatus
  riskScore: number
  createdAt: string
}

export interface KYC {
  id: number
  userId: number
  status: KYCStatus
  identityDocUrl: string
  faceSelfieUrl: string
  verifiedAt?: string
}

export type UserRole = 'CUSTOMER' | 'LOAN_OFFICER' | 'ADMIN' | 'SUPERADMIN'
export type LoanStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
export type KYCStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'
```

---

### **API Response Types**

```tsx
// /shared/types/api.ts

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: unknown
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
```

---

### **UI Component Props**

```tsx
// /shared/types/ui.ts

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  children: React.ReactNode
}

export interface InputFieldProps {
  label?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  type?: string
  placeholder?: string
}
```

---

# **PART 9: IMPLEMENTATION CHECKLIST**

## **Before Starting ANY Feature Development**

- [ ] **Check Icons** — Use only custom SVG icons from `/shared/icons`
- [ ] **Check Components** — Use existing reusable components from `/shared/components`
- [ ] **Check Hooks** — Use existing hooks from `/shared/hooks`
- [ ] **Check Types** — All types from `/shared/types`, create new types there first
- [ ] **Check Utils** — Use existing utilities from `/shared/utils`
- [ ] **Check Store** — Extend existing slices, don't create new ones
- [ ] **Check API** — Use existing endpoints and query/mutation factories
- [ ] **Check Validation** — Use existing schemas from `/shared/validation`

---

## **When Adding New Reusable Assets**

**New Component?**
1. Add to `/shared/components/`
2. Export from `/shared/components/index.ts`
3. Document usage in this prompt
4. Update team

**New Hook?**
1. Add to `/shared/hooks/`
2. Export from `/shared/hooks/index.ts`
3. Document usage in this prompt
4. Update team

**New Utility?**
1. Add to `/shared/utils/`
2. Export from `/shared/utils/index.ts`
3. Document with examples in this prompt
4. Update team

**New Type?**
1. Add to `/shared/types/models.ts` or appropriate file
2. Export from `/shared/types/index.ts`
3. Use consistently across codebase

**New Validation Schema?**
1. Add to `/shared/validation/schemas/`
2. Export from `/shared/validation/schemas/index.ts`
3. Use with `useFormValidation` hook

**New Icon?**
1. Add to `/shared/icons/index.ts`
2. Self-contained SVG component
3. Follow existing naming convention
4. Export with other icons
5. NO external imports

---

# **PART 10: DO NOT LIST**

### **FORBIDDEN Imports**
```tsx
// ✗ NEVER
import { Icon } from 'lucide-react'
import { Icon } from '@heroicons/react/24/outline'
import { Button } from '@shadcn/ui/button'
import styled from 'styled-components'
import { toast } from 'sonner'

// ✓ CORRECT
import { CheckCircle } from '@/shared/icons'
import { Button } from '@/shared/components'
import { useToast } from '@/shared/hooks'
```

### **FORBIDDEN Patterns**
```tsx
// ✗ NEVER
// Raw HTML form elements
<input type="text" />
<textarea />
<select><option /></select>
<button />

// Manual API calls
fetch('/api/loans').then(r => r.json())
axios.get('/api/loans')

// Manual state management
useState for global concerns
Multiple sources of truth for same data

// Inline styling
style={{ color: 'red' }}
className="bg-red-500 text-white p-4 rounded"

// ✓ CORRECT
// Use reusable components
<InputField value={name} onChange={setName} />
<SelectField options={options} value={selected} onChange={setSelected} />
<Button onClick={handleClick}>Submit</Button>

// Use hooks
const { data, loading } = useApiQuery('/api/loans')
const { mutate: submitLoan } = useApiMutation('/api/loans', 'POST')

// Use global state
const { loans } = useAppSelector(state => state.loans)
dispatch(loansSlice.actions.setLoans(data))
```

---

# **PART 11: ARCHITECTURE DIAGRAM**

```
┌─────────────────────────────────────────────────────────────┐
│                    FEATURE COMPONENTS                       │
│  (features/loans/, features/kyc/, features/auth/, etc)      │
└─────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │  Reusable Component Library     │
        │  (/shared/components/)          │
        │  Button, Input, Modal, Table    │
        └─────────────────────────────────┘
                     ↓
    ┌────────────────────────────────────────────────┐
    │           Support Layers                       │
    ├────────────────────────────────────────────────┤
    │  Icons        Hooks         Utils   Types       │
    │  /shared/     /shared/      /shared/ /shared/   │
    │  icons/       hooks/        utils/   types/     │
    │                                                  │
    │  Validation   API Services    Store             │
    │  /shared/     /shared/services/ /store/         │
    │  validation/                                    │
    └────────────────────────────────────────────────┘
                     ↓
    ┌────────────────────────────────────────────────┐
    │       External Integrations (HTTP/WS)          │
    │  apiClient, socketClient, queryClient          │
    └────────────────────────────────────────────────┘
```

---

# **PART 12: QUICK START TEMPLATE**

Copy this when creating a new feature:

```tsx
// features/[feature]/components/[Component].tsx
import React, { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { useApiQuery, useToast, useFormValidation } from '@/shared/hooks'
import { Button, InputField, SelectField, Card, PageHeader } from '@/shared/components'
import { CheckCircle, AlertTriangleIcon } from '@/shared/icons'
import { API_ENDPOINTS } from '@/shared/services'
import { [FeatureType] } from '@/shared/types'
import { [featureSchema] } from '@/shared/validation/schemas'
import { [featureApi] } from '../api'

interface Props {
  initialData?: [FeatureType]
  onSuccess?: (data: [FeatureType]) => void
}

export const [Component]: React.FC<Props> = ({ initialData, onSuccess }) => {
  const dispatch = useAppDispatch()
  const { showSuccess, showError } = useToast()
  const { data, loading, error } = useApiQuery(API_ENDPOINTS.[feature].getAll)

  const { values, errors, touched, handleChange, handleSubmit, isValid } = useFormValidation({
    initialValues: initialData || { field1: '', field2: '' },
    validationSchema: [featureSchema],
    onSubmit: async (formData) => {
      try {
        const result = await [featureApi].submit(formData)
        showSuccess('Success!')
        onSuccess?.(result)
      } catch (err) {
        showError('Error occurred')
      }
    }
  })

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState />

  return (
    <PageContainer>
      <PageHeader title="[Page Title]" />
      
      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          <InputField
            label="Field 1"
            value={values.field1}
            onChange={handleChange('field1')}
            error={touched.field1 && errors.field1}
          />
          
          <SelectField
            label="Field 2"
            options={selectOptions}
            value={values.field2}
            onChange={handleChange('field2')}
            error={touched.field2 && errors.field2}
          />
          
          <div className="flex gap-2">
            <Button type="submit" disabled={!isValid}>
              <CheckCircle className="mr-2" /> Submit
            </Button>
            <Button variant="secondary">Cancel</Button>
          </div>
        </form>
      </Card>
    </PageContainer>
  )
}
```

---

# **END OF MASTER PROMPT**

**This document is the SINGLE SOURCE OF TRUTH for all frontend development.**

**Every component, hook, icon, utility, and pattern must be:**
- **Reusable** — Used across multiple features
- **Shared** — In `/shared/` folder
- **Documented** — Referenced in this prompt
- **Type-safe** — Full TypeScript coverage
- **Tested** — Unit tests for utilities/hooks
- **Consistent** — Following established patterns

**No exceptions. No reimplementation. No shortcuts.**

---

**Maintained by:** FinGuard Frontend Team  
**Last Updated:** Oct 2026  
**Version:** 1.0 (Enterprise Grade)
