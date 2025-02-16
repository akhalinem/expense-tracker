import { useCallback } from 'react';
import { StyleSheet, Keyboard } from 'react-native';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { useQuery } from '@tanstack/react-query';
import { ICategory, IExpense } from '~/types';
import { api } from '~/services/api';
import { useTheme } from '~/theme';
import ThemedText from '~/components/themed/ThemedText';
import ThemedView from '~/components/themed/ThemedView';
import ThemedBottomSheetHandle from '~/components/themed/ThemedBottomSheetHandle';
import ExpenseForm from './ExpenseForm';

interface ISaveExpenseSheetProps {
    bottomSheetRef: React.RefObject<BottomSheetModal<IExpense | null>>;
}

export default function SaveExpenseSheet({ bottomSheetRef }: ISaveExpenseSheetProps) {
    const { theme } = useTheme();

    const categoriesQuery = useQuery<ICategory[]>({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/categories');
            return response.data;
        },
    });

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
                    <ThemedText style={styles.title}>
                        {data ? 'Edit Expense' : 'Add Expense'}
                    </ThemedText>
                    <ExpenseForm
                        expenseToEdit={data}
                        categories={categoriesQuery.data ?? []}
                        onClose={handleClose}
                    />
                </ThemedView>
            )}
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
    },
});
