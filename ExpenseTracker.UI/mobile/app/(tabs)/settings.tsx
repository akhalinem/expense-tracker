import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ThemedView from '~/components/themed/ThemedView';
import Settings, { SettingsSection } from '~/components/Settings';

export default function SettingsScreen() {
  const router = useRouter();

  const handlePress = (section: SettingsSection) => {
    if (section === 'categories') {
      router.push('/categories');
    }
  };

  return (
    <ThemedView as={SafeAreaView} style={{ flex: 1 }}>
      <Settings onPress={handlePress} />
    </ThemedView>
  );
}
