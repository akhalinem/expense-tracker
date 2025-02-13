import { FC } from "react";
import { View, ViewProps } from "react-native";
import { useTheme } from "../../theme";

const ThemedView: FC<ViewProps> = ({ style, ...props }) => {
    const { theme } = useTheme();
    return <View style={[{ backgroundColor: theme.background }, style]} {...props} />;
}

export default ThemedView
