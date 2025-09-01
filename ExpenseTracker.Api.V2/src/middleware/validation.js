const { body, validationResult } = require('express-validator');

// Enhanced request validation middleware
const validateAuthRequest = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};
  
  // Check for missing fields
  if (!email || email.trim() === '') {
    errors.email = 'Email is required';
  }
  
  if (!password || password.trim() === '') {
    errors.password = 'Password is required';
  }
  
  // If basic fields are missing, return early
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ 
      error: 'Please fill in all required fields',
      details: errors
    });
  }
  
  // Enhanced email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ 
      error: 'Please enter a valid email address',
      details: { email: 'Please enter a valid email address' }
    });
  }
  
  // Enhanced password validation
  const trimmedPassword = password.trim();
  if (trimmedPassword.length < 6) {
    return res.status(400).json({ 
      error: 'Password must be at least 6 characters long',
      details: { password: 'Password must be at least 6 characters long' }
    });
  }
  
  if (trimmedPassword.length > 128) {
    return res.status(400).json({ 
      error: 'Password is too long (maximum 128 characters)',
      details: { password: 'Password is too long (maximum 128 characters)' }
    });
  }
  
  // Check for basic password strength (optional but good UX)
  if (!/(?=.*[a-zA-Z])/.test(trimmedPassword)) {
    return res.status(400).json({ 
      error: 'Password must contain at least one letter',
      details: { password: 'Password must contain at least one letter' }
    });
  }
  
  next();
};

// Email validation rules
const emailValidation = () => [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
    .trim()
];

// Password validation rules
const passwordValidation = () => [
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/[a-zA-Z]/)
    .withMessage('Password must contain at least one letter')
    .trim()
];

// Login validation
const loginValidation = () => [
  ...emailValidation(),
  ...passwordValidation()
];

// Registration validation (same as login for now)
const registerValidation = () => [
  ...emailValidation(),
  ...passwordValidation()
];

// Forgot password validation
const forgotPasswordValidation = () => [
  ...emailValidation()
];

// Password reset validation
const resetPasswordValidation = () => [
  body('access_token')
    .notEmpty()
    .withMessage('Access token is required'),
  body('refresh_token')
    .notEmpty()
    .withMessage('Refresh token is required'),
  body('new_password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/[a-zA-Z]/)
    .withMessage('Password must contain at least one letter')
    .trim()
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = {};
    const errorMessages = [];
    
    errors.array().forEach(error => {
      errorDetails[error.path] = error.msg;
      errorMessages.push(error.msg);
    });
    
    return res.status(400).json({
      error: errorMessages.length === 1 ? errorMessages[0] : 'Please fix the following errors',
      details: errorDetails
    });
  }
  
  next();
};

// Validation rule sets using express-validator
const validateRegister = [
  ...registerValidation(),
  handleValidationErrors
];

const validateLogin = [
  ...loginValidation(),
  handleValidationErrors
];

const validateForgotPassword = [
  ...forgotPasswordValidation(),
  handleValidationErrors
];

const validateResetPassword = [
  ...resetPasswordValidation(),
  handleValidationErrors
];

// Sync validation middleware
const validateSync = (req, res, next) => {
  const { categories = [], transactions = [] } = req.body;
  const errors = {};

  // Validate categories structure
  if (!Array.isArray(categories)) {
    errors.categories = 'Categories must be an array';
  } else {
    categories.forEach((category, index) => {
      if (!category.name || typeof category.name !== 'string') {
        errors[`categories[${index}].name`] = 'Category name is required and must be a string';
      }
      if (category.color && typeof category.color !== 'string') {
        errors[`categories[${index}].color`] = 'Category color must be a string';
      }
    });
  }

  // Validate transactions structure
  if (!Array.isArray(transactions)) {
    errors.transactions = 'Transactions must be an array';
  } else {
    transactions.forEach((transaction, index) => {
      if (typeof transaction.amount !== 'number') {
        errors[`transactions[${index}].amount`] = 'Transaction amount is required and must be a number';
      }
      if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
        errors[`transactions[${index}].type`] = 'Transaction type must be either "income" or "expense"';
      }
      if (!transaction.date) {
        errors[`transactions[${index}].date`] = 'Transaction date is required';
      }
      if (transaction.categories && !Array.isArray(transaction.categories)) {
        errors[`transactions[${index}].categories`] = 'Transaction categories must be an array';
      }
    });
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      error: 'Invalid sync data format',
      details: errors
    });
  }

  next();
};

module.exports = {
  validateAuthRequest,
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateSync
};