import { FC, useCallback, useMemo, useRef, useState } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { BottomSheetModal, BottomSheetProps } from '@gorhom/bottom-sheet';
import { BottomSheetBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { useTheme } from '~/theme';
import { Expense, Income, TransactionTypeEnum } from '~/types';
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

    return { bottomSheetRef, sheetProps, data, open, close };
}

export const TransactionSheet: FC<{ sheet: UseTransactionSheetReturn }> = ({ sheet }) => {
    const { bottomSheetRef, sheetProps, data } = sheet;

    return (
        <BottomSheetModal {...sheetProps}>
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