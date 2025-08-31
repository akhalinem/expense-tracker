require('dotenv').config();

const express = require('express');
const {createClient} = require('@supabase/supabase-js');

// Environment variables validation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const port = process.env.PORT || 3001;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_KEY');
  process.exit(1);
}

const supabaseClient = createClient(supabaseUrl, supabaseKey);

const app = express();

// Middleware
app.use(express.json());

// Basic request validation middleware
const validateAuthRequest = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Email and password are required',
      details: { email: !email ? 'Email is required' : null, password: !password ? 'Password is required' : null }
    });
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  
  next();
};

app.get('/', (req, res) => {
  res.send("Let's rock!");
});

app.post('/auth/sign-up', validateAuthRequest, async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({
        error: error.message,
        code: error.status || 'AUTH_ERROR'
      });
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      return res.status(200).json({
        message: 'User signed up successfully. Please check your email to confirm your account.',
        user: data.user,
        confirmation_sent_at: data.user.confirmation_sent_at
      });
    }

    res.status(200).json({ 
      message: 'User signed up successfully', 
      user: data.user,
      session: data.session ? {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        token_type: data.session.token_type
      } : null
    });
  } catch (err) {
    console.error('Sign-up error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/sign-in', validateAuthRequest, async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ 
        error: error.message,
        code: error.status || 'AUTH_ERROR'
      });
    }

    // Return user data and session info
    res.status(200).json({ 
      message: 'User signed in successfully', 
      user: data.user,
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
        token_type: data.session?.token_type
      }
    });
  } catch (err) {
    console.error('Sign-in error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});