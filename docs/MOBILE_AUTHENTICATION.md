# Mobile Authentication Architecture

## Overview

The React Native mobile app implements a modular authentication system that communicates with the Node.js backend API. The architecture emphasizes separation of concerns, reusability, and robust error handling.

## 📁 Architecture Structure

```
ExpenseTracker.UI/mobile/
├── hooks/
│   └── useAuth.ts              # Custom authentication hooks
├── components/
│   ├── AuthErrorBoundary.tsx   # Error boundary for auth flows
│   ├── AuthInputs.tsx          # Reusable form components
│   ├── LoginForm.tsx           # Login form component
│   ├── RegisterForm.tsx        # Registration form component
│   └── ForgotPasswordForm.tsx  # Password reset form
├── context/
│   ├── AuthContext.tsx         # Global authentication state
│   └── LoadingContext.tsx      # Loading state management
├── utils/
│   ├── auth.ts                 # Authentication utilities
│   └── validation.ts           # Form validation utilities
├── services/
│   ├── auth.ts                 # API communication service
│   └── api.ts                  # HTTP client configuration
└── app/
    ├── sign-in.tsx             # Sign-in screen
    ├── register.tsx            # Registration screen
    ├── forgot-password.tsx     # Forgot password screen
    └── auth/
        └── reset-password.tsx  # Password reset screen
```

## 🔧 Core Components

### Authentication Hooks (`hooks/useAuth.ts`)

Provides specialized hooks for each authentication operation:

```typescript
// Login with automatic navigation and error handling
const { login, error, isLoading, clearError } = useLogin();

// Registration with confirmation handling
const { register, error, successMessage, isLoading } = useRegister();

// Password reset initiation
const { forgotPassword, error, successMessage, isLoading } =
  useForgotPassword();

// Password reset completion
const { resetPassword, error, successMessage, isLoading } = useResetPassword();
```

**Features**:

- Automatic navigation after successful operations
- Consistent error handling across all auth flows
- Loading state management
- Form submission handling

### Error Boundary (`components/AuthErrorBoundary.tsx`)

Catches and handles JavaScript errors in authentication flows:

```typescript
<AuthErrorBoundary>
  <LoginForm />
</AuthErrorBoundary>

// Or as HOC
export default withAuthErrorBoundary(LoginScreen);
```

**Features**:

- Displays fallback UI when errors occur
- Auto-recovery after 10 seconds
- Development error details
- Custom error handlers

### Form Components (`components/AuthInputs.tsx`)

Reusable, accessible form components:

```typescript
// Pre-configured email input
<EmailInput
  value={email}
  onChangeText={setEmail}
  error={errors.email}
  touched={touched.email}
  required
/>

// Password input with show/hide toggle
<PasswordInput
  value={password}
  onChangeText={setPassword}
  error={errors.password}
  touched={touched.password}
/>

// Consistent button with loading states
<AuthButton
  title="Sign In"
  onPress={handleLogin}
  disabled={!isFormValid}
  loading={isLoading}
/>
```

**Components Available**:

- `AuthInput` - Base input with error handling
- `EmailInput` - Email input with validation icon
- `PasswordInput` - Password input with visibility toggle
- `AuthButton` - Button with loading states and variants
- `AuthLink` - Navigation links with proper styling

### Validation System (`utils/validation.ts`)

Centralized validation with real-time feedback:

```typescript
// Form validation hook
const { values, errors, touched, setValue, setFieldTouched, isFormValid } =
  useFormValidation({ email: "", password: "" }, (values) =>
    validateLoginForm(values.email, values.password)
  );

// Individual validation functions
validateEmail(email); // Email format validation
validatePassword(password); // Password strength validation
validateLoginForm(email, pwd); // Complete form validation
```

**Features**:

- Real-time validation as user types
- Touched state tracking
- Consistent validation rules
- TypeScript support

### Authentication Utilities (`utils/auth.ts`)

Comprehensive utility functions organized by category:

#### Session Management

```typescript
// Store/retrieve user sessions
await sessionUtils.storeSession(user);
const user = await sessionUtils.getSession();
await sessionUtils.clearSession();

// Session validation
const isValid = await sessionUtils.isSessionValid();

// Remember last email for UX
await sessionUtils.storeLastEmail(email);
const lastEmail = await sessionUtils.getLastEmail();
```

#### Navigation

```typescript
// Navigation helpers
navigationUtils.navigateToApp(); // Go to main app
navigationUtils.navigateToSignIn(); // Go to sign-in
navigationUtils.navigateToRegister(); // Go to registration
navigationUtils.resetToRoute("/path"); // Reset navigation stack
```

#### Deep Linking

```typescript
// Parse reset password parameters
const params = deepLinkUtils.parseResetPasswordParams(url);
const isValid = deepLinkUtils.validateResetPasswordParams(params);
const error = deepLinkUtils.getResetPasswordError(params);
```

#### Token Management

```typescript
// JWT token utilities
const decoded = tokenUtils.decodeToken(token);
const isExpired = tokenUtils.isTokenExpired(token);
const expiration = tokenUtils.getTokenExpiration(token);
```

#### Error Handling

```typescript
// User-friendly error messages
const message = errorUtils.getUserFriendlyError(error);
const isNetwork = errorUtils.isNetworkError(error);
const formatted = errorUtils.formatApiError(error);
```

### Loading State Management (`context/LoadingContext.tsx`)

Global loading state management for better UX:

```typescript
// Pre-defined loading keys
const LOADING_KEYS = {
  LOGIN: "auth.login",
  REGISTER: "auth.register",
  FORGOT_PASSWORD: "auth.forgotPassword",
  RESET_PASSWORD: "auth.resetPassword",
  // ...
};

// Authentication-specific loading hooks
const { isLoginLoading, isRegisterLoading, setLoginLoading, isAnyAuthLoading } =
  useAuthLoading();

// Async operation with loading state
const { execute, isLoading, error, data } = useAsyncOperation(
  authOperation,
  LOADING_KEYS.LOGIN
);
```

## 🔐 Authentication Context (`context/AuthContext.tsx`)

Central authentication state management:

```typescript
interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  register: (email: string, password: string) => Promise<AuthResult>;
  forgotPassword: (email: string) => Promise<AuthResult>;
}

// Usage
const { user, loading, login, logout } = useAuth();
```

**Features**:

- Persistent session storage with AsyncStorage
- Automatic session restoration on app launch
- Centralized authentication state
- Type-safe authentication operations

## 🌐 API Integration (`services/auth.ts` & `services/api.ts`)

### HTTP Client Configuration

```typescript
// API client with interceptors
export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor adds auth tokens
api.interceptors.request.use(async (config) => {
  const authUser = await AsyncStorage.getItem("authUser");
  if (authUser) {
    const user = JSON.parse(authUser);
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});
```

### Authentication Service

```typescript
export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    // Login implementation with error handling
  },

  async register(credentials: RegisterRequest): Promise<AuthResponse> {
    // Registration implementation
  },

  async forgotPassword(
    request: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    // Password reset implementation
  },
};
```

## 📱 Screen Components

### Authentication Screens

Each authentication screen follows the same pattern using the modular components:

```typescript
// Example: Sign-in screen
const SignInScreen = () => {
  const { login, error, isLoading } = useLogin();
  const { values, errors, setValue, isFormValid } = useFormValidation(
    { email: '', password: '' },
    (values) => validateLoginForm(values.email, values.password)
  );

  return (
    <AuthErrorBoundary>
      <SafeAreaView>
        <EmailInput
          value={values.email}
          onChangeText={(text) => setValue('email', text)}
          error={errors.email}
        />
        <PasswordInput
          value={values.password}
          onChangeText={(text) => setValue('password', text)}
          error={errors.password}
        />
        <AuthButton
          title="Sign In"
          onPress={() => login(values.email, values.password)}
          disabled={!isFormValid}
          loading={isLoading}
        />
      </SafeAreaView>
    </AuthErrorBoundary>
  );
};
```

## 🔗 Deep Linking Integration

### Password Reset Flow

The mobile app handles password reset deep links from the backend:

1. **Link Format**: `expense-tracker://auth/reset-password?access_token=...&refresh_token=...`
2. **Parameter Parsing**: Uses `deepLinkUtils.parseResetPasswordParams()`
3. **Validation**: Validates tokens before showing reset form
4. **Error Handling**: Shows user-friendly errors for invalid/expired links

```typescript
// In reset password screen
const ResetPasswordScreen = () => {
  const params = useLocalSearchParams();
  const { resetPassword, error, successMessage, isLoading } =
    useResetPassword();

  useEffect(() => {
    const resetParams = deepLinkUtils.parseResetPasswordParams(
      Linking.createURL("auth/reset-password", { queryParams: params })
    );

    if (!deepLinkUtils.validateResetPasswordParams(resetParams)) {
      const error = deepLinkUtils.getResetPasswordError(resetParams);
      // Handle error
    }
  }, [params]);
};
```

## 🔄 State Flow

### Login Flow

1. User enters credentials in `LoginForm`
2. `useLogin` hook handles validation and API call
3. On success: session stored, navigation to main app
4. On error: user-friendly error displayed

### Registration Flow

1. User enters details in `RegisterForm`
2. `useRegister` hook handles validation and API call
3. If confirmation required: show success message, stay on screen
4. If auto-confirmed: session stored, navigation to main app

### Password Reset Flow

1. User requests reset in `ForgotPasswordForm`
2. `useForgotPassword` sends request to backend
3. Backend sends email with deep link
4. Deep link opens `ResetPasswordScreen`
5. `useResetPassword` validates tokens and handles password update
6. On success: navigation to sign-in screen

## 🛡️ Security Considerations

### Token Management

- Access tokens stored securely in AsyncStorage
- Automatic token expiration checking
- Session validation on app launch

### Error Handling

- No sensitive information leaked in error messages
- Network errors handled gracefully
- Invalid tokens handled securely

### Navigation Security

- Proper navigation stack management prevents auth bypassing
- Deep link validation prevents malicious redirects
- Session checks on protected routes

## 🧪 Testing Strategy

### Unit Testing

- Test authentication hooks in isolation
- Test validation functions with various inputs
- Test utility functions for edge cases

### Integration Testing

- Test complete authentication flows
- Test error boundary behavior
- Test deep linking scenarios

### E2E Testing

- Test full user registration and login flows
- Test password reset end-to-end
- Test app state persistence across restarts

## 📈 Performance Considerations

### Optimization Strategies

- Memoized validation functions
- Debounced real-time validation
- Efficient AsyncStorage usage
- Proper component unmounting

### Bundle Size

- Tree-shaking of unused utilities
- Lazy loading of authentication screens
- Optimized imports

This mobile authentication architecture provides a robust, maintainable, and user-friendly system that integrates seamlessly with the Node.js backend while maintaining security and performance standards.
