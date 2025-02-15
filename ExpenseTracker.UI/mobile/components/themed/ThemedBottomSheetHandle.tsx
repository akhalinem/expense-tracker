import { View, StyleSheet } from 'react-native';
import { useTheme } from '~/theme';

export default function ThemedBottomSheetHandle() {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
});
