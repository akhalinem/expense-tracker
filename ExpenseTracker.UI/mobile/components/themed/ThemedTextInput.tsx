import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useState, ComponentType } from 'react';
import { useTheme } from '~/theme';

interface ThemedTextInputProps<C extends ComponentType<any>> extends TextInputProps {
    error?: boolean;
    as?: C;
}

export default function ThemedTextInput<C extends ComponentType<any> = typeof TextInput>({
    style,
    error,
    as,
    ...props
}: ThemedTextInputProps<C>) {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const Component = as || TextInput;

    return (
        <Component
            style={[
                styles.input,
                {
                    color: theme.text,
                    backgroundColor: theme.surface,
                    borderColor: error ? theme.error : isFocused ? theme.borderFocused : theme.border,
                },
                style,
            ]}
            placeholderTextColor={theme.textSecondary}
            onFocus={(e) => {
                setIsFocused(true);
                props.onFocus?.(e);
            }}
            onBlur={(e) => {
                setIsFocused(false);
                props.onBlur?.(e);
            }}
            {...props}
        />
    );
}

const styles = StyleSheet.create({
    input: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 16,
    },
});
