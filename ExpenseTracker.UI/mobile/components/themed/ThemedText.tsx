import { FC } from "react";
import { Text, TextProps } from "react-native";
import { useTheme } from "../../theme";

const ThemedText: FC<TextProps & { variant?: 'primary' | 'secondary' }> = ({ variant = 'primary', style, ...props }) => {
    const { theme } = useTheme();
    return <Text style={[{ color: variant === 'primary' ? theme.text : theme.textSecondary }, style]} {...props} />;
}

export default ThemedText