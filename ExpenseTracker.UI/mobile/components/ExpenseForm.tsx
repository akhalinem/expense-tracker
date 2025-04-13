import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { NumericFormat, useNumericFormat } from 'react-number-format';
import DateTimePicker from '@react-native-community/datetimepicker';
import { zodResolver } from '@hookform/resolvers/zod';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExpenseFormData, ExpenseFormSchema, IExpense } from '~/types';
import { transactionsService } from '~/services/transactions';
import { useCategoriesToggle } from '~/hooks/useCategoriesToggle';
import ThemedText from '~/components/themed/ThemedText';
import ThemedButton from '~/components/themed/ThemedButton';
import CategoryPicker from '~/components/CategoryPicker';
import ThemedTextInput from '~/components/themed/ThemedTextInput';

type ExpenseFormProps = {
    expenseToEdit?: IExpense | null;
    onClose: () => void;
}

export default function ExpenseForm({ expenseToEdit, onClose }: ExpenseFormProps) {
    const queryClient = useQueryClient();
    const { control, setValue, handleSubmit, formState: { errors, isSubmitting } } = useForm<ExpenseFormData>({
        resolver: zodResolver(ExpenseFormSchema),
        defaultValues: {
            amount: expenseToEdit?.amount ?? null,
            description: expenseToEdit?.description ?? '',
            categoryId: expenseToEdit?.categoryId ?? null,
            date: new Date()
        },
    });

    const categoriesToggle = useCategoriesToggle({
        defaultSelected: expenseToEdit?.categoryId ? [expenseToEdit.categoryId] : [],
        onChanged: ([selectedCategoryId]) => {
            setValue('categoryId', selectedCategoryId);
        }
    });

    const addExpenseMutation = useMutation({
        mutationFn: transactionsService.createExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            onClose();
        },
    });

    const updateExpenseMutation = useMutation({
        mutationFn: transactionsService.updateExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            onClose();
        },
    });

    const onSubmit = handleSubmit(async (data) => {
        try {
            if (expenseToEdit) {
                await updateExpenseMutation.mutateAsync({
                    id: expenseToEdit.id,
                    amount: data.amount ?? 0,
                    description: data.description,
                    categoryId: +data.categoryId!,
                    date: data.date,
                });
            } else {
                await addExpenseMutation.mutateAsync({
                    amount: data.amount ?? 0,
                    description: data.description,
                    categoryId: +data.categoryId!,
                    date: data.date,
                });
            }
        } catch (e) {
            console.error(e);
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

            <View style={[styles.section, styles.field]}>
                <ThemedText style={[styles.label]}>Date:</ThemedText>
                <Controller
                    control={control}
                    name="date"
                    render={({ field: { onChange, value } }) => (
                        <DateTimePicker

                            value={value ? new Date(value) : new Date()}
                            mode="date"
                            display="default"
                            onChange={(_, selectedDate) => {
                                const currentDate = selectedDate || value;
                                onChange(currentDate);
                            }}
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
                    loading={isSubmitting}
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
    horizontal: {
        flexDirection: 'row',
        alignItems: 'center',
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
