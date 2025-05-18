import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { NumericFormat, useNumericFormat } from 'react-number-format';
import DateTimePicker from '@react-native-community/datetimepicker';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ExpenseFormData, ExpenseFormSchema, Expense } from '~/types';
import { transactionsService } from '~/services/transactions';
import { useCategoriesToggle } from '~/hooks/useCategoriesToggle';
import ThemedText from '~/components/themed/ThemedText';
import ThemedButton from '~/components/themed/ThemedButton';
import CategoryPicker from '~/components/CategoryPicker';
import ThemedTextInput from '~/components/themed/ThemedTextInput';

type ExpenseFormProps = {
    data?: Expense | null;
    onClose: () => void;
}

export default function ExpenseForm({ data, onClose }: ExpenseFormProps) {
    const queryClient = useQueryClient();
    const { control, setValue, handleSubmit, formState: { errors, isSubmitting } } = useForm<ExpenseFormData>({
        resolver: zodResolver(ExpenseFormSchema),
        defaultValues: {
            amount: data?.amount ?? null,
            description: data?.description ?? '',
            categoryIds: data?.categories.map(category => category.id) ?? [],
            date: data?.date ? dayjs(data.date).toDate() : new Date()
        },
    });

    const categoriesToggle = useCategoriesToggle({
        multiple: true,
        defaultSelected: data?.categories ? data.categories.map(category => category.id) : [],
        onChanged: (selectedCategoryId) => {
            setValue('categoryIds', selectedCategoryId);
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

    const onSubmit = handleSubmit(async (formValues) => {
        try {
            if (data) {
                await updateExpenseMutation.mutateAsync({
                    id: data.id,
                    amount: formValues.amount ?? 0,
                    description: formValues.description,
                    categoryIds: formValues.categoryIds,
                    date: formValues.date,
                });
            } else {
                await addExpenseMutation.mutateAsync({
                    amount: formValues.amount ?? 0,
                    description: formValues.description,
                    categoryIds: formValues.categoryIds,
                    date: formValues.date,
                });
            }
        } catch (e) {
            console.error(e);
        }
    });

    const numericFormat = useNumericFormat({})

    return (
        <View style={styles.form}>
            <View style={styles.content}>
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
                                        keyboardType="decimal-pad"
                                        placeholder="0.00"
                                        autoFocus
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
                                placeholder="Enter description"
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />
                </View>

                <View style={[styles.section, styles.field, {}]}>
                    <ThemedText style={[styles.label]}>Date:</ThemedText>
                    <Controller
                        control={control}
                        name="date"
                        render={({ field: { onChange, value } }) => (
                            <DateTimePicker
                                value={value ? new Date(value) : new Date()}
                                mode="date"
                                display='default'
                                style={{ marginLeft: -8 }}
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
                    {errors.categoryIds && (
                        <ThemedText style={styles.errorText}>{errors.categoryIds.message}</ThemedText>
                    )}
                </View>
            </View>

            <View style={[styles.section, styles.footer]}>
                <ThemedButton
                    title='Save'
                    onPress={onSubmit}
                    loading={isSubmitting}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    form: {
    },
    content: {
        gap: 16,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
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
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 4,
    },
});
