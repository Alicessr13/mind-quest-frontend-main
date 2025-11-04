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
    
    // Calcula os segundos restantes baseado no progresso já feito
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

    // Inicialização do timer
    useEffect(() => {
        checkForConflictingTimer();
    }, []);

    // Monitor do AppState para detectar quando o app volta ao foco
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

    // Verifica se há conflito com outro timer antes de inicializar
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

    // Verifica se existe um timer rodando em background
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
                    
                    // Se o tempo acabou enquanto estava em background
                    if (newRemainingSeconds === 0) {
                        await handleTimerComplete(savedInitialSeconds);
                        return;
                    }
                    
                    // Continua o timer visual
                    startVisualTimer();
                } else {
                    // Timer parado, apenas restaura o estado
                    const remaining = calculateRemainingSeconds();
                    setRemainingSeconds(remaining);
                    setInitialSeconds(remaining);
                }
            } else {
                // Primeira vez ou sem timer salvo
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

    // Inicia apenas o timer visual (a contagem real fica no AsyncStorage)
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
        
        // Verifica novamente se há conflito antes de iniciar
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
            
            // Salva o estado do timer no AsyncStorage local
            await AsyncStorage.setItem(timerKey, JSON.stringify({
                startTime,
                initialSeconds: currentInitialSeconds,
                isActive: true,
                dayId: day.study_plan_day_id
            }));

            // Salva no TimerManager global
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
            
            // Para o timer no AsyncStorage local
            await AsyncStorage.setItem(timerKey, JSON.stringify({
                startTime: null,
                initialSeconds: 0,
                isActive: false,
                dayId: day.study_plan_day_id
            }));

            // Remove do TimerManager global
            await TimerManager.clearActiveTimer();
            
            // Calcula quanto foi estudado
            const secondsStudiedInThisSession = initialSeconds - remainingSeconds;
            const completeMinutesStudiedInThisSession = Math.floor(secondsStudiedInThisSession / 60);
            
            console.log('Parando timer:', {
                initialSeconds,
                remainingSeconds,
                secondsStudiedInThisSession,
                completeMinutesStudiedInThisSession
            });
            
            // Só salva se estudou pelo menos 1 minuto completo
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
            // Remove o timer do AsyncStorage local
            await AsyncStorage.removeItem(timerKey);
            
            // Remove do TimerManager global
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

    // Cleanup quando sair da tela
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{day.content.subject}</Text>
            <Text style={styles.info}>Alocado: {day.allocated_minutes} min</Text>
            <Text style={styles.info}>Estudado: {Math.floor(day.studied_minutes)} min</Text>
            <Text style={styles.timer}>{formatTime(remainingSeconds)}</Text>
            
            {isRunning && (
                <Text style={styles.status}>⏰ Timer rodando em background</Text>
            )}

            <View style={styles.buttons}>
                {!isRunning ? (
                    <TouchableOpacity style={styles.buttonStart} onPress={startTimer}>
                        <Text style={styles.buttonText}>Iniciar</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.buttonStop} onPress={stopTimer}>
                        <Text style={styles.buttonText}>Parar</Text>
                    </TouchableOpacity>
                )}
            </View>
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
                <Text style={styles.buttonText}>Voltar</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
    info: { fontSize: 16, marginBottom: 10 },
    timer: { fontSize: 48, fontWeight: "bold", marginBottom: 20 },
    status: { fontSize: 14, color: "#666", marginBottom: 20, fontStyle: "italic" },
    buttons: { flexDirection: "row", marginBottom: 20 },
    buttonStart: { backgroundColor: "#3b82f6", padding: 15, borderRadius: 12, marginHorizontal: 10 },
    buttonStop: { backgroundColor: "#ef4444", padding: 15, borderRadius: 12, marginHorizontal: 10 },
    buttonBack: { backgroundColor: "#6b7280", padding: 15, borderRadius: 12, marginHorizontal: 10 },
    buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});