import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { UserCategoriesToggleReturn } from '~/hooks/useCategoriesToggle';
import ThemedText from '~/components/themed/ThemedText';
import ThemedCard from '~/components/themed/ThemedCard';

type CategoryPickerProps = {
    categoriesToggle: UserCategoriesToggleReturn;
}

export default function CategoryPicker({ categoriesToggle }: CategoryPickerProps) {
    const { categories, toggle, selected } = categoriesToggle

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.container}>
                {categories.map((category) => (
                    <Pressable
                        key={category.id}
                        onPress={() => toggle(category.id)}
                    >
                        <ThemedCard style={[
                            styles.category,
                            selected.has(category.id) && styles.selectedCategory,
                        ]}>
                            <ThemedText>{category.name}</ThemedText>
                        </ThemedCard>
                    </Pressable>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 16
    },
    category: {
        padding: 12,
        borderWidth: 2,
        borderRadius: 8,
        borderColor: 'transparent',
    },
    selectedCategory: {
        borderColor: '#007AFF',
    },
});
