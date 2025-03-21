import { TouchableOpacity, ActivityIndicator, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/theme';
import ThemedText from '~/components/themed/ThemedText';

interface ThemedButtonProps {
    title: string;
    variant?: 'primary' | 'secondary';
    disabled?: boolean;
    loading?: boolean;
    icon?: string;
    style?: StyleProp<ViewStyle>;
    onPress: () => void;
}

export default function ThemedButton({
    title,
    onPress,
    variant = 'primary',
    disabled = false,
    loading = false,
    icon,
    style
}: ThemedButtonProps) {
    const { isDark } = useTheme()

    const buttonStyles = [
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        isDark && variant === 'primary' && styles.primaryButtonDark,
        isDark && variant === 'secondary' && styles.secondaryButtonDark,
        disabled && styles.disabledButton,
        style,
    ];

    const textStyles = [
        styles.text,
        variant === 'primary' && styles.primaryText,
        variant === 'secondary' && styles.secondaryText,
        isDark && variant === 'primary' && styles.primaryTextDark,
        isDark && variant === 'secondary' && styles.secondaryTextDark,
        disabled && styles.disabledText,
    ];

    const iconStyles = [
        styles.icon,
        variant === 'primary' && styles.primaryText,
        variant === 'secondary' && styles.secondaryText,
        isDark && variant === 'primary' && styles.primaryTextDark,
        isDark && variant === 'secondary' && styles.secondaryTextDark,
        disabled && styles.disabledText,
    ]

    return (
        <TouchableOpacity
            style={buttonStyles}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' ? '#FFFFFF' : '#007AFF'}
                    size="small"
                />
            ) : (
                <>
                    {icon && (
                        <Ionicons
                            name={icon as any}
                            size={20}
                            style={iconStyles}
                        />
                    )}
                    <ThemedText style={textStyles}>{title}</ThemedText>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        padding: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
    },
    primaryButton: {
        backgroundColor: '#007AFF',
    },
    primaryButtonDark: {
        backgroundColor: '#0A84FF',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    secondaryButtonDark: {
        borderColor: '#0A84FF',
    },
    disabledButton: {
        opacity: 0.5,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
    primaryText: {
        color: '#FFFFFF',
    },
    primaryTextDark: {
        color: '#FFFFFF',
    },
    secondaryText: {
        color: '#007AFF',
    },
    secondaryTextDark: {
        color: '#0A84FF',
    },
    disabledText: {
        opacity: 0.5,
    },
    icon: {
        marginRight: 8,
    }
});
