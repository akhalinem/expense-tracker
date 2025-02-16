import { useState, useCallback, } from 'react';
import { View, StyleSheet, Keyboard } from 'react-native';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { ICategory } from '~/types';
import { api } from '~/services/api';
import { useTheme } from '~/theme';
import ThemedText from '~/components/themed/ThemedText';
import ThemedButton from '~/components/themed/ThemedButton';
import CategoryPicker from '~/components/CategoryPicker';
import ThemedView from '~/components/themed/ThemedView';
import ThemedBottomSheetHandle from '~/components/themed/ThemedBottomSheetHandle';

interface AddExpenseSheetProps {
    bottomSheetRef: React.RefObject<BottomSheetModal>;
}

export default function AddExpenseSheet({ bottomSheetRef }: AddExpenseSheetProps) {
    const { theme } = useTheme();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const queryClient = useQueryClient();

    const categoriesQuery = useQuery<ICategory[]>({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/categories');
            return response.data;
        },
    });

    const addExpenseMutation = useMutation({
        mutationFn: async (data: { amount: number; description: string; categoryId: string }) => {
            const response = await api.post('/expenses', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            handleClose();
        },
    });

    const handleSubmit = () => {
        if (!amount || !selectedCategory) return;

        addExpenseMutation.mutate({
            amount: parseFloat(amount),
            description,
            categoryId: selectedCategory,
        });
    };

    const handleClose = useCallback(() => {
        setAmount('');
        setDescription('');
        setSelectedCategory('');
        Keyboard.dismiss();
        bottomSheetRef.current?.dismiss();
    }, []);

    // renders
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
            <ThemedView as={BottomSheetView} style={styles.container}>
                <ThemedText style={styles.title}>Add Expense</ThemedText>

                <View style={styles.form}>
                    <View style={styles.field}>
                        <ThemedText style={styles.label}>Amount</ThemedText>
                        <BottomSheetTextInput
                            style={styles.input}
                            keyboardType="decimal-pad"
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0.00"
                        />
                    </View>

                    <View style={styles.field}>
                        <ThemedText style={styles.label}>Description</ThemedText>
                        <BottomSheetTextInput
                            style={styles.input}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Enter description"
                        />
                    </View>

                    <View style={styles.field}>
                        <ThemedText style={styles.label}>Category</ThemedText>
                        <CategoryPicker
                            categories={categoriesQuery.data ?? []}
                            selectedCategory={selectedCategory}
                            onSelectCategory={setSelectedCategory}
                        />
                    </View>

                    <View style={styles.buttons}>
                        <ThemedButton
                            title="Cancel"
                            onPress={handleClose}
                            variant="secondary"
                        />
                        <ThemedButton
                            title="Add Expense"
                            onPress={handleSubmit}
                            disabled={!amount || !selectedCategory}
                            loading={addExpenseMutation.isPending}
                        />
                    </View>
                </View>
            </ThemedView>
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
    form: {
        gap: 16,
    },
    field: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
    },
    input: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
});
