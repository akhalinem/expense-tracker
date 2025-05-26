import React, { FC } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, View } from 'react-native';
import dayjs from 'dayjs';
import { Expense } from '~/types';
import ThemedText from '~/components/themed/ThemedText';
import ThemedView from '~/components/themed/ThemedView';
import ThemedCard from '~/components/themed/ThemedCard';
import { displayCurrency, displayDate } from '~/utils';

type ExpenseSuggestionListProps = {
    suggestions: Expense[];
    isLoading: boolean;
    onSelect: (expense: Expense) => void;
    onDismiss: () => void;
}

export const ExpenseSuggestionList: FC<ExpenseSuggestionListProps> = ({
    suggestions,
    isLoading,
    onSelect,
    onDismiss
}) => {
    return (
        <ThemedView style={styles.container}>
            <ThemedView style={styles.header}>
                <ThemedText style={styles.title}>
                    {isLoading ? 'Finding matches...' : 'Suggestions'}
                </ThemedText>
                <TouchableOpacity onPress={onDismiss}>
                    <ThemedText style={styles.dismissText}>Dismiss</ThemedText>
                </TouchableOpacity>
            </ThemedView>

            {isLoading ? (
                <ActivityIndicator size="small" style={styles.loader} />
            ) : suggestions.length > 0 ? (
                <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <SuggestionItem expense={item} onSelect={onSelect} />
                    )}
                    style={styles.list}
                />
            ) : (
                <ThemedView style={styles.emptyContainer}>
                    <ThemedText style={styles.emptyText}>
                        No matching expenses found
                    </ThemedText>
                </ThemedView>
            )}
        </ThemedView>
    );
}

// Separate component for each suggestion item
const SuggestionItem: FC<{
    expense: Expense;
    onSelect: (expense: Expense) => void
}> = ({
    expense,
    onSelect
}) => {
        return (
            <ThemedCard
                as={TouchableOpacity}
                style={styles.item}
                onPress={() => onSelect(expense)}
                activeOpacity={0.7}
            >
                <View style={styles.itemTop}>
                    <ThemedText style={styles.amount}>
                        {displayCurrency(expense.amount)}
                    </ThemedText>
                    <ThemedText style={styles.date}>
                        {displayDate(expense.date)}
                    </ThemedText>
                </View>

                <ThemedText style={styles.description}>
                    {expense.description || 'No description'}
                </ThemedText>

                {expense.categories && expense.categories.length > 0 && (
                    <View style={styles.categories}>
                        {expense.categories.map(category => (
                            <View key={category.id} style={styles.category}>
                                <ThemedText style={styles.categoryText}>
                                    {category.name}
                                </ThemedText>
                            </View>
                        ))}
                    </View>
                )}
            </ThemedCard>
        );
    }

const styles = StyleSheet.create({
    container: {
        borderRadius: 8,
        padding: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontWeight: '600',
        fontSize: 14,
    },
    dismissText: {
        color: '#007AFF',
        fontSize: 14,
    },
    list: {
        maxHeight: 220,
    },
    item: {
        margin: 4,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#007AFF',
    },
    itemTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    amount: {
        fontWeight: '700',
        fontSize: 16,
    },
    date: {
        color: '#666',
        fontSize: 12,
    },
    description: {
        fontSize: 14,
        marginVertical: 4,
    },
    categories: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4,
    },
    category: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 12,
    },
    loader: {
        marginVertical: 16,
    },
    emptyContainer: {
        padding: 16,
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
    },
});

