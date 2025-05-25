import { useState } from 'react';
import { StyleSheet, Modal, TouchableOpacity, KeyboardAvoidingView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/theme';
import { UserCategoriesToggleReturn } from '~/hooks/useCategoriesToggle';
import ThemedText from '~/components/themed/ThemedText';
import ThemedView from '~/components/themed/ThemedView';

type CategoryPickerModalProps = {
    categoriesToggle: UserCategoriesToggleReturn;
}

export default function CategoryPickerModal({ categoriesToggle }: CategoryPickerModalProps) {
    const { categories: allCategories, selected, toggle } = categoriesToggle;
    const { theme } = useTheme();
    const categories = allCategories

    const [visible, setVisible] = useState(false);

    // Selected category names to display in the selector
    const selectedCategoryNames = categories
        .filter(cat => selected.has(cat.id))
        .map(cat => cat.name)
        .join(', ');

    const displayText = selectedCategoryNames || 'Select categories';

    return (
        <>
            <TouchableOpacity
                activeOpacity={0.7}
                style={[
                    styles.selector,
                    {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        borderWidth: 1
                    }
                ]}
                onPress={() => setVisible(true)}
            >
                <ThemedText
                    numberOfLines={1}
                    style={[
                        styles.selectorText,
                        !selectedCategoryNames && { color: theme.textSecondary },
                    ]}
                >
                    {displayText}
                </ThemedText>
                <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
            </TouchableOpacity>

            <Modal
                transparent
                visible={visible}
                onRequestClose={() => setVisible(false)}
            >
                <ThemedView as={KeyboardAvoidingView} style={styles.modalContainer} behavior='padding'>
                    <ThemedView style={styles.modalContent}>
                        <ThemedView style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <ThemedText style={styles.modalTitle}>Select Categories</ThemedText>
                            <TouchableOpacity onPress={() => setVisible(false)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                                <Ionicons name="close" size={24} color="#777" />
                            </TouchableOpacity>
                        </ThemedView>

                        <FlatList
                            data={categories}
                            style={styles.categoryList}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    style={[
                                        styles.categoryItem,
                                        { borderBottomColor: theme.border },
                                        selected.has(item.id) && styles.selectedItem
                                    ]}
                                    onPress={() => toggle(item.id)}
                                >
                                    <ThemedText style={styles.categoryName} numberOfLines={1}>{item.name}</ThemedText>
                                    {selected.has(item.id) && (
                                        <Ionicons name="checkmark" size={20} color={theme.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <ThemedView style={styles.emptyContainer}>
                                    <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                                        No categories found
                                    </ThemedText>
                                </ThemedView>
                            }
                        />
                    </ThemedView>
                </ThemedView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginHorizontal: 16,
    },
    selectorText: {
        flex: 1,
        fontSize: 16,
    },
    placeholderText: {
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: 34, // Account for bottom safe area
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    categoryList: {
        maxHeight: 350,
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        height: 50,
    },
    selectedItem: {
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
    },
    categoryName: {
        fontSize: 16,
    },
    doneButton: {
        margin: 16,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
    }
});