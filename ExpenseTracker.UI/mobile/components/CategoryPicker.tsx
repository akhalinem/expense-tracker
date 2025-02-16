import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/services/api';
import ThemedText from '~/components/themed/ThemedText';
import ThemedCard from '~/components/themed/ThemedCard';
import { ICategory } from '~/types';

interface CategoryPickerProps {
    selectedCategory: string | null;
    categories: ICategory[];
    onSelectCategory: (categoryId: string) => void;
}

export default function CategoryPicker({ categories, selectedCategory, onSelectCategory }: CategoryPickerProps) {
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.container}>
                {categories.map((category) => (
                    <Pressable
                        key={category.id}
                        onPress={() => onSelectCategory(category.id)}
                    >
                        <ThemedCard style={[
                            styles.category,
                            selectedCategory && selectedCategory === category.id ? styles.selectedCategory : undefined,
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
