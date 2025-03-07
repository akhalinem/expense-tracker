import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { NumericFormat, useNumericFormat } from 'react-number-format';
import { zodResolver } from '@hookform/resolvers/zod';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExpenseFormData, ExpenseFormSchema, IExpense } from '~/types';
import { expensesService, } from '~/services/expenses';
import { useCategoriesToggle } from '~/hooks/useCategoriesToggle';
import ThemedText from '~/components/themed/ThemedText';
import ThemedButton from '~/components/themed/ThemedButton';
import CategoryPicker from '~/components/CategoryPicker';
import ThemedTextInput from '~/components/themed/ThemedTextInput';

type ExpenseFormProps = {
    expenseToEdit?: IExpense | null;
    month: number;
    year: number;
    onClose: () => void;
}

export default function ExpenseForm({ expenseToEdit, month, year, onClose }: ExpenseFormProps) {
    const queryClient = useQueryClient();
    const { control, setValue, handleSubmit, formState: { errors } } = useForm<ExpenseFormData>({
        resolver: zodResolver(ExpenseFormSchema),
        defaultValues: {
            amount: expenseToEdit?.amount ?? null,
            description: expenseToEdit?.description ?? '',
            categoryId: expenseToEdit?.category?.id ?? null,
        },
    });

    const categoriesToggle = useCategoriesToggle({
        defaultSelected: expenseToEdit?.category?.id ? [expenseToEdit.category.id] : [],
        onChanged: ([selectedCategoryId]) => {
            setValue('categoryId', selectedCategoryId);
        }
    });

    const addExpenseMutation = useMutation({
        mutationFn: expensesService.createExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses', { month, year }] });
            onClose();
        },
    });

    const updateExpenseMutation = useMutation({
        mutationFn: expensesService.updateExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses', { month, year }] });
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
                month,
                year
            });
        } else {
            addExpenseMutation.mutate({
                amount: data.amount ?? 0,
                description: data.description,
                categoryId: data.categoryId ?? '',
                month,
                year
            });
        }
    });

    const numericFormat = useNumericFormat({})

    return (
        <View style={styles.form}>
            <View style={[styles.section, styles.field]}>
                <ThemedText style={styles.label}>Amount</ThemedText>
                <Controller
                    control={control}
                    name="amount"
                    render={({ field }) => (
                        <NumericFormat
                            value={field.value}
                            displayType='text'
                            thousandSeparator=' '
                            renderText={(formattedValue) => (
                                <ThemedTextInput
                                    as={BottomSheetTextInput}
                                    keyboardType="decimal-pad"
                                    placeholder="0.00"
                                    value={formattedValue}
                                    onChangeText={(value) => {
                                        const extractedValue = numericFormat.removeFormatting?.(value);
                                        const parsedValue = extractedValue ? Number(extractedValue) : null;

                                        field.onChange(parsedValue);
                                    }}
                                    error={!!errors.amount} />
                            )} />
                    )}
                />
                {errors.amount && (
                    <ThemedText style={styles.errorText}>{errors.amount.message}</ThemedText>
                )}
            </View>

            <View style={[styles.section, styles.field]}>
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
                <ThemedText style={[styles.section, styles.label]}>Category</ThemedText>
                <CategoryPicker categoriesToggle={categoriesToggle} />
                {errors.categoryId && (
                    <ThemedText style={styles.errorText}>{errors.categoryId.message}</ThemedText>
                )}
            </View>

            <View style={[styles.section, styles.buttons]}>
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
    section: {
        paddingHorizontal: 16,
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
