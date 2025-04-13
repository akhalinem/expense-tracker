import { useCallback, useMemo } from 'react';
import { StyleSheet, Keyboard } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { BottomSheetBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { Expense } from '~/types';
import { useTheme } from '~/theme';
import ThemedText from '~/components/themed/ThemedText';
import ThemedView from '~/components/themed/ThemedView';
import ExpenseForm from '~/components/ExpenseForm';

type SaveExpenseSheetProps = {
    bottomSheetRef: React.RefObject<BottomSheetModal<Expense | null>>;
}

export default function SaveExpenseSheet({ bottomSheetRef }: SaveExpenseSheetProps) {
    const { theme } = useTheme();

    const handleClose = useCallback(() => {
        Keyboard.dismiss();
        bottomSheetRef.current?.dismiss();
    }, []);

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            enablePanDownToClose
            keyboardBlurBehavior='restore'
            keyboardBehavior="interactive"
            onDismiss={handleClose}
            backgroundStyle={{ backgroundColor: theme.background }}
            handleIndicatorStyle={{ backgroundColor: theme.border }}
            handleStyle={{ backgroundColor: theme.background }}
            backdropComponent={CustomBackdrop}
        >
            {({ data }) => (
                <ThemedView as={BottomSheetView} style={styles.container}>
                    <ThemedText style={[styles.section, styles.title]}>
                        {data ? 'Edit Expense' : 'Add Expense'}
                    </ThemedText>
                    <ExpenseForm
                        expenseToEdit={data}
                        onClose={handleClose}
                    />
                </ThemedView>
            )}
        </BottomSheetModal>
    );
}

const CustomBackdrop = ({ animatedIndex, style }: BottomSheetBackdropProps) => {
    const { theme } = useTheme()

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            animatedIndex.value,
            [-1, 0],
            [0, 0.5],
            Extrapolation.CLAMP
        ),
    }));

    // styles
    const containerStyle = useMemo(
        () => [
            style,
            {
                backgroundColor: theme.shadow,
            },
            containerAnimatedStyle,
        ],
        [style, containerAnimatedStyle]
    );

    return <Animated.View style={containerStyle} />;
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingVertical: 16,
    },
    section: {
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
    },
});
