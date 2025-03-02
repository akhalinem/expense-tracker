import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ICategory, IExpense, ExpenseFormData, ExpenseFormSchema } from '~/types';
import { expensesService, } from '~/services/expenses';
import ThemedText from '~/components/themed/ThemedText';
import ThemedButton from '~/components/themed/ThemedButton';
import CategoryPicker from '~/components/CategoryPicker';
import ThemedTextInput from '~/components/themed/ThemedTextInput';

interface ExpenseFormProps {
    expenseToEdit?: IExpense | null;
    categories: ICategory[];
    onClose: () => void;

}

export default function ExpenseForm({ expenseToEdit, categories, onClose }: ExpenseFormProps) {
    const queryClient = useQueryClient();
    const { control, handleSubmit, formState: { errors } } = useForm<ExpenseFormData>({
        resolver: zodResolver(ExpenseFormSchema),
        defaultValues: {
            amount: expenseToEdit?.amount ?? null,
            description: expenseToEdit?.description ?? '',
            categoryId: expenseToEdit?.category?.id ?? null,
        },
    });

    const addExpenseMutation = useMutation({
        mutationFn: expensesService.createExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            onClose();
        },
    });

    const updateExpenseMutation = useMutation({
        mutationFn: expensesService.updateExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            onClose();
        },
    });

    const onSubmit = handleSubmit((data) => {
        if (expenseToEdit) {
            updateExpenseMutation.mutate({
                id: expenseToEdit.id,
                amount: data.amount ?? 0,
                description: data.description,
                categoryId: data.categoryId ?? '',
            });
        } else {
            addExpenseMutation.mutate({
                amount: data.amount ?? 0,
                description: data.description,
                categoryId: data.categoryId ?? '',
            });
        }
    });

    return (
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
                            categories={categories}
                            selectedCategory={value ?? null}
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
                    onPress={onClose}
                    variant="secondary"
                />
                <ThemedButton
                    title={expenseToEdit ? 'Edit Expense' : 'Add Expense'}
                    onPress={onSubmit}
                    loading={addExpenseMutation.isPending || updateExpenseMutation.isPending}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
