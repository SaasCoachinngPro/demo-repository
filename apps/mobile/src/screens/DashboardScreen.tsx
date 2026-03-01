import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { LogOut, BookOpen, Clock, TrendingUp } from 'lucide-react-native';

export default function DashboardScreen() {
    const { user, logout } = useAuthStore();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello,</Text>
                    <Text style={styles.name}>{user?.name || 'Student'}</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <LogOut size={20} color="#ef4444" />
                </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <BookOpen size={24} color="#3b82f6" />
                    <Text style={styles.statNum}>12</Text>
                    <Text style={styles.statLabel}>Tests Completed</Text>
                </View>
                <View style={styles.statCard}>
                    <Clock size={24} color="#eab308" />
                    <Text style={styles.statNum}>2</Text>
                    <Text style={styles.statLabel}>Pending Assignments</Text>
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Tests</Text>
                <TouchableOpacity>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.testCard}>
                <View style={styles.testInfo}>
                    <Text style={styles.testTitle}>Chapter 4 Physics Mock</Text>
                    <Text style={styles.testMeta}>60 Minutes • 100 Marks</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>MOCK EXAM</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.startBtn}>
                    <Text style={styles.startBtnText}>Start Test</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Performance Analytics</Text>
            </View>

            <View style={[styles.testCard, styles.analyticsCard]}>
                <View style={styles.analyticsHeader}>
                    <TrendingUp size={24} color="#10b981" />
                    <Text style={styles.analyticsTitle}>Top 10% in Batch</Text>
                </View>
                <Text style={styles.analyticsText}>
                    Your performance has improved by 14% since the last test. Keep up the good work on your Physics weak areas!
                </Text>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    content: {
        padding: 20,
        paddingTop: 60, // Safe area space
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 30,
    },
    greeting: {
        fontSize: 16,
        color: '#64748b',
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    logoutBtn: {
        padding: 8,
        backgroundColor: '#fee2e2',
        borderRadius: 8,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    statNum: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        marginTop: 12,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0f172a',
    },
    seeAll: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '500',
    },
    testCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        marginBottom: 16,
    },
    testInfo: {
        marginBottom: 16,
    },
    testTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 4,
    },
    testMeta: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 8,
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        color: '#4338ca',
        fontWeight: 'bold',
    },
    startBtn: {
        backgroundColor: '#3b82f6',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    startBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    analyticsCard: {
        backgroundColor: '#ecfdf5', // green-50
        borderColor: '#a7f3d0', // green-200
        borderWidth: 1,
    },
    analyticsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    analyticsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#065f46', // green-800
        marginLeft: 8,
    },
    analyticsText: {
        fontSize: 14,
        color: '#065f46',
        lineHeight: 20,
    }
});
