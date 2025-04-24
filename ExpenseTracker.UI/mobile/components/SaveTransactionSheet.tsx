import { FC, useCallback, useMemo, useRef, useState } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { BottomSheetModal, BottomSheetProps } from '@gorhom/bottom-sheet';
import { BottomSheetBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { Expense, Income, TransactionTypeEnum } from '~/types';
import { useTheme } from '~/theme';
import ThemedText from './themed/ThemedText';
import ExpenseForm from './ExpenseForm';
import IncomeForm from './IncomeForm';

export type TransactionSheetData = {
    type: TransactionTypeEnum.EXPENSE;
    data: Expense | null;
} | {
    type: TransactionTypeEnum.INCOME;
    data: Income | null;
}

export type UseTransactionSheetReturn = {
    bottomSheetRef: React.RefObject<BottomSheetModal>;
    sheetProps: BottomSheetProps & {
        ref?: React.ForwardedRef<BottomSheetModal<TransactionSheetData | null>>;
        onDismiss?: VoidFunction;
    };
    data: TransactionSheetData | null;
    setData: React.Dispatch<React.SetStateAction<TransactionSheetData | null>>;
    open: (data?: TransactionSheetData | null) => void;
    close: () => void;
}

export const useTransactionSheet = (): UseTransactionSheetReturn => {
    const { theme } = useTheme();
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const [data, setData] = useState<TransactionSheetData | null>(null);

    const open = useCallback((data: TransactionSheetData | null = null) => {
        setData(data);
        bottomSheetRef.current?.present();
    }, []);

    const close = useCallback(() => {
        bottomSheetRef.current?.dismiss();
    }, []);

    const sheetProps = useMemo((): BottomSheetProps & {
        ref?: React.ForwardedRef<BottomSheetModal<TransactionSheetData | null>>;
        onDismiss?: VoidFunction;
    } => ({
        children: null,
        ref: bottomSheetRef,
        onDismiss: close,
        enablePanDownToClose: true,
        keyboardBlurBehavior: 'restore',
        keyboardBehavior: 'interactive',
        snapPoints: [550],
        enableDynamicSizing: false,
        backgroundStyle: { backgroundColor: theme.background },
        handleIndicatorStyle: { backgroundColor: theme.border },
        handleStyle: { backgroundColor: theme.background },
        backdropComponent: CustomBackdrop,
    }), [theme, close]);

    return { bottomSheetRef, sheetProps, data, setData, open, close };
}

export const TransactionSheet: FC<{ sheet: UseTransactionSheetReturn }> = ({ sheet }) => {
    const { data, sheetProps } = sheet;

    return (
        <BottomSheetModal {...sheetProps}>
            <TransactionSheetHeader sheet={sheet} />

            {data?.type === TransactionTypeEnum.EXPENSE && (
                <ExpenseForm
                    data={data.data}
                    onClose={sheet.close}
                />
            )}
            {data?.type === TransactionTypeEnum.INCOME && (
                <IncomeForm
                    data={data.data}
                    onClose={sheet.close}
                />
            )}
        </BottomSheetModal>
    );

}

const TransactionSheetHeader: FC<{ sheet: UseTransactionSheetReturn }> = ({ sheet }) => {
    const { data } = sheet;

    if (data?.data && data?.type) return <TextHeader type={data?.type} />

    return (
        <SegmentedControlHeader sheet={sheet} />
    )
}

const TextHeader = ({ type }: { type: TransactionTypeEnum }) => {
    const { theme } = useTheme();

    return (
        <ThemedText style={{ fontSize: 24, color: theme.text, marginBottom: 16, paddingHorizontal: 16 }}>
            {type === TransactionTypeEnum.EXPENSE ? 'Edit Expense' : 'Edit Income'}
        </ThemedText>
    )
}

const SegmentedControlHeader = ({ sheet }: { sheet: UseTransactionSheetReturn }) => {
    const { theme } = useTheme();
    const { data, setData } = sheet;

    const handleChangeTab = useCallback((index: number) => {
        if (index === 0) {
            setData({ type: TransactionTypeEnum.EXPENSE, data: null });
        } else {
            setData({ type: TransactionTypeEnum.INCOME, data: null });
        }
    }, [setData]);

    const selectedTabIndex = useMemo(() => {
        if (data?.type === TransactionTypeEnum.EXPENSE) {
            return 0;
        } else if (data?.type === TransactionTypeEnum.INCOME) {
            return 1;
        }

        return -1;
    }, [data]);

    return (
        <SegmentedControl
            style={{ marginBottom: 16 }}
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

const CustomBackdrop = ({ animatedIndex, style }: BottomSheetBackdropProps) => {
    const { theme } = useTheme()

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            animatedIndex.value,
            [-1, 0],
            [0, 0.5],
            Extrapolation.CLAMP
        ),
    }));

    // styles
    const containerStyle = useMemo(
        () => [
            style,
            {
                backgroundColor: theme.shadow,
            },
            containerAnimatedStyle,
        ],
        [style, containerAnimatedStyle]
    );

    return <Animated.View style={containerStyle} />;
};