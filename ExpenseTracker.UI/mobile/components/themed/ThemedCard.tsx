import { FC } from "react";
import { View, ViewProps } from "react-native";
import { useTheme } from "~/theme";

const ThemedCard: FC<ViewProps> = ({ style, ...props }) => {
    const { theme } = useTheme();
    return <View style={[{ backgroundColor: theme.card, shadowColor: theme.shadow }, style]} {...props} />;
}

export default ThemedCard