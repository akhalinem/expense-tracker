import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { BottomSheetModal, BottomSheetProps } from '@gorhom/bottom-sheet';
import { BottomSheetBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { useTheme } from '~/theme';

export const useTransactionBottomSheet = <TData,>() => {
    const { theme } = useTheme();
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const [data, setData] = useState<TData | null>(null);

    const open = useCallback((data: TData | null = null) => {
        setData(data);
        bottomSheetRef.current?.present();
    }, []);

    const close = useCallback(() => {
        bottomSheetRef.current?.dismiss();
    }, []);

    const sheetProps = useMemo((): BottomSheetProps & {
        ref?: React.ForwardedRef<BottomSheetModal<TData | null>>;
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