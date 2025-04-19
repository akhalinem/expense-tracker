import { FC, useMemo, useRef } from "react";
import { StyleSheet, View, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { FlashList, ListRenderItemInfo } from "@shopify/flash-list";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Expense, Transaction } from "~/types";
import { displayCurrency, displayDate } from "~/utils";
import { transactionsService } from "~/services/transactions";
import { Theme, useTheme } from "~/theme";
import ThemedText from "~/components/themed/ThemedText";
import ThemedButton from "~/components/themed/ThemedButton";
import SaveExpenseSheet from "~/components/SaveExpenseSheet";

export const Transactions: FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    const insets = useSafeAreaInsets()
    const bottomSheetRef = useRef<BottomSheetModal<Expense | null>>(null);

    const handleAddExpense = () => {
        bottomSheetRef.current?.present();
    };

    const { data, stickyHeaderIndices } = useMemo(() => getListData(transactions), [transactions]);

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
                        borderRadius: 16,
                        paddingVertical: 24,
                        marginBottom: insets.bottom,
                    }}
                    title="Add New"
                    onPress={handleAddExpense}
                />
            </View>



            <SaveExpenseSheet bottomSheetRef={bottomSheetRef} />
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
    const bottomSheetRef = useRef<BottomSheetModal<Expense | null>>(null);

    const deleteExpenseMutation = useMutation({
        mutationFn: transactionsService.deleteExpense,
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
                    onPress: () => deleteExpenseMutation.mutate(transactionId)
                }
            ]
        );
    };

    const handleEdit = (transaction: Transaction) => {
        if (!transaction.categoryId || !transaction.categoryName) {
            console.error('Category ID or name is missing');
            return;
        }

        bottomSheetRef.current?.present({
            id: transaction.id,
            amount: transaction.amount,
            categoryId: transaction.categoryId,
            categoryName: transaction.categoryName,
            date: transaction.date,
            description: transaction.description
        });
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
                                {transaction.categoryName && (
                                    <View style={[styles.categoryContainer, { backgroundColor: theme.categoryBg }]}>
                                        <ThemedText style={[styles.category, { color: theme.textSecondary }]}>
                                            {transaction.categoryName}
                                        </ThemedText>
                                    </View>
                                )}
                                <ThemedText style={[styles.time, { color: theme.textSecondary }]}>
                                    {dayjs(transaction.date).format("HH:mm")}
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                </ReanimatedSwipeable>
            </View >

            <SaveExpenseSheet bottomSheetRef={bottomSheetRef} />
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
