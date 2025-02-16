import { useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, StyleSheet, Keyboard } from 'react-native';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { ICategory } from '~/types';
import { ExpenseFormData, ExpenseFormSchema } from '~/types/expense';
import { api } from '~/services/api';
import { useTheme } from '~/theme';
import ThemedText from '~/components/themed/ThemedText';
import ThemedButton from '~/components/themed/ThemedButton';
import CategoryPicker from '~/components/CategoryPicker';
import ThemedView from '~/components/themed/ThemedView';
import ThemedBottomSheetHandle from '~/components/themed/ThemedBottomSheetHandle';
import ThemedTextInput from '~/components/themed/ThemedTextInput';

interface AddExpenseSheetProps {
    bottomSheetRef: React.RefObject<BottomSheetModal>;
}

export default function AddExpenseSheet({ bottomSheetRef }: AddExpenseSheetProps) {
    const { theme } = useTheme();
    const queryClient = useQueryClient();
    const { control, handleSubmit, reset, formState: { errors } } = useForm<ExpenseFormData>({
        resolver: zodResolver(ExpenseFormSchema),
        defaultValues: {
            amount: null,
            description: '',
            categoryId: null,
        },
    });

    const categoriesQuery = useQuery<ICategory[]>({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/categories');
            return response.data;
        },
    });

    const addExpenseMutation = useMutation({
        mutationFn: async (data: ExpenseFormData) => {
            const response = await api.post('/expenses', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            handleClose();
        },
    });

    const onSubmit = handleSubmit((data) => {
        addExpenseMutation.mutate(data);
    });

    const handleClose = useCallback(() => {
        reset();
        Keyboard.dismiss();
        bottomSheetRef.current?.dismiss();
    }, [reset]);

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
                        <Controller
                            control={control}
                            name="amount"
                            render={({ field: { onChange, value } }) => (
                                <ThemedTextInput
                                    as={BottomSheetTextInput}
                                    keyboardType="decimal-pad"
                                    placeholder="0.00"
                                    value={value?.toString()}
                                    onChangeText={onChange}
                                    error={!!errors.amount}
                                />
                            )}
                        />
                        {errors.amount && (
                            <ThemedText style={styles.errorText}>{errors.amount.message}</ThemedText>
                        )}
                    </View>

                    <View style={styles.field}>
                        <ThemedText style={styles.label}>Description</ThemedText>
                        <Controller
                            control={control}
                            name="description"
                            render={({ field: { onChange, value } }) => (
                                <ThemedTextInput
                                    as={BottomSheetTextInput}
                                    placeholder="Enter description"
                                    value={value}
                                    onChangeText={onChange}
                                />
                            )}
                        />
                    </View>

                    <View style={styles.field}>
                        <ThemedText style={styles.label}>Category</ThemedText>
                        <Controller
                            control={control}
                            name="categoryId"
                            render={({ field: { onChange, value } }) => (
                                <CategoryPicker
                                    categories={categoriesQuery.data ?? []}
                                    selectedCategory={value?.toString() ?? null}
                                    onSelectCategory={onChange}
                                />
                            )}
                        />
                        {errors.categoryId && (
                            <ThemedText style={styles.errorText}>{errors.categoryId.message}</ThemedText>
                        )}
                    </View>

                    <View style={styles.buttons}>
                        <ThemedButton
                            title="Cancel"
                            onPress={handleClose}
                            variant="secondary"
                        />
                        <ThemedButton
                            title="Add Expense"
                            onPress={onSubmit}
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
    buttons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 4,
    },
});
