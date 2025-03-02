import { useCallback } from 'react';
import { StyleSheet, Keyboard } from 'react-native';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { IExpense } from '~/types';
import { useTheme } from '~/theme';
import ThemedText from '~/components/themed/ThemedText';
import ThemedView from '~/components/themed/ThemedView';
import ThemedBottomSheetHandle from '~/components/themed/ThemedBottomSheetHandle';
import ExpenseForm from '~/components/ExpenseForm';

interface ISaveExpenseSheetProps {
    bottomSheetRef: React.RefObject<BottomSheetModal<IExpense | null>>;
    month: number;
    year: number;
}

export default function SaveExpenseSheet({ bottomSheetRef, month, year }: ISaveExpenseSheetProps) {
    const { theme } = useTheme();

    const handleClose = useCallback(() => {
        Keyboard.dismiss();
        bottomSheetRef.current?.dismiss();
    }, []);

    const renderBackdrop = useCallback(
        (props: BottomSheetDefaultBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
            />
        ),
        []
    );

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            snapPoints={['50%']}
            enablePanDownToClose
            keyboardBehavior="interactive"
            onDismiss={handleClose}
            backgroundStyle={{ backgroundColor: theme.background }}
            handleComponent={ThemedBottomSheetHandle}
            backdropComponent={renderBackdrop}
            enableDynamicSizing={false}
        >
            {({ data }) => (
                <ThemedView as={BottomSheetView} style={styles.container}>
                    <ThemedText style={[styles.section, styles.title]}>
                        {data ? 'Edit Expense' : 'Add Expense'}
                    </ThemedText>
                    <ExpenseForm
                        expenseToEdit={data}
                        onClose={handleClose}
                        month={month}
                        year={year}
                    />
                </ThemedView>
            )}
        </BottomSheetModal>
    );
}

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
