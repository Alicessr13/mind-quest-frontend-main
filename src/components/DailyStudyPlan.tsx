import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, AppState } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppStateStatus } from 'react-native';
import { AuthUtils } from "../utils/auth";
import { TimerManager, ActiveTimer } from "../utils/timerManager";
import { api } from "../api";

interface DailyPlan {
    study_plan_day_id: string;
    content: {
        subject: string;
    };
    allocated_minutes: number;
    studied_minutes: number;
    status: string;
}

interface Props {
    route: { params: { day: DailyPlan } };
    navigation: any;
}

export default function DailyStudyScreen({ route, navigation }: Props) {
    const { day } = route.params;
    const timerKey = `timer_${day.study_plan_day_id}`;
    
    const calculateRemainingSeconds = () => {
        const totalSeconds = day.allocated_minutes * 60;
        const completeMinutesStudied = Math.floor(day.studied_minutes);
        const studiedSeconds = completeMinutesStudied * 60;
        const remaining = Math.max(0, totalSeconds - studiedSeconds);
        
        console.log('Cálculo inicial:', {
            totalMinutes: day.allocated_minutes,
            studiedMinutesFromAPI: day.studied_minutes,
            completeMinutesStudied,
            totalSeconds,
            studiedSeconds,
            remainingSeconds: remaining,
            displayTime: Math.floor(remaining / 60) + ':' + String(remaining % 60).padStart(2, '0')
        });
        
        return remaining;
    };

    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [initialSeconds, setInitialSeconds] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        checkForConflictingTimer();
    }, []);

    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                console.log('App voltou ao foco');
                checkExistingTimer();
            }
            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, []);

    const checkForConflictingTimer = async () => {
        try {
            const { hasConflict, conflictingTimer } = await TimerManager.hasConflictingTimer(day.study_plan_day_id);
            
            if (hasConflict && conflictingTimer) {
                Alert.alert(
                    "Timer ativo em outro plano",
                    `Há um timer rodando para "${conflictingTimer.dayData.content.subject}". Você quer parar o timer anterior e iniciar um novo?`,
                    [
                        {
                            text: "Ir para o timer ativo",
                            onPress: () => {
                                navigation.replace("DailyStudyPlan", { day: conflictingTimer.dayData });
                            }
                        },
                        {
                            text: "Parar o anterior",
                            style: "destructive",
                            onPress: async () => {
                                await TimerManager.clearActiveTimer();
                                await checkExistingTimer();
                            }
                        },
                        {
                            text: "Cancelar",
                            style: "cancel",
                            onPress: () => navigation.goBack()
                        }
                    ]
                );
            } else {
                await checkExistingTimer();
            }
        } catch (error) {
            console.error("Erro ao verificar conflito:", error);
            await checkExistingTimer();
        }
    };

    const checkExistingTimer = async () => {
        try {
            const timerData = await AsyncStorage.getItem(timerKey);
            
            if (timerData) {
                const { startTime, initialSeconds: savedInitialSeconds, isActive } = JSON.parse(timerData);
                
                if (isActive) {
                    const currentTime = Date.now();
                    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
                    const newRemainingSeconds = Math.max(0, savedInitialSeconds - elapsedSeconds);
                    
                    console.log('Timer encontrado em background:', {
                        startTime: new Date(startTime).toLocaleTimeString(),
                        elapsedSeconds,
                        savedInitialSeconds,
                        newRemainingSeconds
                    });

                    setInitialSeconds(savedInitialSeconds);
                    setRemainingSeconds(newRemainingSeconds);
                    setIsRunning(true);
                    
                    if (newRemainingSeconds === 0) {
                        await handleTimerComplete(savedInitialSeconds);
                        return;
                    }
                    
                    startVisualTimer();
                } else {
                    const remaining = calculateRemainingSeconds();
                    setRemainingSeconds(remaining);
                    setInitialSeconds(remaining);
                }
            } else {
                const remaining = calculateRemainingSeconds();
                setRemainingSeconds(remaining);
                setInitialSeconds(remaining);
            }
        } catch (error) {
            console.error('Erro ao verificar timer:', error);
            const remaining = calculateRemainingSeconds();
            setRemainingSeconds(remaining);
            setInitialSeconds(remaining);
        }
    };

    const startVisualTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        
        timerRef.current = setInterval(() => {
            setRemainingSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    handleTimerComplete(initialSeconds);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const startTimer = async () => {
        if (isRunning) return;
        
        const { hasConflict, conflictingTimer } = await TimerManager.hasConflictingTimer(day.study_plan_day_id);
        
        if (hasConflict && conflictingTimer) {
            Alert.alert(
                "Conflito de Timer",
                `Há um timer ativo para "${conflictingTimer.dayData.content.subject}". Pare o outro timer primeiro.`,
                [
                    {
                        text: "Ir para o timer ativo",
                        onPress: () => {
                            navigation.replace("DailyStudyPlan", { day: conflictingTimer.dayData });
                        }
                    },
                    { text: "OK", style: "cancel" }
                ]
            );
            return;
        }
        
        try {
            const startTime = Date.now();
            const currentInitialSeconds = remainingSeconds;
            
            await AsyncStorage.setItem(timerKey, JSON.stringify({
                startTime,
                initialSeconds: currentInitialSeconds,
                isActive: true,
                dayId: day.study_plan_day_id
            }));

            const activeTimer: ActiveTimer = {
                startTime,
                initialSeconds: currentInitialSeconds,
                isActive: true,
                dayId: day.study_plan_day_id,
                timerKey,
                dayData: day
            };
            
            await TimerManager.setActiveTimer(activeTimer);
            
            setIsRunning(true);
            setInitialSeconds(currentInitialSeconds);
            startVisualTimer();
            
            console.log('Timer iniciado:', {
                startTime: new Date(startTime).toLocaleTimeString(),
                initialSeconds: currentInitialSeconds
            });
            
        } catch (error) {
            console.error('Erro ao iniciar timer:', error);
        }
    };

    const stopTimer = async () => {
        try {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsRunning(false);
            
            await AsyncStorage.setItem(timerKey, JSON.stringify({
                startTime: null,
                initialSeconds: 0,
                isActive: false,
                dayId: day.study_plan_day_id
            }));

            await TimerManager.clearActiveTimer();
            
            const secondsStudiedInThisSession = initialSeconds - remainingSeconds;
            const completeMinutesStudiedInThisSession = Math.floor(secondsStudiedInThisSession / 60);
            
            console.log('Parando timer:', {
                initialSeconds,
                remainingSeconds,
                secondsStudiedInThisSession,
                completeMinutesStudiedInThisSession
            });
            
            if (completeMinutesStudiedInThisSession > 0) {
                await finishStudy(completeMinutesStudiedInThisSession);
            } else {
                navigation.goBack();
            }
            
        } catch (error) {
            console.error('Erro ao parar timer:', error);
        }
    };

    const handleTimerComplete = async (totalInitialSeconds: number) => {
        try {
            await AsyncStorage.removeItem(timerKey);
            await TimerManager.clearActiveTimer();
            
            setIsRunning(false);
            
            const minutesStudiedInThisSession = Math.ceil(totalInitialSeconds / 60);
            await finishStudy(minutesStudiedInThisSession);
            
        } catch (error) {
            console.error('Erro ao completar timer:', error);
        }
    };

    const finishStudy = async (minutesStudiedInThisSession: number) => {
        try {
            const token = await AuthUtils.getToken();

            console.log('Enviando para API:', {
                minutesStudiedInThisSession,
                dayId: day.study_plan_day_id
            });

            await api.patch(
                `/study-plan-day/${day.study_plan_day_id}/progress`,
                { studied_minutes: minutesStudiedInThisSession },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            Alert.alert("Parabéns!", "Progresso do estudo atualizado com sucesso!");
            navigation.goBack();
        } catch (err) {
            console.error("Erro ao atualizar progresso:", err);
            Alert.alert("Erro", "Não foi possível atualizar o progresso.");
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
            .toString()
            .padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // Calcula a porcentagem de progresso
    const calculateProgress = () => {
        if (initialSeconds === 0) return 0;
        return ((initialSeconds - remainingSeconds) / initialSeconds) * 100;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>⚔️ QUEST ATIVA</Text>
            </View>

            {/* Subject Card */}
            <View style={styles.subjectCard}>
                <Text style={styles.subjectIcon}>📚</Text>
                <Text style={styles.subjectTitle}>{day.content.subject}</Text>
            </View>

            {/* Stats Panel */}
            <View style={styles.statsPanel}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>ALOCADO</Text>
                    <Text style={styles.statValue}>{day.allocated_minutes} MIN</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>ESTUDADO</Text>
                    <Text style={styles.statValue}>{Math.floor(day.studied_minutes)} MIN</Text>
                </View>
            </View>

            {/* Timer Display */}
            <View style={styles.timerContainer}>
                <View style={styles.timerBorder}>
                    <View style={styles.timerInner}>
                        <Text style={styles.timerLabel}>TEMPO RESTANTE</Text>
                        <Text style={styles.timerDisplay}>{formatTime(remainingSeconds)}</Text>
                        
                        {/* Progress Bar */}
                        <View style={styles.progressBarContainer}>
                            <View 
                                style={[
                                    styles.progressBar, 
                                    { width: `${calculateProgress()}%` }
                                ]} 
                            />
                        </View>
                        <Text style={styles.progressText}>
                            {Math.floor(calculateProgress())}% COMPLETO
                        </Text>
                    </View>
                </View>
            </View>

            {/* Status Indicator */}
            {isRunning && (
                <View style={styles.statusBanner}>
                    <Text style={styles.statusIcon}>⏰</Text>
                    <Text style={styles.statusText}>RODANDO EM BACKGROUND</Text>
                </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
                {!isRunning ? (
                    <TouchableOpacity style={styles.buttonStart} onPress={startTimer}>
                        <Text style={styles.buttonIcon}>▶</Text>
                        <Text style={styles.buttonText}>INICIAR</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.buttonStop} onPress={stopTimer}>
                        <Text style={styles.buttonIcon}>■</Text>
                        <Text style={styles.buttonText}>PARAR</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Back Button */}
            <TouchableOpacity
                style={styles.buttonBack}
                onPress={() => {
                    if (isRunning) {
                        Alert.alert(
                            "Timer ativo",
                            "Há um timer rodando. Se você sair, o timer continuará em background.",
                            [
                                { text: "Continuar", style: "cancel" },
                                { 
                                    text: "Sair mesmo assim", 
                                    onPress: () => navigation.goBack() 
                                }
                            ]
                        );
                    } else {
                        navigation.goBack();
                    }
                }}>
                <Text style={styles.buttonText}>← VOLTAR</Text>
            </TouchableOpacity>

            {/* Footer Decoration */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>━━━━━━━━━━━━━━━━</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1a1a2e",
        padding: 16,
        justifyContent: "center",
    },

    // Header
    header: {
        backgroundColor: "#0f3460",
        padding: 16,
        marginBottom: 24,
        borderWidth: 4,
        borderColor: "#16213e",
        alignItems: "center",
    },
    headerTitle: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 14,
        color: "#FFD700",
        textShadowColor: "#000",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 0,
    },

    // Subject Card
    subjectCard: {
        backgroundColor: "#16213e",
        borderWidth: 4,
        borderColor: "#3b82f6",
        padding: 20,
        marginBottom: 24,
        alignItems: "center",
    },
    subjectIcon: {
        fontSize: 32,
        marginBottom: 12,
    },
    subjectTitle: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 14,
        color: "#fff",
        textAlign: "center",
        lineHeight: 24,
    },

    // Stats Panel
    statsPanel: {
        backgroundColor: "#16213e",
        borderWidth: 4,
        borderColor: "#0f3460",
        padding: 16,
        marginBottom: 24,
        flexDirection: "row",
        alignItems: "center",
    },
    statBox: {
        flex: 1,
        alignItems: "center",
    },
    statDivider: {
        width: 4,
        height: 40,
        backgroundColor: "#0f3460",
    },
    statLabel: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#94a3b8",
        marginBottom: 8,
    },
    statValue: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 12,
        color: "#FFD700",
    },

    // Timer Display
    timerContainer: {
        marginBottom: 24,
    },
    timerBorder: {
        backgroundColor: "#FFD700",
        borderWidth: 4,
        borderColor: "#FFA500",
        padding: 4,
    },
    timerInner: {
        backgroundColor: "#0f3460",
        padding: 24,
        alignItems: "center",
    },
    timerLabel: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#94a3b8",
        marginBottom: 16,
    },
    timerDisplay: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 48,
        color: "#FFD700",
        marginBottom: 20,
        textShadowColor: "#000",
        textShadowOffset: { width: 3, height: 3 },
        textShadowRadius: 0,
    },

    // Progress Bar
    progressBarContainer: {
        width: "100%",
        height: 16,
        backgroundColor: "#16213e",
        borderWidth: 3,
        borderColor: "#1a1a2e",
        marginBottom: 12,
    },
    progressBar: {
        height: "100%",
        backgroundColor: "#10b981",
    },
    progressText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#10b981",
    },

    // Status Banner
    statusBanner: {
        backgroundColor: "#3b82f6",
        borderWidth: 4,
        borderColor: "#2563eb",
        padding: 12,
        marginBottom: 24,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    statusIcon: {
        fontSize: 20,
    },
    statusText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 10,
        color: "#fff",
    },

    // Buttons
    buttonContainer: {
        marginBottom: 16,
    },
    buttonStart: {
        backgroundColor: "#10b981",
        borderWidth: 4,
        borderColor: "#059669",
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    buttonStop: {
        backgroundColor: "#e94560",
        borderWidth: 4,
        borderColor: "#c23854",
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    buttonBack: {
        backgroundColor: "#64748b",
        borderWidth: 4,
        borderColor: "#475569",
        padding: 16,
        alignItems: "center",
    },
    buttonIcon: {
        fontSize: 20,
        color: "#fff",
    },
    buttonText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 12,
        color: "#fff",
    },

    // Footer
    footer: {
        marginTop: 24,
        alignItems: "center",
    },
    footerText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#0f3460",
    },
});