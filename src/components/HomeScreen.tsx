import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import axios from "axios";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../App"; // ajuste conforme seu projeto
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TimerManager } from "../utils/timerManager";
import { AuthUtils } from "../utils/auth";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

interface User {
    user_id: string;
    name: string;
    email: string;
}

interface StudyPlan {
    study_plan_id: string;
    subject: string;
    start_date: string;
    end_date: string;
    total_minutes: number;
}

interface DailyPlan {
    study_plan_day_id: string;
    date: string;
    status: string;
    allocated_minutes: number;
    studied_minutes: number;
    content: {
        subject: string;
    };
}

export default function HomeScreen() {
    const navigation = useNavigation<NavigationProp>();
    const [user, setUser] = useState<User | null>(null);
    const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
    const [overduePlans, setOverduePlans] = useState<DailyPlan[]>([]);
    const [todayPlans, setTodayPlans] = useState<DailyPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [inProgress, setInProgress] = useState<DailyPlan[]>([]);
    const [activeTimerInfo, setActiveTimerInfo] = useState<{
        subject: string;
        remainingTime: string;
    } | null>(null);

    // Função para verificar se há timer ativo
    const checkActiveTimer = useCallback(async () => {
        try {
            const { hasActiveTimer, timerData } = await TimerManager.checkForActiveTimer();
            
            if (hasActiveTimer && timerData) {
                // Calcula o tempo restante para exibir na interface
                const currentTime = Date.now();
                const elapsedSeconds = Math.floor((currentTime - timerData.startTime) / 1000);
                const remainingSeconds = Math.max(0, timerData.initialSeconds - elapsedSeconds);
                
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                setActiveTimerInfo({
                    subject: timerData.dayData.content.subject,
                    remainingTime: timeString
                });
                
                console.log('Timer ativo encontrado:', {
                    subject: timerData.dayData.content.subject,
                    remainingTime: timeString
                });
            } else {
                setActiveTimerInfo(null);
            }
        } catch (error) {
            console.error("Erro ao verificar timer ativo:", error);
            setActiveTimerInfo(null);
        }
    }, []);

    // Função para navegar para o timer ativo
    const goToActiveTimer = async () => {
        try {
            const { hasActiveTimer, timerData } = await TimerManager.checkForActiveTimer();
            
            if (hasActiveTimer && timerData) {
                navigation.navigate("DailyStudyPlan", { day: timerData.dayData });
            } else {
                Alert.alert("Aviso", "Timer não encontrado ou já finalizado.");
                setActiveTimerInfo(null);
            }
        } catch (error) {
            console.error("Erro ao navegar para timer ativo:", error);
            Alert.alert("Erro", "Não foi possível acessar o timer ativo.");
        }
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const token = await AuthUtils.getToken();

            const [userRes, plansRes, dailyRes] = await Promise.all([
                axios.get("http://192.168.0.17:3333/user", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get("http://192.168.0.17:3333/study-plan", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get("http://192.168.0.17:3333/study-plan/daily", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            setUser(userRes.data);
            setStudyPlans(plansRes.data);
            setOverduePlans(dailyRes.data.overdue);
            setTodayPlans(dailyRes.data.today);
            setInProgress(dailyRes.data.inProgress);
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Este hook executa toda vez que a tela ganha foco
    useFocusEffect(
        useCallback(() => {
            fetchData();
            checkActiveTimer();
        }, [fetchData, checkActiveTimer])
    );

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        
        if (activeTimerInfo) {
            interval = setInterval(() => {
                checkActiveTimer();
            }, 1000);
        }
        
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [activeTimerInfo, checkActiveTimer]);

    const handleLogout = () => {
        Alert.alert(
            "Confirmar saída",
            "Tem certeza que deseja sair?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Sair",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Remove o token do AsyncStorage
                            await AsyncStorage.removeItem("token");

                            // Se você estiver usando SecureStore também, remova de lá
                            // await SecureStore.deleteItemAsync("token");

                            // Navega para a tela de login (ou a tela inicial)
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }], // Ajuste o nome da sua tela de login
                            });
                        } catch (error) {
                            console.error("Erro ao fazer logout:", error);
                            Alert.alert("Erro", "Não foi possível fazer logout. Tente novamente.");
                        }
                    }
                }
            ]
        );
    };

    const renderDailyCard = (item: DailyPlan, overdue = false) => (
        <TouchableOpacity
            style={[styles.card, overdue && styles.overdueCard]}
            onPress={() => navigation.navigate("DailyStudyPlan", { day: item })}
        >
            <Text style={styles.cardTitle}>{item.content.subject}</Text>
            <Text>Status: {item.status}</Text>
            <Text>
                {item.studied_minutes}/{item.allocated_minutes} min
            </Text>
            {overdue && <Text style={styles.overdueText}>Atrasado</Text>}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header com botão de logout */}
            {user && (
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <Text style={styles.title}>Bem-vindo, {user.name} 👋</Text>
                        <Text style={styles.subtitle}>{user.email}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Text style={styles.logoutButtonText}>Sair</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Banner de timer ativo */}
            {activeTimerInfo && (
                <TouchableOpacity
                    style={styles.activeTimerBanner}
                    onPress={goToActiveTimer}
                >
                    <View style={styles.timerIconContainer}>
                        <Text style={styles.timerIcon}>⏰</Text>
                    </View>
                    <View style={styles.timerTextContainer}>
                        <Text style={styles.timerActiveText}>Timer ativo</Text>
                        <Text style={styles.timerSubject}>{activeTimerInfo.subject}</Text>
                        <Text style={styles.timerTime}>{activeTimerInfo.remainingTime}</Text>
                    </View>
                    <Text style={styles.timerArrow}>→</Text>
                </TouchableOpacity>
            )}

            {/* Atrasados */}
            {overduePlans.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>Planos atrasados</Text>
                    <FlatList
                        data={overduePlans}
                        keyExtractor={(item) => item.study_plan_day_id}
                        renderItem={({ item }) => renderDailyCard(item, true)}
                    />
                </>
            )}

            <Text style={styles.sectionTitle}>Em andamento</Text>
            {inProgress.length > 0 ? (
                <FlatList
                    data={inProgress}
                    keyExtractor={(item) => item.study_plan_day_id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => navigation.navigate("DailyStudyPlan", { day: item })}
                        >
                            <Text style={styles.cardTitle}>{item.content.subject}</Text>
                            <Text>Status: {item.status}</Text>
                            <Text>
                                {item.studied_minutes}/{item.allocated_minutes} min
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            ) : (
                <Text style={styles.empty}>Nenhum plano em andamento</Text>
            )}


            {/* Hoje */}
            <Text style={styles.sectionTitle}>Plano de hoje</Text>
            {todayPlans.length > 0 ? (
                <FlatList
                    data={todayPlans}
                    keyExtractor={(item) => item.study_plan_day_id}
                    renderItem={({ item }) => renderDailyCard(item)}
                />
            ) : (
                <Text style={styles.empty}>Nenhum estudo planejado para hoje</Text>
            )}

            {/* Lista de planos gerais */}
            <Text style={styles.sectionTitle}>Seus planos de estudo</Text>
            <FlatList
                data={studyPlans}
                keyExtractor={(item) => item.study_plan_id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate("StudyPlanDetails", { id: item.study_plan_id })}
                    >
                        <Text style={styles.cardTitle}>{item.subject}</Text>
                        <Text>
                            {new Date(item.start_date).toLocaleDateString()} →{" "}
                            {new Date(item.end_date).toLocaleDateString()}
                        </Text>
                        <Text>Total: {item.total_minutes} min</Text>
                    </TouchableOpacity>
                )}
            />

            {/* Criar plano */}
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate("CreateStudyPlan")}
            >
                <Text style={styles.buttonText}>+ Criar plano de estudo</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: {
        marginBottom: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start"
    },
    userInfo: {
        flex: 1
    },
    title: { fontSize: 22, fontWeight: "bold" },
    subtitle: { fontSize: 16, color: "gray" },
    logoutButton: {
        backgroundColor: "#ef4444",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 10
    },
    logoutButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600"
    },
    sectionTitle: { fontSize: 18, fontWeight: "600", marginVertical: 10 },
    card: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        elevation: 2,
    },
    overdueCard: { backgroundColor: "#fde2e2" },
    overdueText: { color: "#d32f2f", fontWeight: "bold" },
    cardTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
    button: {
        backgroundColor: "#3b82f6",
        padding: 15,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 20,
    },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    empty: { color: "gray", fontStyle: "italic" },
    activeTimerBanner: {
        backgroundColor: "#3b82f6",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        flexDirection: "row",
        alignItems: "center",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    timerIconContainer: {
        marginRight: 12,
    },
    timerIcon: {
        fontSize: 24,
    },
    timerTextContainer: {
        flex: 1,
    },
    timerActiveText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
        opacity: 0.9,
        marginBottom: 2,
    },
    timerSubject: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 2,
    },
    timerTime: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        fontFamily: "monospace", // Para uma fonte monoespaçada como o tempo
    },
    timerArrow: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
        opacity: 0.7,
    },
});