const { supabaseClient } = require('../config/supabase');
const { createClient } = require('@supabase/supabase-js');

class AuthService {
  /**
   * Create a temporary Supabase client with specific session
   * Used for operations that need to set session state
   */
  createTemporaryClient(accessToken, refreshToken) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    const tempClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
    
    // Set the session on this isolated client
    tempClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    
    return tempClient;
  }
  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Registration result
   */
  async register(email, password) {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          emailRedirectTo: `${process.env.APP_URL}/auth/callback/confirm-email`
        }
      });

      if (error) {
        throw this.createAuthError(error);
      }

      return this.formatAuthResponse(data, 'Account created successfully!');
    } catch (error) {
      if (error.name === 'AuthError') {
        throw error;
      }
      throw this.createAuthError({ message: 'Registration failed' });
    }
  }

  /**
   * Sign in user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login result
   */
  async login(email, password) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        throw this.createAuthError(error);
      }

      return this.formatAuthResponse(data, 'Signed in successfully!');
    } catch (error) {
      if (error.name === 'AuthError') {
        throw error;
      }
      throw this.createAuthError({ message: 'Login failed' });
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Valid refresh token
   * @returns {Promise<Object>} Refresh result with new tokens
   */
  async refreshToken(refreshToken) {
    try {
      console.log('🔄 [AUTH_SERVICE] Starting token refresh...');
      
      const { data, error } = await supabaseClient.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error) {
        console.error('❌ [AUTH_SERVICE] Token refresh error:', error);
        throw this.createAuthError(error);
      }

      if (!data.session) {
        console.error('❌ [AUTH_SERVICE] No session returned from refresh');
        throw this.createAuthError({ message: 'Failed to refresh session' });
      }

      console.log('✅ [AUTH_SERVICE] Token refresh successful');
      
      return this.formatAuthResponse(data, 'Token refreshed successfully!');
    } catch (error) {
      if (error.name === 'AuthError') {
        throw error;
      }
      console.error('❌ [AUTH_SERVICE] Unexpected refresh error:', error);
      throw this.createAuthError({ message: 'Token refresh failed' });
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @param {string} redirectTo - Redirect URL after reset
   * @returns {Promise<Object>} Reset result
   */
  async sendPasswordResetEmail(email, redirectTo) {
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo }
      );

      if (error) {
        console.error('Password reset error:', error);
        // Don't reveal if email exists for security
      }

      return {
        message: 'If an account with this email exists, you will receive a password reset link shortly.'
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        message: 'If an account with this email exists, you will receive a password reset link shortly.'
      };
    }
  }

  /**
   * Validate reset session tokens
   * @param {string} accessToken - Access token from reset link
   * @param {string} refreshToken - Refresh token from reset link
   * @param {string} type - Token type (should be 'recovery' for password reset)
   * @returns {Promise<Object>} Validation result
   */
  async validateResetSession(accessToken, refreshToken, type) {
    try {
      // Only allow 'recovery' type for password reset validation
      if (type !== 'recovery') {
        throw new Error('Invalid session type for password reset. Only recovery sessions are allowed.');
      }

      // Use a temporary client to avoid concurrent session conflicts
      const tempClient = this.createTemporaryClient(accessToken, refreshToken);
      
      const { data: session, error: sessionError } = await tempClient.auth.getSession();

      if (sessionError || !session?.user) {
        throw new Error('Invalid or expired reset tokens');
      }

      return {
        valid: true,
        user: {
          id: session.user.id,
          email: session.user.email
        }
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return {
        valid: false,
        error: error.message || 'Session validation failed'
      };
    }
  }

  /**
   * Reset user password
   * @param {string} accessToken - Valid access token
   * @param {string} refreshToken - Valid refresh token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Reset result
   */
  async resetPassword(accessToken, refreshToken, newPassword) {
    try {
      console.log('Starting password reset process...');
      console.log('Tokens provided:', { 
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken,
        passwordLength: newPassword?.length || 0
      });

      // Create a temporary client to avoid concurrent session conflicts
      console.log('Creating temporary client for password reset...');
      const tempClient = this.createTemporaryClient(accessToken, refreshToken);

      // Verify the session is valid
      console.log('Verifying session...');
      const { data: sessionData, error: sessionError } = await tempClient.auth.getSession();

      if (sessionError || !sessionData?.user) {
        console.error('Session verification failed:', sessionError);
        throw this.createAuthError({
          message: 'Invalid or expired reset link. Please request a new password reset.',
          status: 400
        });
      }

      console.log('Session verified successfully:', {
        hasUser: !!sessionData?.user,
        userId: sessionData?.user?.id,
        userEmail: sessionData?.user?.email
      });

      // Update the user's password using the temporary client
      console.log('Attempting to update password...');
      const { data: updateData, error: updateError } = await tempClient.auth.updateUser({
        password: newPassword.trim(),
      });

      if (updateError) {
        console.error('Password update error details:', {
          message: updateError.message,
          status: updateError.status,
          statusCode: updateError.status_code,
          code: updateError.code,
          fullError: updateError
        });
        throw this.createAuthError({
          message: this.getPasswordUpdateErrorMessage(updateError),
          status: 400
        });
      }

      console.log('Password updated successfully:', {
        hasUser: !!updateData?.user,
        userId: updateData?.user?.id
      });

      return {
        message: 'Password updated successfully! You can now sign in with your new password.'
      };
    } catch (error) {
      if (error.name === 'AuthError') {
        console.error('AuthError being re-thrown:', error.message);
        throw error;
      }
      console.error('Unexpected password reset completion error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        fullError: error
      });
      throw this.createAuthError({ message: 'Password reset failed' });
    }
  }

  /**
   * Create standardized auth error
   * @param {Object} error - Supabase error object
   * @returns {Error} Formatted auth error
   */
  createAuthError(error) {
    const authError = new Error();
    authError.name = 'AuthError';
    authError.statusCode = error.status || 400;
    
    // Map common Supabase errors to user-friendly messages
    if (error.message?.includes('User already registered')) {
      authError.message = 'An account with this email already exists. Please try signing in instead.';
      authError.code = 'USER_EXISTS';
    } else if (error.message?.includes('Invalid login credentials')) {
      authError.message = 'Invalid email or password. Please check your credentials and try again.';
      authError.code = 'INVALID_CREDENTIALS';
    } else if (error.message?.includes('Email not confirmed')) {
      authError.message = 'Please check your email and click the confirmation link before signing in.';
      authError.code = 'EMAIL_NOT_CONFIRMED';
    } else if (error.message?.includes('Too many requests')) {
      authError.message = 'Too many attempts. Please try again in a few minutes.';
      authError.code = 'RATE_LIMITED';
    } else if (error.message?.includes('User not found')) {
      authError.message = 'No account found with this email. Please check your email or create a new account.';
      authError.code = 'USER_NOT_FOUND';
    } else {
      authError.message = error.message || 'Authentication failed';
      authError.code = error.code || 'AUTH_ERROR';
    }
    
    return authError;
  }

  /**
   * Get user-friendly password update error message
   * @param {Object} error - Supabase error
   * @returns {string} User-friendly error message
   */
  getPasswordUpdateErrorMessage(error) {
    if (error.message?.includes('New password should be different')) {
      return 'New password must be different from your current password.';
    } else if (error.message?.includes('Password')) {
      return 'Password does not meet security requirements.';
    }
    return 'Failed to update password. Please try again.';
  }

  /**
   * Format authentication response
   * @param {Object} data - Supabase auth data
   * @param {string} message - Success message
   * @returns {Object} Formatted response
   */
  formatAuthResponse(data, message) {
    const response = {
      message,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    };

    // Add session data if available
    if (data.session) {
      response.session = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        token_type: data.session.token_type
      };
    } else if (data.user?.confirmation_sent_at) {
      // Email confirmation required
      response.message = 'Account created successfully! Please check your email to confirm your account.';
      response.user.confirmation_sent_at = data.user.confirmation_sent_at;
      response.confirmation_sent_at = data.user.confirmation_sent_at;
    }

    return response;
  }
}

module.exports = new AuthService();