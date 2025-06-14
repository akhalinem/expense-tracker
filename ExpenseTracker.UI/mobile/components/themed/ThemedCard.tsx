import { FC, ComponentProps, ElementType } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '~/theme';

type ThemedCardProps<T extends ElementType = typeof View> = {
  as?: T;
} & ViewProps &
  Omit<ComponentProps<T>, keyof ViewProps>;

const ThemedCard = <T extends ElementType = typeof View>({
  as,
  style,
  ...props
}: ThemedCardProps<T>) => {
  const { theme } = useTheme();
  const Component = as || View;

  return (
    <Component
      style={[
        {
          ...styles.container,
          backgroundColor: theme.surface,
          shadowColor: theme.shadow,
        },
        style,
      ]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
});

export default ThemedCard;
