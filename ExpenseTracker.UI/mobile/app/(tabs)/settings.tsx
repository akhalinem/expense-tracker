import ThemedView from "~/components/themed/ThemedView";
import Settings from "~/components/Settings";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
    return (
        <ThemedView as={SafeAreaView} style={{ flex: 1 }}>
            <Settings />
        </ThemedView>
    );
}