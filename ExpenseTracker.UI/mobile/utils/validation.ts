import React from 'react';

/**
 * Validation utilities for authentication forms
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Email validation
 */
export const validateEmail = (email: string): ValidationResult => {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

/**
 * Password validation
 */
export const validatePassword = (
  password: string,
  isRequired: boolean = true
): ValidationResult => {
  const trimmedPassword = password.trim();

  if (!trimmedPassword && isRequired) {
    return { isValid: false, error: 'Password is required' };
  }

  if (!trimmedPassword && !isRequired) {
    return { isValid: true };
  }

  if (trimmedPassword.length < 6) {
    return {
      isValid: false,
      error: 'Password must be at least 6 characters long',
    };
  }

  if (trimmedPassword.length > 128) {
    return {
      isValid: false,
      error: 'Password is too long (maximum 128 characters)',
    };
  }

  if (!/(?=.*[a-zA-Z])/.test(trimmedPassword)) {
    return {
      isValid: false,
      error: 'Password must contain at least one letter',
    };
  }

  return { isValid: true };
};

/**
 * Password confirmation validation
 */
export const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  if (!confirmPassword.trim()) {
    return { isValid: false, error: 'Password confirmation is required' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
};

/**
 * Login form validation
 */
export const validateLoginForm = (
  email: string,
  password: string
): FormValidationResult => {
  const errors: Record<string, string> = {};

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error!;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error!;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Registration form validation
 */
export const validateRegistrationForm = (
  email: string,
  password: string,
  confirmPassword?: string
): FormValidationResult => {
  const errors: Record<string, string> = {};

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error!;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error!;
  }

  // Optional password confirmation
  if (confirmPassword !== undefined) {
    const confirmValidation = validatePasswordConfirmation(
      password,
      confirmPassword
    );
    if (!confirmValidation.isValid) {
      errors.confirmPassword = confirmValidation.error!;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Forgot password form validation
 */
export const validateForgotPasswordForm = (
  email: string
): FormValidationResult => {
  const errors: Record<string, string> = {};

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error!;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Reset password form validation
 */
export const validateResetPasswordForm = (
  newPassword: string,
  confirmPassword: string
): FormValidationResult => {
  const errors: Record<string, string> = {};

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    errors.newPassword = passwordValidation.error!;
  }

  const confirmValidation = validatePasswordConfirmation(
    newPassword,
    confirmPassword
  );
  if (!confirmValidation.isValid) {
    errors.confirmPassword = confirmValidation.error!;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Real-time validation hook for forms
 */
export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationFn: (values: T) => FormValidationResult
) => {
  const [values, setValues] = React.useState<T>(initialValues);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const validateField = React.useCallback(
    (fieldName: string, value: any) => {
      const newValues = { ...values, [fieldName]: value };
      const validation = validationFn(newValues);

      setErrors((prev) => ({
        ...prev,
        [fieldName]: validation.errors[fieldName] || '',
      }));

      return validation.errors[fieldName] === undefined;
    },
    [values, validationFn]
  );

  const validateForm = React.useCallback(() => {
    const validation = validationFn(values);
    setErrors(validation.errors);
    return validation.isValid;
  }, [values, validationFn]);

  const setValue = React.useCallback(
    (fieldName: string, value: any) => {
      setValues((prev) => ({ ...prev, [fieldName]: value }));

      // Real-time validation if field has been touched
      if (touched[fieldName]) {
        validateField(fieldName, value);
      }
    },
    [touched, validateField]
  );

  const setFieldTouched = React.useCallback(
    (fieldName: string) => {
      setTouched((prev) => ({ ...prev, [fieldName]: true }));
      validateField(fieldName, values[fieldName]);
    },
    [values, validateField]
  );

  const resetForm = React.useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isFormValid = React.useMemo(() => {
    const validation = validationFn(values);
    return validation.isValid;
  }, [values, validationFn]);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateForm,
    resetForm,
    isFormValid,
  };
};
