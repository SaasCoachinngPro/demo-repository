import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TrendingUp, Award, Target, BookOpen } from 'lucide-react-native';

export default function AnalyticsScreen({ navigation }: any) {
    // Mock performance data
    const subjectScores = [
        { subject: 'Physics', score: 85, color: '#3b82f6' },
        { subject: 'Chemistry', score: 72, color: '#8b5cf6' },
        { subject: 'Mathematics', score: 91, color: '#10b981' },
        { subject: 'Biology', score: 64, color: '#f59e0b' },
    ];

    const recentTests = [
        { name: 'Physics Chapter 4 Mock', score: '88/100', rank: '12th', date: 'Oct 12' },
        { name: 'Weekly Math Challenge', score: '45/50', rank: '5th', date: 'Oct 05' },
        { name: 'Chem Basics Review', score: '35/50', rank: '28th', date: 'Sep 29' },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>Your Performance</Text>
                <Text style={styles.subtitle}>Detailed insights and progress analysis</Text>
            </View>

            <View style={styles.summaryContainer}>
                <View style={styles.summaryBox}>
                    <TrendingUp size={24} color="#3b82f6" />
                    <Text style={styles.summaryValue}>82%</Text>
                    <Text style={styles.summaryLabel}>Average Score</Text>
                </View>
                <View style={styles.summaryBox}>
                    <Target size={24} color="#10b981" />
                    <Text style={styles.summaryValue}>94%</Text>
                    <Text style={styles.summaryLabel}>Accuracy</Text>
                </View>
                <View style={styles.summaryBox}>
                    <Award size={24} color="#f59e0b" />
                    <Text style={styles.summaryValue}>Top 15%</Text>
                    <Text style={styles.summaryLabel}>Batch Rank</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Subject Wise Mastery</Text>
            <View style={styles.chartContainer}>
                {subjectScores.map((item, idx) => (
                    <View key={idx} style={styles.barRow}>
                        <View style={styles.barLabelContainer}>
                            <BookOpen size={16} color={item.color} style={{ marginRight: 6 }} />
                            <Text style={styles.barLabel}>{item.subject}</Text>
                        </View>
                        <View style={styles.barTrack}>
                            <View style={[styles.barFill, { width: `${item.score}%`, backgroundColor: item.color }]} />
                        </View>
                        <Text style={styles.barScore}>{item.score}%</Text>
                    </View>
                ))}
            </View>

            <View style={styles.insightsCard}>
                <Text style={styles.insightsTitle}>AI Insights</Text>
                <Text style={styles.insightsText}>
                    You are very strong in <Text style={{ fontWeight: 'bold' }}>Mathematics</Text> but need more practice in <Text style={{ fontWeight: 'bold' }}>Biology</Text>.
                    Specifically, your accuracy in Genetics questions is below average. We recommend taking the generated practice session for Genetics.
                </Text>
                <TouchableOpacity style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>Start Biology Practice</Text>
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <Text style={styles.sectionTitle}>Recent Test History</Text>
            </View>

            {recentTests.map((test, idx) => (
                <View key={idx} style={styles.historyCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.historyTitle}>{test.name}</Text>
                        <Text style={styles.historyDate}>{test.date}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.historyScore}>{test.score}</Text>
                        <Text style={styles.historyRank}>Rank: {test.rank}</Text>
                    </View>
                </View>
            ))}

            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Dashboard')}>
                <Text style={styles.backBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        padding: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        marginTop: 4,
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    summaryBox: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
        marginTop: 8,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 16,
        marginTop: 8,
    },
    chartContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    barLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 100,
    },
    barLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#334155',
    },
    barTrack: {
        flex: 1,
        height: 8,
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
        marginHorizontal: 10,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 4,
    },
    barScore: {
        width: 35,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0f172a',
        textAlign: 'right',
    },
    insightsCard: {
        backgroundColor: '#eff6ff', // blue-50
        borderWidth: 1,
        borderColor: '#bfdbfe', // blue-200
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    insightsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 8,
    },
    insightsText: {
        fontSize: 14,
        color: '#1e3a8a',
        lineHeight: 22,
        marginBottom: 16,
    },
    actionBtn: {
        backgroundColor: '#3b82f6',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    historyCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        alignItems: 'center',
    },
    historyTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 4,
    },
    historyDate: {
        fontSize: 12,
        color: '#64748b',
    },
    historyScore: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3b82f6',
        marginBottom: 2,
    },
    historyRank: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    backBtn: {
        marginTop: 20,
        padding: 16,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#e2e8f0',
    },
    backBtnText: {
        fontWeight: '600',
        color: '#475569',
        fontSize: 16,
    }
});
