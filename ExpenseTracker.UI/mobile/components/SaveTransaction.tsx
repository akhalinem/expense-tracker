import React, { FC, useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { useRouter } from "expo-router";
import { Transaction, TransactionTypeEnum } from "~/types";
import { useTheme } from "~/theme";
import ThemedText from "~/components/themed/ThemedText";
import ThemedView from "~/components/themed/ThemedView";
import ExpenseForm from "~/components/ExpenseForm";
import IncomeForm from "~/components/IncomeForm";
import { KeyboardDismissing } from "~/components/KeyboardDismissing";

export const SaveTransaction: FC<{
    type: TransactionTypeEnum,
    transaction?: Transaction,
    onClose(): void
}> = (props) => {
    const { type, transaction, onClose } = props;

    return (
        <ThemedView style={styles.container}>
            <Header type={type} isEditing={!!transaction} />

            <KeyboardDismissing>
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
            </KeyboardDismissing>
        </ThemedView>
    );
}

const Header: FC<{ type: TransactionTypeEnum, isEditing?: boolean }> = ({ type, isEditing }) => {
    return (
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
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
    container: {
        flex: 1,
        paddingVertical: 16
    }
});
