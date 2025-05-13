import { FC, useMemo } from "react";
import { StyleSheet, View, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Ionicons } from '@expo/vector-icons';
import { FlashList, ListRenderItemInfo } from "@shopify/flash-list";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Transaction, TransactionTypeEnum } from "~/types";
import { DEFAULT_CATEGORY_COLOR } from "~/constants";
import { displayCurrency, displayDate } from "~/utils";
import { transactionsService } from "~/services/transactions";
import { Theme, useTheme } from "~/theme";
import ThemedView from "~/components/themed/ThemedView";
import ThemedText from "~/components/themed/ThemedText";
import ThemedButton from "~/components/themed/ThemedButton";
import { TransactionSheet, useTransactionSheet } from "~/components/SaveTransactionSheet";

export const Transactions: FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    const insets = useSafeAreaInsets()
    const sheet = useTransactionSheet()

    const handleAddNew = () => sheet.open({
        type: TransactionTypeEnum.EXPENSE,
        data: null
    });

    const { data, stickyHeaderIndices } = useMemo(() => getListData(transactions), [transactions]);

    if (!data.length) {
        return (
            <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: insets.bottom }}>
                <ThemedText>No transactions found.</ThemedText>
            </ThemedView>
        );
    }

    return (
        <>
            <FlashList
                data={data}
                renderItem={ListItemRenderer}
                stickyHeaderIndices={stickyHeaderIndices}
            />

            <View>
                <ThemedButton
                    style={{
                        paddingVertical: 24,
                        borderRadius: 0,
                    }}
                    title="Add New"
                    onPress={handleAddNew}
                />
            </View>

            <TransactionSheet sheet={sheet} />
        </>
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
    const queryClient = useQueryClient()
    const sheet = useTransactionSheet()

    const deleteMutation = useMutation({
        mutationFn: transactionsService.deleteTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
        onError: (error) => {
            Alert.alert("Error", "Failed to delete the expense: " + error.message);
        }
    });

    const handleDelete = (transactionId: number) => {
        Alert.alert(
            "Delete Expense",
            "Are you sure you want to delete this expense?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteMutation.mutate(transactionId)
                }
            ]
        );
    };

    const handleEdit = (transaction: Transaction) => {
        if (transaction.type === TransactionTypeEnum.EXPENSE) {
            sheet.open({
                type: TransactionTypeEnum.EXPENSE,
                data: {
                    id: transaction.id,
                    amount: transaction.amount,
                    categories: transaction.categories,
                    date: transaction.date,
                    description: transaction.description
                }
            });
        } else if (transaction.type === TransactionTypeEnum.INCOME) {
            sheet.open({
                type: TransactionTypeEnum.INCOME,
                data: {
                    id: transaction.id,
                    amount: transaction.amount,
                    date: transaction.date,
                    description: transaction.description
                }
            });
        }
    };

    const renderRightActions = (transaction: Transaction) => {
        return (
            <View style={styles.expenseRightActionsContainer}>
                <TouchableOpacity
                    style={styles.editAction}
                    onPress={() => handleEdit(transaction)}
                >
                    <Ionicons name="create-outline" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteAction}
                    onPress={() => handleDelete(transaction.id)}
                >
                    <Ionicons name="trash-outline" size={24} color="white" />
                </TouchableOpacity>
            </View>
        );
    };


    const icon = getTransactionIcon(transaction.type, theme);
    const isIncome = transaction.type === "income";
    // Colors based on transaction type
    const amountColor = isIncome ? theme.success : theme.error;

    return (
        <>
            <View style={[styles.transactionItemContainer, { borderTopColor: theme.border }]}>
                <ReanimatedSwipeable
                    renderRightActions={() => renderRightActions(transaction)}
                    rightThreshold={80}
                >
                    <View style={[styles.transactionItemContent, { backgroundColor: theme.background, }]}>
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
                                {transaction.categories && transaction.categories.length > 0 ? (
                                    <View style={styles.categoriesContainer}>
                                        {transaction.categories.slice(0, 2).map((category, index) => (
                                            <View
                                                key={category.id}
                                                style={[
                                                    styles.categoryContainer,
                                                    { backgroundColor: category.color ?? DEFAULT_CATEGORY_COLOR },
                                                    index > 0 && { marginLeft: 4 }
                                                ]}
                                            >
                                                <ThemedText style={[styles.category, { color: theme.text }]}>
                                                    {category.name}
                                                </ThemedText>
                                            </View>
                                        ))}
                                        {transaction.categories.length > 2 && (
                                            <View style={styles.moreCategoriesContainer}>
                                                <ThemedText style={styles.moreCategoriesText}>
                                                    +{transaction.categories.length - 2}
                                                </ThemedText>
                                            </View>
                                        )}
                                    </View>
                                ) : null}
                                <ThemedText style={[styles.time, { color: theme.textSecondary }]}>
                                    {dayjs(transaction.date).format("HH:mm")}
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                </ReanimatedSwipeable>
            </View>

            <TransactionSheet sheet={sheet} />
        </>
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
    transactionItemContainer: {
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    transactionItemContent: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
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
    categoriesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'nowrap',
        flex: 1,
    },
    categoryContainer: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
    },
    category: {
        fontSize: 12,
    },
    moreCategoriesContainer: {
        marginLeft: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    moreCategoriesText: {
        fontSize: 10,
        opacity: 0.7,
    },
    time: {
        fontSize: 12,
        color: '#A0A0A0',
    },

    expenseRightActionsContainer: {
        flexDirection: 'row',
    },
    deleteAction: {
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        height: '100%',
    },
    editAction: {
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        height: '100%',
    },
});
