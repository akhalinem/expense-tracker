const express = require('express');
const authService = require('../services/authService');
const { validateRegister, validateLogin, validateForgotPassword, validateResetPassword } = require('../middleware/validation');

const router = express.Router();

/**
 * Health check for auth configuration
 */
router.get('/health', (req, res) => {
  const hasSupabaseUrl = !!process.env.SUPABASE_URL;
  const hasSupabaseKey = !!process.env.SUPABASE_KEY;
  const hasAppUrl = !!process.env.APP_URL;
  
  res.json({
    status: 'ok',
    config: {
      supabaseConfigured: hasSupabaseUrl && hasSupabaseKey,
      appUrlConfigured: hasAppUrl,
      supabaseUrl: hasSupabaseUrl ? 'configured' : 'missing',
      supabaseKey: hasSupabaseKey ? 'configured' : 'missing',
      appUrl: hasAppUrl ? process.env.APP_URL : 'missing'
    }
  });
});

/**
 * Register a new user
 */
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.register(email, password);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * User login
 */
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Refresh access token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({
        error: 'Refresh token is required'
      });
    }
    
    const result = await authService.refreshToken(refresh_token);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Send password reset email
 */
router.post('/forgot-password', validateForgotPassword, async (req, res, next) => {
  try {
    const { email } = req.body;
    const redirectTo = `${process.env.APP_URL}/auth/callback/reset-password`;
    const result = await authService.sendPasswordResetEmail(email, redirectTo);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Handle email confirmation callback from Supabase
 */
router.get('/callback/confirm-email', async (req, res) => {
  try {
    console.log('Email confirmation callback received');
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Confirmed!</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body>
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          <h2>Email Confirmed Successfully!</h2>
          <p>Your email has been confirmed. You can now sign in to your account.</p>
          <p>Redirecting to the app...</p>
        </div>
        <script>
          // Redirect to mobile app login screen with confirmation
          setTimeout(() => {
            window.location.href = 'expense-tracker://auth/login?email_confirmed=true';
          }, 2000);
        </script>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Email confirmation error:', error);
    res.status(500).send(`
      <html>
        <body>
          <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h2>Error</h2>
            <p>There was an error confirming your email. Please try again.</p>
          </div>
          <script>
            setTimeout(() => {
              window.location.href = 'expense-tracker://auth/login?error=confirmation_error';
            }, 3000);
          </script>
        </body>
      </html>
    `);
  }
});

/**
 * Handle password reset callback from Supabase
 */
router.get('/callback/reset-password', async (req, res) => {
  try {
    console.log('Auth callback received');
    
    // Supabase sends tokens as URL fragments, we need to extract them client-side first
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Processing Authentication...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body>
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          <h2>Processing your request...</h2>
          <p>Validating your authentication...</p>
        </div>
        <script>
          async function processAuthTokens() {
            try {
              // Extract tokens from URL fragments
              const hash = window.location.hash.substring(1);
              const params = new URLSearchParams(hash);
              
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');
              const type = params.get('type');
              const error = params.get('error');
              const errorDescription = params.get('error_description');
              
              console.log('Extracted tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type, error });
              
              if (error) {
                // Redirect to mobile app with error
                const errorUrl = \`expense-tracker://auth/reset-password?error=\${encodeURIComponent(error)}&error_description=\${encodeURIComponent(errorDescription || 'Authentication failed')}\`;
                window.location.href = errorUrl;
                return;
              }
              
              if (!accessToken || !refreshToken) {
                const errorUrl = \`expense-tracker://auth/reset-password?error=invalid_request&error_description=\${encodeURIComponent('Missing authentication tokens')}\`;
                window.location.href = errorUrl;
                return;
              }
              
              // Check the type to determine the correct flow
              if (type === 'signup' || type === 'email_confirmation') {
                // This is an email confirmation, not a password reset
                // Redirect to the registration success or login page
                document.body.innerHTML = \`
                  <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                    <h2>Email Confirmed!</h2>
                    <p>Your email has been confirmed. Redirecting to login...</p>
                  </div>
                \`;
                
                // Wait a moment then redirect to login (use correct mobile route)
                setTimeout(() => {
                  window.location.href = 'expense-tracker://auth/login?email_confirmed=true';
                }, 2000);
                return;
              }
              
              if (type !== 'recovery') {
                // Unknown type, redirect to login (use correct mobile route)
                const errorUrl = \`expense-tracker://auth/login?error=invalid_request&error_description=\${encodeURIComponent('Invalid authentication type')}\`;
                window.location.href = errorUrl;
                return;
              }
              
              // This is a legitimate password reset - proceed with validation
              document.body.innerHTML = \`
                <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                  <h2>Validating reset link...</h2>
                  <p>Please wait while we verify your authentication.</p>
                </div>
              \`;
              
              const response = await fetch('/auth/validate-reset-session', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                  type: type
                })
              });
              
              const result = await response.json();
              
              if (response.ok && result.valid) {
                // Session is valid, redirect to mobile app with tokens
                const mobileUrl = \`expense-tracker://auth/reset-password?access_token=\${encodeURIComponent(accessToken)}&refresh_token=\${encodeURIComponent(refreshToken)}&type=\${encodeURIComponent(type || 'recovery')}&validated=true\`;
                window.location.href = mobileUrl;
              } else {
                // Session invalid, redirect with error
                const errorUrl = \`expense-tracker://auth/reset-password?error=session_invalid&error_description=\${encodeURIComponent(result.error || 'Reset link is invalid or expired')}\`;
                window.location.href = errorUrl;
              }
              
            } catch (error) {
              console.error('Error processing auth tokens:', error);
              const errorUrl = \`expense-tracker://auth/login?error=processing_error&error_description=\${encodeURIComponent('Error processing authentication')}\`;
              window.location.href = errorUrl;
            }
          }
          
          // Process tokens when page loads
          window.onload = processAuthTokens;
        </script>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(500).send(`
      <html>
        <body>
          <script>
            window.location.href = 'expense-tracker://auth/login?error=server_error&error_description=' + encodeURIComponent('Server error during authentication processing');
          </script>
        </body>
      </html>
    `);
  }
});

/**
 * Complete password reset
 */
router.post('/reset-password', validateResetPassword, async (req, res, next) => {
  try {
    const { access_token, refresh_token, new_password } = req.body;
    const result = await authService.resetPassword(access_token, refresh_token, new_password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Validate reset session (for frontend verification)
 */
router.post('/validate-reset-session', async (req, res, next) => {
  try {
    const { access_token, refresh_token, type } = req.body;
    
    if (!access_token || !refresh_token) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Missing tokens' 
      });
    }

    const result = await authService.validateResetSession(access_token, refresh_token, type);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;