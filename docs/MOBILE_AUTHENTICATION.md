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
const { login, error, isSubmitting, isLoading, clearError } = useLogin();

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
</AuthErrorBoundary>;

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
// Pre-configured email input with validation
<EmailInput
  value={email}
  onChangeText={setEmail}
  error={errors.email}
  touched={touched.email}
  required
/>

// Password input with show/hide toggle and strength indicator
<PasswordInput
  value={password}
  onChangeText={setPassword}
  error={errors.password}
  touched={touched.password}
  showStrengthIndicator
  required
/>

// Submit button with loading state
<SubmitButton
  onPress={handleSubmit}
  isLoading={isLoading}
  disabled={!isValid}
  title="Sign In"
/>
```

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

````

**Components Available**:

- `EmailInput` - Email input with validation and proper styling
- `PasswordInput` - Password input with visibility toggle and strength indicator
- `SubmitButton` - Button with loading states and disabled states
- `AuthErrorBoundary` - Error boundary for authentication flows
- `LoginForm`, `RegisterForm`, `ForgotPasswordForm` - Complete form components

### Authentication Context (`context/AuthContext.tsx`)

Provides centralized authentication state management:

```typescript
export type AuthUser = {
  id: string;
  email: string;
  token: string;
};

export type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{success: boolean; error?: string}>;
  logout: () => void;
  register: (email: string, password: string) => Promise<{success: boolean; error?: string; requiresConfirmation?: boolean}>;
  forgotPassword: (email: string) => Promise<{success: boolean; error?: string; message?: string}>;
};
````

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

### Authentication Service (`services/auth.ts`)

Service for handling API communication with the Node.js backend:

```typescript
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
    confirmation_sent_at?: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    token_type: string;
  };
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    return response.data;
  },

  async register(credentials: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      "/auth/register",
      credentials
    );
    return response.data;
  },

  async forgotPassword(
    request: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    const response = await api.post<ForgotPasswordResponse>(
      "/auth/forgot-password",
      request
    );
    return response.data;
  },

  async resetPassword(
    newPassword: string,
    accessToken: string
  ): Promise<{ message: string }> {
    const response = await api.post(
      "/auth/reset-password",
      { newPassword },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data;
  },

  async validateResetSession(
    accessToken: string,
    refreshToken: string
  ): Promise<{ valid: boolean; user?: any }> {
    const response = await api.post("/auth/validate-reset-session", {
      accessToken,
      refreshToken,
    });
    return response.data;
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
    { email: "", password: "" },
    (values) => validateLoginForm(values.email, values.password)
  );

  return (
    <AuthErrorBoundary>
      <SafeAreaView>
        <EmailInput
          value={values.email}
          onChangeText={(text) => setValue("email", text)}
          error={errors.email}
        />
        <PasswordInput
          value={values.password}
          onChangeText={(text) => setValue("password", text)}
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

### Deep Linking Integration

The mobile app handles authentication-related deep links from the backend:

#### Email Confirmation

- **Link Format**: `expense-tracker://auth/login?email_confirmed=true`
- **Handling**: Shows success message and navigates to login

#### Password Reset

- **Link Format**: `expense-tracker://auth/reset-password?access_token=...&refresh_token=...`
- **Handling**: Validates tokens and shows password reset form

```typescript
// Deep link configuration in app.json
{
  "expo": {
    "scheme": "expense-tracker",
    "web": {
      "bundler": "metro"
    }
  }
}

// Handling in reset password screen
const ResetPasswordScreen = () => {
  const params = useLocalSearchParams();
  const { resetPassword, error, successMessage, isLoading } = useResetPassword();

  useEffect(() => {
    if (params.access_token && params.refresh_token) {
      // Validate tokens with backend
      validateResetSession(params.access_token, params.refresh_token);
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
