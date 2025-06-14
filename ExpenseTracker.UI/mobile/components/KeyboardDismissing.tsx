import { FC, PropsWithChildren } from 'react';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';
import ThemedView from './themed/ThemedView';

export const KeyboardDismissing: FC<PropsWithChildren> = ({ children }) => {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView style={{ flex: 1 }}>{children}</ThemedView>
    </TouchableWithoutFeedback>
  );
};
