import { FC } from "react";
import { StyleSheet, View, FlatList, ListRenderItemInfo } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import dayjs from "dayjs";
import { Transaction } from "~/types";
import { displayCurrency, displayDate } from "~/utils";
import { Theme, useTheme } from "~/theme";
import ThemedView from "~/components/themed/ThemedView";
import ThemedText from "~/components/themed/ThemedText";

export const Transactions: FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    const { data, stickyHeaderIndices } = getListData(transactions);

    return (
        <FlatList
            data={data}
            renderItem={ListItemRenderer}
            keyExtractor={keyExtractor}
            stickyHeaderIndices={stickyHeaderIndices}
        />
    );
};

// Enum to distinguish between header and transaction items
enum ItemType {
    HEADER,
    TRANSACTION
}

type TransactionIcon = {
    name: keyof typeof Ionicons.glyphMap;
    color: string;
    backgroundColor: string;
}

// Combined type for list items
type ListItem =
    | { type: ItemType.HEADER; date: string; dailyExpense: number; }
    | { type: ItemType.TRANSACTION; transaction: Transaction; };

// Simple icon mapping based on transaction type
const getTransactionIcon = (type: string, theme: Theme): TransactionIcon => {
    if (type === "income") {
        return {
            name: "arrow-down",
            color: theme.success,
            backgroundColor: theme.incomeBg
        };
    }

    return {
        name: "arrow-up",
        color: theme.error,
        backgroundColor: theme.expenseBg
    };
};

// Transaction item component
const TransactionItem: FC<{ transaction: Transaction, }> = ({ transaction, }) => {
    const { theme } = useTheme();
    const icon = getTransactionIcon(transaction.type, theme);
    const isIncome = transaction.type === "income";

    // Colors based on transaction type
    const amountColor = isIncome ? theme.success : theme.error;

    return (
        <View style={[styles.transactionItem, { borderTopColor: theme.border }]}>
            <View style={styles.iconContainer}>
                <View style={[styles.icon, { backgroundColor: icon.backgroundColor }]}>
                    <Ionicons name={icon.name} size={24} color={icon.color} />
                </View>
            </View>

            <View style={styles.detailsContainer}>
                <View style={styles.transactionTop}>
                    <ThemedText
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={styles.merchant}>
                        {transaction.description}
                    </ThemedText>
                    <ThemedText
                        style={[styles.amount, { color: amountColor }]}>
                        {displayCurrency(transaction.amount)}
                    </ThemedText>
                </View>

                <View style={styles.transactionBottom}>
                    {transaction.category && (
                        <View style={[styles.categoryContainer, { backgroundColor: theme.categoryBg }]}>
                            <ThemedText style={[styles.category, { color: theme.textSecondary }]}>
                                {transaction.category}
                            </ThemedText>
                        </View>
                    )}
                    <ThemedText style={[styles.time, { color: theme.textSecondary }]}>
                        {dayjs(transaction.date).format("HH:mm")}
                    </ThemedText>
                </View>
            </View>
        </View>
    );
};

// Date header component with only date and expenses
const DateHeader: FC<{ date: string, dailyExpense: number }> = ({ date, dailyExpense }) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.dateHeaderContainer, {
            backgroundColor: theme.surface,
        }]}>
            <View style={styles.dateHeader}>
                <ThemedText style={styles.dateText}>{displayDate(date)}</ThemedText>
                <ThemedText style={[styles.dailyExpense, { color: theme.error }]}>
                    {displayCurrency(dailyExpense)}
                </ThemedText>
            </View>
        </View>
    );
};

const keyExtractor = (item: ListItem,) =>
    item.type === ItemType.HEADER
        ? `header-${item.date}`
        : `transaction-${item.transaction.id}`

const ListItemRenderer = (props: ListRenderItemInfo<ListItem>) => {
    const { item } = props

    if (item.type === ItemType.HEADER) {
        return (
            <DateHeader
                date={item.date}
                dailyExpense={item.dailyExpense}
            />
        );
    } else {
        return (
            <TransactionItem
                transaction={item.transaction}
            />
        );
    }
};

const getListData = (transactions: Transaction[]) => {
    // Group transactions by date
    const groupedTransactions = transactions.reduce((groups, transaction) => {
        const date = dayjs(transaction.date).format("YYYY-MM-DD");
        if (!groups[date]) groups[date] = [];
        groups[date].push(transaction);

        return groups;
    }, {} as Record<string, Transaction[]>);

    // Calculate expenses for each date
    const dailyExpenses = Object.entries(groupedTransactions).reduce((stats, [date, items]) => {
        const transactions = items as Transaction[];
        const expense = transactions
            .filter(t => t.type === "expense")
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        stats[date] = expense;

        return stats;
    }, {} as Record<string, number>);

    // Create a flat list with headers and transactions for sticky headers
    const listData: ListItem[] = [];
    const stickyHeaderIndices: number[] = [];

    Object.entries(groupedTransactions).forEach(([date, transactions]) => {
        // Add header for this date
        const headerIndex = listData.length;
        stickyHeaderIndices.push(headerIndex);

        listData.push({
            type: ItemType.HEADER,
            date,
            dailyExpense: dailyExpenses[date]
        });

        // Add transactions for this date
        (transactions as Transaction[]).forEach(transaction => {
            listData.push({
                type: ItemType.TRANSACTION,
                transaction
            });
        });
    });

    return { data: listData, stickyHeaderIndices, dailyExpenses }
}

const styles = StyleSheet.create({
    dateHeaderContainer: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        zIndex: 1, // Ensure header is above content
    },
    dateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
    },
    dailyExpense: {
        fontSize: 16,
        fontWeight: '500',
    },
    transactionItem: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 16,
    },
    iconContainer: {
        marginRight: 12,
    },
    icon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailsContainer: {
        flex: 1,
    },
    transactionTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    merchant: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
        marginRight: 12, // Add margin to prevent text from touching amount
        paddingRight: 4, // Extra padding for safety
    },
    amount: {
        fontSize: 16,
        fontWeight: '500',
        flexShrink: 0, // Prevent amount from shrinking
    },
    transactionBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryContainer: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
    },
    category: {
        fontSize: 12,
        color: '#A0A0A0',
    },
    time: {
        fontSize: 12,
        color: '#A0A0A0',
    },
});
