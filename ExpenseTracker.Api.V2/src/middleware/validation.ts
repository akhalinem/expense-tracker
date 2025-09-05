import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator/lib";

interface IValidationErrors {
  [key: string]: string;
}

// Enhanced request validation middleware
export const validateAuthRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email, password } = req.body;
  const errors: IValidationErrors = {};

  // Check for missing fields
  if (!email || email.trim() === "") {
    errors.email = "Email is required";
  }

  if (!password || password.trim() === "") {
    errors.password = "Password is required";
  }

  // If basic fields are missing, return early
  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      error: "Please fill in all required fields",
      details: errors,
    });
    return;
  }

  // Enhanced email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    res.status(400).json({
      error: "Please enter a valid email address",
      details: { email: "Please enter a valid email address" },
    });
    return;
  }

  // Enhanced password validation
  const trimmedPassword = password.trim();
  if (trimmedPassword.length < 6) {
    res.status(400).json({
      error: "Password must be at least 6 characters long",
      details: { password: "Password must be at least 6 characters long" },
    });
    return;
  }

  if (trimmedPassword.length > 128) {
    res.status(400).json({
      error: "Password is too long (maximum 128 characters)",
      details: { password: "Password is too long (maximum 128 characters)" },
    });
    return;
  }

  // Check for basic password strength (optional but good UX)
  if (!/(?=.*[a-zA-Z])/.test(trimmedPassword)) {
    res.status(400).json({
      error: "Password must contain at least one letter",
      details: { password: "Password must contain at least one letter" },
    });
    return;
  }

  next();
};

// Email validation rules
const emailValidation = () => [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail()
    .trim(),
];

// Password validation rules
const passwordValidation = () => [
  body("password")
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be between 6 and 128 characters")
    .matches(/[a-zA-Z]/)
    .withMessage("Password must contain at least one letter")
    .trim(),
];

// Login validation
const loginValidation = () => [...emailValidation(), ...passwordValidation()];

// Registration validation (same as login for now)
const registerValidation = () => [
  ...emailValidation(),
  ...passwordValidation(),
];

// Forgot password validation
const forgotPasswordValidation = () => [...emailValidation()];

// Password reset validation
const resetPasswordValidation = () => [
  body("access_token").notEmpty().withMessage("Access token is required"),
  body("refresh_token").notEmpty().withMessage("Refresh token is required"),
  body("new_password")
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be between 6 and 128 characters")
    .matches(/[a-zA-Z]/)
    .withMessage("Password must contain at least one letter")
    .trim(),
];

// Middleware to handle validation errors
const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails: IValidationErrors = {};
    const errorMessages: string[] = [];

    errors.array().forEach((error: unknown) => {
      const typedError = error as { path?: string; msg: string };
      if (typedError.path) {
        errorDetails[typedError.path] = typedError.msg;
        errorMessages.push(typedError.msg);
      }
    });

    res.status(400).json({
      error:
        errorMessages.length === 1
          ? errorMessages[0]
          : "Please fix the following errors",
      details: errorDetails,
    });
    return;
  }

  next();
};

// Validation rule sets using express-validator
export const validateRegister = [
  ...registerValidation(),
  handleValidationErrors,
];

export const validateLogin = [...loginValidation(), handleValidationErrors];

export const validateForgotPassword = [
  ...forgotPasswordValidation(),
  handleValidationErrors,
];

export const validateResetPassword = [
  ...resetPasswordValidation(),
  handleValidationErrors,
];

// Sync validation middleware
export const validateSync = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { categories = [], transactions = [] } = req.body;
  const errors: IValidationErrors = {};

  // Validate categories structure
  if (!Array.isArray(categories)) {
    errors.categories = "Categories must be an array";
  } else {
    categories.forEach((category: unknown, index: number) => {
      const typedCategory = category as { name?: unknown; color?: unknown };
      if (!typedCategory.name || typeof typedCategory.name !== "string") {
        errors[`categories[${index}].name`] =
          "Category name is required and must be a string";
      }
      if (typedCategory.color && typeof typedCategory.color !== "string") {
        errors[`categories[${index}].color`] =
          "Category color must be a string";
      }
    });
  }

  // Validate transactions structure
  if (!Array.isArray(transactions)) {
    errors.transactions = "Transactions must be an array";
  } else {
    transactions.forEach((transaction: unknown, index: number) => {
      const typedTransaction = transaction as {
        amount?: unknown;
        type?: unknown;
        date?: unknown;
        categories?: unknown;
      };
      if (typeof typedTransaction.amount !== "number") {
        errors[`transactions[${index}].amount`] =
          "Transaction amount is required and must be a number";
      }
      if (
        !typedTransaction.type ||
        !["income", "expense"].includes(typedTransaction.type as string)
      ) {
        errors[`transactions[${index}].type`] =
          'Transaction type must be either "income" or "expense"';
      }
      if (!typedTransaction.date) {
        errors[`transactions[${index}].date`] = "Transaction date is required";
      }
      if (
        typedTransaction.categories &&
        !Array.isArray(typedTransaction.categories)
      ) {
        errors[`transactions[${index}].categories`] =
          "Transaction categories must be an array";
      }
    });
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      error: "Invalid sync data format",
      details: errors,
    });
    return;
  }

  next();
};
