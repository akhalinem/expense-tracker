import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Path, Group, vec } from '@shopify/react-native-skia';
import ThemedText from '../themed/ThemedText';

export type TopCategoryChartItem = {
    category: string;
    amount: number;
    color: string;
}

export type TopCategoriesChartProps = {
    data: TopCategoryChartItem[];
    width: number;
    height: number;
}

export const TopCategoriesChart = ({ data, width, height }: TopCategoriesChartProps) => {
    const radius = Math.min(width, height) / 2 - 20;
    const center = vec(width / 2, height / 2);

    // Calculate total amount
    const total = useMemo(() => data.reduce((sum, item) => sum + item.amount, 0), [data]);

    // Calculate pie segments
    const paths = useMemo(() => {
        const segments: any[] = [];
        let startAngle = 0;

        data.forEach((item) => {
            const sweepAngle = (item.amount / total) * 2 * Math.PI;

            const x1 = center.x + radius * Math.cos(startAngle);
            const y1 = center.y + radius * Math.sin(startAngle);

            const x2 = center.x + radius * Math.cos(startAngle + sweepAngle);
            const y2 = center.y + radius * Math.sin(startAngle + sweepAngle);

            // Create the arc path
            const path = `
                M ${center.x} ${center.y}
                L ${x1} ${y1}
                A ${radius} ${radius} 0 ${sweepAngle > Math.PI ? 1 : 0} 1 ${x2} ${y2}
                Z
            `;

            segments.push({
                path,
                color: item.color,
                category: item.category,
                amount: item.amount,
                percentage: (item.amount / total) * 100
            });

            startAngle += sweepAngle;
        });

        return segments;
    }, [data, center, radius, total]);

    return (
        <View style={styles.container}>
            <Canvas style={{ width, height }}>
                <Group>
                    {paths.map((segment, index) => (
                        <Path
                            key={index}
                            path={segment.path}
                            color={segment.color}
                        />
                    ))}
                </Group>
            </Canvas>

            {/* Legend */}
            <View style={styles.legend}>
                {data
                    .map(item => ({
                        ...item,
                        percentage: Math.round((item.amount / total) * 100),
                    }))
                    .map((item, index) => (
                        <View key={index} style={styles.legendItem}>
                            <View style={[styles.colorBox, { backgroundColor: item.color }]} />
                            <ThemedText>{item.category}: {item.percentage}%</ThemedText>
                        </View>
                    ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    legend: {
        marginTop: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 8,
    },
    colorBox: {
        width: 12,
        height: 12,
        marginRight: 4,
    },
});