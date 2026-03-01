import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState, AppStateStatus, Alert, ScrollView } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../api';
import { AlertTriangle, Clock as ClockIcon, CheckCircle2 } from 'lucide-react-native';

export default function TestTakingScreen({ route, navigation }: any) {
    const { testId = 'preview' } = route.params || {};
    const { user } = useAuthStore();

    const appState = useRef(AppState.currentState);
    const [timeLeft, setTimeLeft] = useState(3600); // 60 mins default
    const [warnings, setWarnings] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});

    // Mock questions for preview
    const questions = [
        { id: 1, text: "A boy goes completely around a circle of radius 7m in 10 minutes. What is his displacement?", type: "MCQ", options: ["14m", "44m", "0m", "7m"] },
        { id: 2, text: "What is the unit of angular velocity?", type: "MCQ", options: ["rad/s", "m/s", "rad/s²", "m/s²"] },
        { id: 3, text: "Convert 90 km/hr into m/s.", type: "NUMERICAL", options: [] }
    ];

    useEffect(() => {
        // 1. Timer Logic
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    autoSubmit('Time is up!');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // 2. Anti-Cheat / App Blur Logic
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                // App has come to the foreground
                handleCheatWarning();
            }
            appState.current = nextAppState;
        });

        return () => {
            clearInterval(timer);
            subscription.remove();
        };
    }, [warnings]);

    const handleCheatWarning = () => {
        setWarnings(prev => {
            const newWarnings = prev + 1;
            if (newWarnings >= 3) {
                autoSubmit('Maximum cheating warnings exceeded. Test auto-submitted.');
            } else {
                Alert.alert(
                    'Warning',
                    `You left the test window. This is warning ${newWarnings} of 3. Your test will be auto-submitted if you leave again.`
                );
            }
            return newWarnings;
        });
    };

    const autoSubmit = (reason: string) => {
        Alert.alert('Test Submitted', reason, [
            { text: 'OK', onPress: () => navigation.navigate('Dashboard') }
        ]);
    };

    const submitTest = async () => {
        // In real app, make API call here: await api.post(`/tests/${testId}/submit`, { answers })
        Alert.alert('Success', 'Test submitted successfully!', [
            { text: 'View Dashboard', onPress: () => navigation.navigate('Dashboard') }
        ]);
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const q = questions[currentQuestion];

    return (
        <View style={styles.container}>
            {/* Header Info */}
            <View style={styles.header}>
                <View style={styles.timerBadge}>
                    <ClockIcon size={16} color="#fff" />
                    <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                </View>

                {warnings > 0 && (
                    <View style={styles.warningBadge}>
                        <AlertTriangle size={16} color="#b91c1c" />
                        <Text style={styles.warningText}>{warnings}/3 Warnings</Text>
                    </View>
                )}
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                {questions.map((_, idx) => (
                    <TouchableOpacity
                        key={idx}
                        onPress={() => setCurrentQuestion(idx)}
                        style={[
                            styles.progressDot,
                            answers[idx] !== undefined ? styles.progressDotAnswered : null,
                            currentQuestion === idx ? styles.progressDotActive : null
                        ]}
                    />
                ))}
            </View>

            {/* Question Area */}
            <ScrollView style={styles.questionArea} contentContainerStyle={{ paddingBottom: 40 }}>
                <Text style={styles.questionNumber}>Question {currentQuestion + 1} of {questions.length}</Text>
                <Text style={styles.questionText}>{q.text}</Text>

                <View style={styles.optionsContainer}>
                    {q.type === 'MCQ' ? (
                        q.options.map((opt, idx) => {
                            const letter = String.fromCharCode(65 + idx);
                            const isSelected = answers[currentQuestion] === letter;
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
                                    onPress={() => setAnswers(prev => ({ ...prev, [currentQuestion]: letter }))}
                                >
                                    <View style={[styles.optionCircle, isSelected && styles.optionCircleSelected]}>
                                        <Text style={[styles.optionLetter, isSelected && styles.optionLetterSelected]}>{letter}</Text>
                                    </View>
                                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{opt}</Text>
                                </TouchableOpacity>
                            )
                        })
                    ) : (
                        <Text style={{ color: '#64748b', fontStyle: 'italic', marginTop: 10 }}>Numerical questions require keyboard input (simulated for UI).</Text>
                    )}
                </View>
            </ScrollView>

            {/* Footer Navigation */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.navBtn, currentQuestion === 0 && styles.navBtnDisabled]}
                    onPress={() => setCurrentQuestion(p => Math.max(0, p - 1))}
                    disabled={currentQuestion === 0}
                >
                    <Text style={styles.navBtnText}>Previous</Text>
                </TouchableOpacity>

                {currentQuestion < questions.length - 1 ? (
                    <TouchableOpacity
                        style={[styles.navBtn, styles.navBtnPrimary]}
                        onPress={() => setCurrentQuestion(p => Math.min(questions.length - 1, p + 1))}
                    >
                        <Text style={[styles.navBtnText, { color: '#fff' }]}>Next</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.submitBtn} onPress={submitTest}>
                        <CheckCircle2 size={18} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={[styles.navBtnText, { color: '#fff' }]}>Submit Test</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        paddingTop: 50, // Safe area
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    timerText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 6,
        fontSize: 16,
    },
    warningBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        borderColor: '#fca5a5',
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    warningText: {
        color: '#b91c1c',
        fontWeight: 'bold',
        marginLeft: 6,
        fontSize: 12,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 8,
    },
    progressDot: {
        width: 30,
        height: 8,
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
    },
    progressDotAnswered: {
        backgroundColor: '#93c5fd',
    },
    progressDotActive: {
        backgroundColor: '#3b82f6',
        height: 10,
    },
    questionArea: {
        flex: 1,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    questionNumber: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    questionText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        lineHeight: 28,
        marginBottom: 24,
    },
    optionsContainer: {
        gap: 12,
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#fff',
    },
    optionBtnSelected: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    optionCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionCircleSelected: {
        backgroundColor: '#3b82f6',
    },
    optionLetter: {
        color: '#64748b',
        fontWeight: 'bold',
    },
    optionLetterSelected: {
        color: '#fff',
    },
    optionText: {
        fontSize: 16,
        color: '#334155',
        flex: 1,
    },
    optionTextSelected: {
        color: '#1e3a8a',
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        justifyContent: 'space-between',
    },
    navBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginHorizontal: 5,
    },
    navBtnPrimary: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    navBtnDisabled: {
        opacity: 0.5,
    },
    navBtnText: {
        fontWeight: '600',
        color: '#475569',
        fontSize: 16,
    },
    submitBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#10b981',
        marginHorizontal: 5,
        flexDirection: 'row',
        justifyContent: 'center',
    }
});
