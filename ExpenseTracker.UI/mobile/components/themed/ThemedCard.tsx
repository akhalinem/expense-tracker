import { FC, ComponentProps, ElementType } from "react";
import { View, ViewProps } from "react-native";
import { useTheme } from "~/theme";

type ThemedCardProps<T extends ElementType = typeof View> = {
    as?: T;
} & ViewProps & Omit<ComponentProps<T>, keyof ViewProps>;

const ThemedCard = <T extends ElementType = typeof View>({
    as,
    style,
    ...props
}: ThemedCardProps<T>) => {
    const { theme } = useTheme();
    const Component = as || View;

    return (
        <Component
            style={[{ backgroundColor: theme.card, shadowColor: theme.shadow }, style]}
            {...props}
        />
    );
}

export default ThemedCard;