import React, {
  forwardRef,
  useState,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/theme';

export interface AuthInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  touched?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  showError?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  required?: boolean;
  helperText?: string;
  showCharacterCount?: boolean;
  maxLength?: number;
  animateOnFocus?: boolean;
}

export interface AuthInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  isFocused: () => boolean;
}

/**
 * Reusable input component for authentication forms
 * Provides consistent styling, error handling, and accessibility
 */
export const AuthInput = forwardRef<AuthInputRef, AuthInputProps>(
  (
    {
      label,
      error,
      touched = false,
      containerStyle,
      inputStyle,
      labelStyle,
      errorStyle,
      showError = true,
      icon,
      iconColor,
      required = false,
      helperText,
      showCharacterCount = false,
      maxLength,
      animateOnFocus = true,
      ...textInputProps
    },
    ref
  ) => {
    const { theme } = useTheme();
    const inputRef = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = useState(false);
    const focusAnimation = useRef(new Animated.Value(0)).current;
    const hasError = touched && error;
    const hasValue = textInputProps.value && textInputProps.value.length > 0;

    // Expose ref methods
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => inputRef.current?.clear(),
      isFocused: () => isFocused,
    }));

    const handleFocus = (e: any) => {
      setIsFocused(true);
      if (animateOnFocus) {
        Animated.timing(focusAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
      textInputProps.onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      if (animateOnFocus && !hasValue) {
        Animated.timing(focusAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
      textInputProps.onBlur?.(e);
    };

    const computedInputStyle = [
      styles.input,
      {
        borderColor: hasError
          ? theme.error
          : isFocused
            ? theme.primary
            : theme.border,
        color: theme.text,
        backgroundColor: theme.background,
        borderWidth: isFocused ? 2 : 1,
      },
      icon && styles.inputWithIcon,
      inputStyle,
    ];

    const computedLabelStyle = [
      styles.label,
      {
        color: hasError ? theme.error : isFocused ? theme.primary : theme.text,
      },
      labelStyle,
    ];

    const computedErrorStyle = [
      styles.error,
      { color: theme.error },
      errorStyle,
    ];

    const characterCount = textInputProps.value?.length || 0;
    const isOverLimit = maxLength && characterCount > maxLength;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={computedLabelStyle}>
            {label}
            {required && <Text style={{ color: theme.error }}> *</Text>}
          </Text>
        )}

        <View style={styles.inputContainer}>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={
                iconColor ||
                (hasError
                  ? theme.error
                  : isFocused
                    ? theme.primary
                    : theme.textSecondary)
              }
              style={styles.icon}
            />
          )}

          <TextInput
            ref={inputRef}
            style={computedInputStyle}
            placeholderTextColor={theme.textSecondary}
            maxLength={maxLength}
            accessibilityLabel={label}
            accessibilityHint={required ? 'Required field' : undefined}
            {...textInputProps}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </View>

        <View style={styles.bottomContainer}>
          <View style={styles.leftBottom}>
            {showError && hasError && (
              <Text style={computedErrorStyle} accessibilityRole="alert">
                {error}
              </Text>
            )}
            {!hasError && helperText && (
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                {helperText}
              </Text>
            )}
          </View>

          {showCharacterCount && maxLength && (
            <Text
              style={[
                styles.characterCount,
                { color: isOverLimit ? theme.error : theme.textSecondary },
              ]}
            >
              {characterCount}/{maxLength}
            </Text>
          )}
        </View>
      </View>
    );
  }
);

AuthInput.displayName = 'AuthInput';

/**
 * Specialized email input component
 */
export const EmailInput = forwardRef<
  AuthInputRef,
  Omit<
    AuthInputProps,
    'keyboardType' | 'autoCapitalize' | 'autoCorrect' | 'icon'
  >
>((props, ref) => (
  <AuthInput
    ref={ref}
    keyboardType="email-address"
    autoCapitalize="none"
    autoCorrect={false}
    autoComplete="email"
    textContentType="emailAddress"
    icon="mail-outline"
    label="Email"
    placeholder="Enter your email"
    helperText="We'll never share your email with anyone else"
    {...props}
  />
));

EmailInput.displayName = 'EmailInput';

/**
 * Specialized password input component with toggle visibility
 */
export const PasswordInput = forwardRef<
  AuthInputRef,
  Omit<AuthInputProps, 'secureTextEntry' | 'icon'> & {
    showStrengthIndicator?: boolean;
  }
>(
  (
    {
      label = 'Password',
      placeholder = 'Enter your password',
      showStrengthIndicator = false,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();
    const [showPassword, setShowPassword] = useState(false);

    const getPasswordStrength = (
      password: string
    ): { score: number; label: string; color: string } => {
      if (!password) return { score: 0, label: '', color: theme.textSecondary };

      let score = 0;
      if (password.length >= 8) score += 1;
      if (/[a-z]/.test(password)) score += 1;
      if (/[A-Z]/.test(password)) score += 1;
      if (/[0-9]/.test(password)) score += 1;
      if (/[^a-zA-Z0-9]/.test(password)) score += 1;

      switch (score) {
        case 0:
        case 1:
          return { score, label: 'Very Weak', color: '#ef4444' };
        case 2:
          return { score, label: 'Weak', color: '#f97316' };
        case 3:
          return { score, label: 'Fair', color: '#eab308' };
        case 4:
          return { score, label: 'Good', color: '#22c55e' };
        case 5:
          return { score, label: 'Strong', color: '#16a34a' };
        default:
          return { score, label: '', color: theme.textSecondary };
      }
    };

    const strength = showStrengthIndicator
      ? getPasswordStrength(props.value || '')
      : null;

    return (
      <View style={props.containerStyle}>
        <AuthInput
          ref={ref}
          secureTextEntry={!showPassword}
          textContentType="password"
          autoComplete="password"
          label={label}
          placeholder={placeholder}
          icon="lock-closed-outline"
          maxLength={128}
          {...props}
          containerStyle={undefined} // Prevent double container
        />

        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={() => setShowPassword(!showPassword)}
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          accessibilityRole="button"
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        {showStrengthIndicator && strength && props.value && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthBars}>
              {[...Array(5)].map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.strengthBar,
                    {
                      backgroundColor:
                        index < strength.score ? strength.color : theme.border,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.strengthLabel, { color: strength.color }]}>
              {strength.label}
            </Text>
          </View>
        )}
      </View>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

/**
 * Auth button component with consistent styling and loading states
 */
export interface AuthButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  textStyle,
  icon,
  fullWidth = true,
}) => {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      ...(fullWidth && styles.buttonFullWidth),
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: isDisabled ? theme.textSecondary : theme.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: isDisabled ? theme.textSecondary : theme.background,
          borderWidth: 1,
          borderColor: isDisabled ? theme.textSecondary : theme.border,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isDisabled ? theme.textSecondary : theme.primary,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
        return { ...styles.buttonText, color: 'white' };
      case 'secondary':
        return { ...styles.buttonText, color: theme.text };
      case 'outline':
        return {
          ...styles.buttonText,
          color: isDisabled ? theme.textSecondary : theme.primary,
        };
      default:
        return styles.buttonText;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      <View style={styles.buttonContent}>
        {icon && !loading && (
          <Ionicons
            name={icon}
            size={18}
            color={getTextStyle().color}
            style={styles.buttonIcon}
          />
        )}

        {loading ? (
          <ActivityIndicator size="small" color={getTextStyle().color} />
        ) : (
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

/**
 * Link button for navigation between auth screens
 */
export interface AuthLinkProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AuthLink: React.FC<AuthLinkProps> = ({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.link, style]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={title}
      accessibilityRole="button"
    >
      <Text
        style={[
          styles.linkText,
          { color: disabled ? theme.textSecondary : theme.primary },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
  inputWithIcon: {
    paddingLeft: 44,
  },
  icon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  leftBottom: {
    flex: 1,
  },
  error: {
    fontSize: 14,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  characterCount: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 8,
  },
  strengthContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  strengthBars: {
    flexDirection: 'row',
    marginRight: 8,
    flex: 1,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    marginRight: 2,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    padding: 8,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
