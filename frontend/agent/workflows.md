# Frontend Workflows

> Primary client-side UI and state lifecycles.

---

### 1. User Authentication & Session Boot
```
1. User enters credentials in LoginPage.tsx
2. Form submits to authService.login()
3. On success:
   - Dispatches setCredentials(token, user) to authSlice
   - Token stored in localStorage
   - Redirects to /dashboard via useNavigate()
4. DashboardLayout loads:
   - ProtectedRoute verifies token presence
   - Socket client connects with auth.token
   - Subscribes to notification:unread_count
```

### 2. KYC Submission Wizard Flow
```
1. User navigates to /dashboard/kyc-submit (UserKYCPage.tsx)
2. Step 1: Upload Front & Back ID image files
3. Step 2: Camera capture selfie photo
4. Step 3: Reviewer preview & submit
5. Form data dispatched via kycService.submitKyc(formData)
6. Redirects to /dashboard/kyc-status (KYCStatusPage.tsx)
7. Query periodically polls /api/v1/kyc/status or listens to socket notification
```

### 3. Customer Loan Application Flow
```
1. Customer visits /dashboard/loans/apply (or /:slug/apply)
2. Enters requested amount, tenure months, loan purpose
3. Optional bank statement file upload triggers statement parser
4. Submits via loanService.apply()
5. React Query invalidates ['loans', 'userLoans']
6. Redirects to /dashboard/loans/status
```
