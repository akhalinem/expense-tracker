import { FC, ComponentType } from "react";
import { View, ViewProps } from "react-native";
import { useTheme } from "~/theme";

type ThemedViewProps<C extends ComponentType<any>> = {
    as?: C;
} & ViewProps & Omit<React.ComponentProps<C>, keyof ViewProps>;

const ThemedView = <C extends ComponentType<any> = typeof View>({
    as,
    style,
    ...props
}: ThemedViewProps<C>) => {
    const { theme } = useTheme();
    const Component = as || View;
    return <Component style={[{ backgroundColor: theme.background }, style]} {...props} />;
};

export default ThemedView;
