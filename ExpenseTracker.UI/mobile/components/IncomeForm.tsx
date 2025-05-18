import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { NumericFormat, useNumericFormat } from 'react-number-format';
import DateTimePicker from '@react-native-community/datetimepicker';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Income, IncomeFormData, IncomeFormSchema } from '~/types';
import { transactionsService } from '~/services/transactions';
import ThemedText from '~/components/themed/ThemedText';
import ThemedButton from '~/components/themed/ThemedButton';
import ThemedTextInput from '~/components/themed/ThemedTextInput';

type IncomeFormProps = {
    data?: Income | null;
    onClose: () => void;
}

export default function IncomeForm({ data, onClose }: IncomeFormProps) {
    const queryClient = useQueryClient();
    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<IncomeFormData>({
        resolver: zodResolver(IncomeFormSchema),
        defaultValues: {
            amount: data?.amount ?? null,
            description: data?.description ?? '',
            date: data?.date ? dayjs(data.date).toDate() : new Date()
        },
    });

    const addMutation = useMutation({
        mutationFn: transactionsService.createIncome,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            onClose();
        },
    });

    const updateMutation = useMutation({
        mutationFn: transactionsService.updateIncome,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            onClose();
        },
    });

    const onSubmit = handleSubmit(async (formValues) => {
        try {
            if (data) {
                await updateMutation.mutateAsync({
                    id: data.id,
                    amount: formValues.amount ?? 0,
                    description: formValues.description,
                    date: formValues.date,
                });
            } else {
                await addMutation.mutateAsync({
                    amount: formValues.amount ?? 0,
                    description: formValues.description,
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
