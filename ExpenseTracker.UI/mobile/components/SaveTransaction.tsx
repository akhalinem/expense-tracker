import React, { FC, useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { useRouter } from "expo-router";
import { Transaction, TransactionTypeEnum } from "~/types";
import ThemedText from "~/components/themed/ThemedText";
import { useTheme } from "~/theme";
import ExpenseForm from "~/components/ExpenseForm";
import IncomeForm from "~/components/IncomeForm";

export const SaveTransaction: FC<{
    type: TransactionTypeEnum,
    transaction?: Transaction,
    onClose(): void
}> = (props) => {
    const { type, transaction, onClose } = props;

    return (
        <View style={styles.container}>
            <Header type={type} isEditing={!!transaction} />

            <Divider />

            {type === TransactionTypeEnum.EXPENSE && (
                <ExpenseForm
                    data={transaction}
                    onClose={onClose}
                />
            )}
            {type === TransactionTypeEnum.INCOME && (
                <IncomeForm
                    data={transaction}
                    onClose={onClose}
                />
            )}
        </View>
    );
}

const Header: FC<{ type: TransactionTypeEnum, isEditing?: boolean }> = ({ type, isEditing }) => {
    return (
        <View style={{ paddingHorizontal: 16 }}>
            <HeaderTitle type={type} isEditing={isEditing} />
            {!isEditing && <SegmentedControlHeader type={type} />}
        </View>
    )

}

const Divider = () => {
    const { theme } = useTheme();

    return (
        <ThemedText
            style={{
                height: 1,
                backgroundColor: theme.border,
                marginVertical: 16,
            }}
        />
    )
}

const HeaderTitle: FC<{ type: TransactionTypeEnum, isEditing?: boolean }> = ({ type, isEditing }) => {
    const { theme } = useTheme();

    const action = isEditing ? 'Edit' : 'Add';
    const actionType = type === TransactionTypeEnum.EXPENSE ? 'Expense' : 'Income';
    const actionText = `${action} ${actionType}`;

    return (
        <ThemedText
            style={{
                fontSize: 24,
                color: theme.text,
                textAlign: 'center',
            }}
        >
            {actionText}
        </ThemedText>
    )
}

const SegmentedControlHeader: FC<{ type: TransactionTypeEnum }> = ({ type }) => {
    const { theme } = useTheme();
    const router = useRouter();

    const handleChangeTab = useCallback((index: number) => {
        if (index === 0) {
            router.setParams({ type: TransactionTypeEnum.EXPENSE });
        } else {
            router.setParams({ type: TransactionTypeEnum.INCOME });
        }
    }, []);

    const selectedTabIndex = useMemo(() => {
        if (type === TransactionTypeEnum.EXPENSE) {
            return 0;
        } else if (type === TransactionTypeEnum.INCOME) {
            return 1;
        }

        return -1;
    }, [type]);

    return (
        <SegmentedControl
            style={{ height: 40, marginTop: 12 }}
            fontStyle={{ fontSize: 16, color: theme.text }}
            activeFontStyle={{ fontSize: 16, color: theme.text }}
            tabStyle={{ backgroundColor: theme.background }}
            values={[TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME]}
            selectedIndex={selectedTabIndex}
            onChange={event => {
                handleChangeTab(event.nativeEvent.selectedSegmentIndex);
            }}
        />
    )
}

const styles = StyleSheet.create({
    container: { paddingVertical: 16 }
});
