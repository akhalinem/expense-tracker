import { FlatList, StyleSheet, Pressable, View } from "react-native";
import { CategoryWithTransactionCount } from "~/types";
import ThemedText from "~/components/themed/ThemedText";
import ThemedView from "~/components/themed/ThemedView";
import ThemedCard from "~/components/themed/ThemedCard";

type CategoryListProps = {
    categories: CategoryWithTransactionCount[];
    onCategoryPress: (category: CategoryWithTransactionCount) => void;
};

export default function CategoryList({ categories, onCategoryPress }: CategoryListProps) {
    return (
        <FlatList
            data={categories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <ThemedCard
                    as={Pressable}
                    style={styles.categoryItem}
                    onPress={() => onCategoryPress(item)}
                >
                    <View style={styles.categoryContent}>
                        <View style={styles.categoryHeader}>
                            <View style={styles.nameWithColor}>
                                <View style={styles.colorIndicatorContainer}>
                                    {item.transactionCount > 0 && (
                                        <View
                                            style={[
                                                styles.countBadge,
                                                { backgroundColor: item.color }
                                            ]}
                                        >
                                            <ThemedText
                                                style={[
                                                    styles.countText,
                                                    { color: getContrastTextColor(item.color) }
                                                ]}
                                            >
                                                {displayCount(item.transactionCount)}
                                            </ThemedText>
                                        </View>
                                    )}
                                </View>
                                <ThemedText style={styles.categoryName}>{item.name}</ThemedText>
                            </View>
                        </View>
                    </View>
                </ThemedCard>
            )}
            ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
            contentContainerStyle={styles.listContent}
        />
    );
}

// Helper function to determine text color based on background color brightness
const getContrastTextColor = (hexColor: string): string => {
    // Default to white if no color provided
    if (!hexColor) return '#FFFFFF';

    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Handle shorthand hex (e.g., #FFF)
    const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);

    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // Return black for light backgrounds, white for dark backgrounds
    return brightness > 125 ? '#000000' : '#FFFFFF';
};

const displayCount = (count: number) => {
    if (count > 100) {
        return '99+';
    }

    return count.toString();
}

const styles = StyleSheet.create({
    listContent: {
        padding: 16,
    },
    categoryItem: {
        marginVertical: 4,
        padding: 12,
        overflow: 'hidden',
    },
    categoryContent: {
        flexDirection: 'column',
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    countBadge: {
        borderRadius: 12,
        paddingVertical: 2,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countText: {
        fontSize: 12,
        fontWeight: '600',
    },
    separator: {
        height: 1,
        opacity: 0.2,
    },
    nameWithColor: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    colorIndicatorContainer: {
        position: 'relative',
        width: 40,
        marginRight: 10,
    },
});
