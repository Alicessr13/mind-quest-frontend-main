import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from "react-native";
import axios from "axios";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TimerManager } from "../utils/timerManager";
import { AuthUtils } from "../utils/auth";
import { api } from "../api";
import { SafeAreaView } from "react-native-safe-area-context";

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
    const [expandedSections, setExpandedSections] = useState({
        overdue: false,
        inProgress: false,
        today: false,
        plans: true,
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const checkActiveTimer = useCallback(async () => {
        try {
            const { hasActiveTimer, timerData } = await TimerManager.checkForActiveTimer();
            
            if (hasActiveTimer && timerData) {
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
            } else {
                setActiveTimerInfo(null);
            }
        } catch (error) {
            console.error("Erro ao verificar timer ativo:", error);
            setActiveTimerInfo(null);
        }
    }, []);

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
                api.get("/user", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                api.get("/study-plan", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                api.get("/study-plan/daily", {
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
                            await AsyncStorage.removeItem("token");
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
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
            <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{overdue ? "⚠️" : "📚"}</Text>
                <Text style={styles.cardTitle}>{item.content.subject}</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.cardStats}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>STATUS:</Text>
                    <Text style={styles.statValue}>{item.status}</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>TEMPO:</Text>
                    <Text style={styles.statValue}>
                        {item.studied_minutes}/{item.allocated_minutes} MIN
                    </Text>
                </View>
            </View>
            {overdue && (
                <View style={styles.overdueTag}>
                    <Text style={styles.overdueTagText}>! ATRASADO !</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <View style={styles.loadingBox}>
                    <Text style={styles.loadingText}>CARREGANDO...</Text>
                    <ActivityIndicator size="large" color="#FFD700" />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header Pixel Art */}
            {user && (
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <Text style={styles.headerTitle}>🎮 STUDY QUEST</Text>
                    </View>
                    <View style={styles.headerMiddle}>
                        <View style={styles.userInfo}>
                            <Text style={styles.playerTag}>PLAYER:</Text>
                            <Text style={styles.playerName}>{user.name}</Text>
                            <Text style={styles.playerEmail}>{user.email}</Text>
                        </View>
                        <View style={styles.headerButtons}>
                            <TouchableOpacity
                                style={styles.pixelButton}
                                onPress={() => navigation.navigate("Profile")}
                            >
                                <Text style={styles.pixelButtonText}>PERFIL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.pixelButton, styles.logoutBtn]}
                                onPress={handleLogout}
                            >
                                <Text style={styles.pixelButtonText}>SAIR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Timer Ativo Banner */}
                {activeTimerInfo && (
                    <TouchableOpacity
                        style={styles.activeTimerBanner}
                        onPress={goToActiveTimer}
                    >
                        <View style={styles.timerPulse}>
                            <Text style={styles.timerIcon}>⏰</Text>
                        </View>
                        <View style={styles.timerContent}>
                            <Text style={styles.timerLabel}>▶ TIMER ATIVO</Text>
                            <Text style={styles.timerSubject}>{activeTimerInfo.subject}</Text>
                            <Text style={styles.timerTime}>{activeTimerInfo.remainingTime}</Text>
                        </View>
                        <Text style={styles.timerArrow}>►</Text>
                    </TouchableOpacity>
                )}

                {/* Planos Atrasados */}
                {overduePlans.length > 0 && (
                    <View style={styles.section}>
                        <TouchableOpacity 
                            style={styles.sectionHeader}
                            onPress={() => toggleSection('overdue')}
                        >
                            <Text style={styles.sectionIcon}>
                                {expandedSections.overdue ? '▼' : '►'}
                            </Text>
                            <Text style={styles.sectionTitle}>⚠ ATRASADOS</Text>
                            <View style={styles.sectionBadge}>
                                <Text style={styles.sectionBadgeText}>{overduePlans.length}</Text>
                            </View>
                        </TouchableOpacity>
                        {expandedSections.overdue && overduePlans.map((item) => (
                            <View key={item.study_plan_day_id}>
                                {renderDailyCard(item, true)}
                            </View>
                        ))}
                    </View>
                )}

                {/* Em Andamento */}
                <View style={styles.section}>
                    <TouchableOpacity 
                        style={styles.sectionHeader}
                        onPress={() => toggleSection('inProgress')}
                    >
                        <Text style={styles.sectionIcon}>
                            {expandedSections.inProgress ? '▼' : '►'}
                        </Text>
                        <Text style={styles.sectionTitle}>▶ EM ANDAMENTO</Text>
                        {inProgress.length > 0 && (
                            <View style={styles.sectionBadge}>
                                <Text style={styles.sectionBadgeText}>{inProgress.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    {expandedSections.inProgress && (
                        inProgress.length > 0 ? (
                            inProgress.map((item) => (
                                <TouchableOpacity
                                    key={item.study_plan_day_id}
                                    style={styles.cardInProgress}
                                    onPress={() => navigation.navigate("DailyStudyPlan", { day: item })}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardIcon}>🎯</Text>
                                        <Text style={styles.cardTitle}>{item.content.subject}</Text>
                                    </View>
                                    <View style={styles.cardDivider} />
                                    <View style={styles.cardStats}>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statLabel}>STATUS:</Text>
                                            <Text style={styles.statValue}>{item.status}</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statLabel}>TEMPO:</Text>
                                            <Text style={styles.statValue}>
                                                {item.studied_minutes}/{item.allocated_minutes} MIN
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.emptyBox}>
                                <Text style={styles.emptyText}>NENHUMA QUEST ATIVA</Text>
                            </View>
                        )
                    )}
                </View>

                {/* Plano de Hoje */}
                <View style={styles.section}>
                    <TouchableOpacity 
                        style={styles.sectionHeader}
                        onPress={() => toggleSection('today')}
                    >
                        <Text style={styles.sectionIcon}>
                            {expandedSections.today ? '▼' : '►'}
                        </Text>
                        <Text style={styles.sectionTitle}>📅 HOJE</Text>
                        {todayPlans.length > 0 && (
                            <View style={styles.sectionBadge}>
                                <Text style={styles.sectionBadgeText}>{todayPlans.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    {expandedSections.today && (
                        todayPlans.length > 0 ? (
                            todayPlans.map((item) => (
                                <View key={item.study_plan_day_id}>
                                    {renderDailyCard(item)}
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyBox}>
                                <Text style={styles.emptyText}>NENHUMA QUEST PARA HOJE</Text>
                            </View>
                        )
                    )}
                </View>

                {/* Planos de Estudo */}
                <View style={styles.section}>
                    <TouchableOpacity 
                        style={styles.sectionHeader}
                        onPress={() => toggleSection('plans')}
                    >
                        <Text style={styles.sectionIcon}>
                            {expandedSections.plans ? '▼' : '►'}
                        </Text>
                        <Text style={styles.sectionTitle}>📋 SEUS PLANOS</Text>
                        {studyPlans.length > 0 && (
                            <View style={styles.sectionBadge}>
                                <Text style={styles.sectionBadgeText}>{studyPlans.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    {expandedSections.plans && studyPlans.map((item) => (
                        <TouchableOpacity
                            key={item.study_plan_id}
                            style={styles.planCard}
                            onPress={() => navigation.navigate("StudyPlanDetails", { id: item.study_plan_id })}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardIcon}>📖</Text>
                                <Text style={styles.cardTitle}>{item.subject}</Text>
                            </View>
                            <View style={styles.cardDivider} />
                            <View style={styles.planInfo}>
                                <Text style={styles.planDate}>
                                    {new Date(item.start_date).toLocaleDateString()} → {new Date(item.end_date).toLocaleDateString()}
                                </Text>
                                <Text style={styles.planTotal}>TOTAL: {item.total_minutes} MIN</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Botão Criar Plano */}
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => navigation.navigate("CreateStudyPlan")}
                >
                    <Text style={styles.createButtonText}>+ NOVA QUEST</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 12,
        backgroundColor: "#1a1a2e",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1a1a2e",
    },
    loadingBox: {
        backgroundColor: "#16213e",
        padding: 30,
        borderRadius: 0,
        borderWidth: 4,
        borderColor: "#0f3460",
        alignItems: "center",
    },
    loadingText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 14,
        color: "#FFD700",
        marginBottom: 20,
    },
    // Header Styles
    header: {
        marginBottom: 16,
        backgroundColor: "#16213e",
        borderWidth: 4,
        borderColor: "#0f3460",
        borderRadius: 0,
    },
    headerTop: {
        backgroundColor: "#0f3460",
        padding: 12,
        alignItems: "center",
    },
    headerTitle: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 16,
        color: "#FFD700",
        textShadowColor: "#000",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 0,
    },
    headerMiddle: {
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    userInfo: {
        flex: 1,
    },
    playerTag: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#FFD700",
        marginBottom: 4,
    },
    playerName: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 12,
        color: "#e94560",
        marginBottom: 4,
    },
    playerEmail: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#94a3b8",
    },
    headerButtons: {
        gap: 8,
    },
    pixelButton: {
        backgroundColor: "#0f3460",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 3,
        borderColor: "#16213e",
        borderRadius: 0,
    },
    logoutBtn: {
        backgroundColor: "#e94560",
        borderColor: "#c23854",
    },
    pixelButtonText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 10,
        color: "#fff",
    },
    // Timer Banner
    activeTimerBanner: {
        backgroundColor: "#FFD700",
        borderWidth: 4,
        borderColor: "#FFA500",
        padding: 16,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center",
    },
    timerPulse: {
        marginRight: 12,
    },
    timerIcon: {
        fontSize: 32,
    },
    timerContent: {
        flex: 1,
    },
    timerLabel: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#1a1a2e",
        marginBottom: 4,
    },
    timerSubject: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 12,
        color: "#1a1a2e",
        marginBottom: 4,
    },
    timerTime: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 16,
        color: "#e94560",
    },
    timerArrow: {
        fontSize: 24,
        color: "#1a1a2e",
    },
    // Section Styles
    section: {
        marginBottom: 16,
    },
    sectionHeader: {
        backgroundColor: "#0f3460",
        padding: 8,
        marginBottom: 8,
        borderWidth: 3,
        borderColor: "#16213e",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    sectionIcon: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 10,
        color: "#3b82f6",
    },
    sectionTitle: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 12,
        color: "#FFD700",
        flex: 1,
    },
    sectionBadge: {
        backgroundColor: "#e94560",
        borderWidth: 2,
        borderColor: "#c23854",
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 28,
        alignItems: "center",
    },
    sectionBadgeText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 10,
        color: "#fff",
    },
    // Card Styles
    card: {
        backgroundColor: "#16213e",
        padding: 12,
        marginBottom: 8,
        borderWidth: 4,
        borderColor: "#0f3460",
    },
    overdueCard: {
        backgroundColor: "#2d1515",
        borderColor: "#e94560",
    },
    cardInProgress: {
        backgroundColor: "#1a2f1a",
        borderColor: "#10b981",
        borderWidth: 4,
        padding: 12,
        marginBottom: 8,
    },
    planCard: {
        backgroundColor: "#16213e",
        borderColor: "#3b82f6",
        borderWidth: 4,
        padding: 12,
        marginBottom: 8,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    cardIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    cardTitle: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 12,
        color: "#fff",
        flex: 1,
    },
    cardDivider: {
        height: 2,
        backgroundColor: "#0f3460",
        marginVertical: 8,
    },
    cardStats: {
        gap: 6,
    },
    statItem: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    statLabel: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#94a3b8",
    },
    statValue: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#e94560",
    },
    overdueTag: {
        backgroundColor: "#e94560",
        padding: 6,
        marginTop: 8,
        alignItems: "center",
    },
    overdueTagText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#fff",
    },
    planInfo: {
        gap: 6,
    },
    planDate: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#94a3b8",
    },
    planTotal: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#FFD700",
    },
    // Empty State
    emptyBox: {
        backgroundColor: "#16213e",
        padding: 20,
        alignItems: "center",
        borderWidth: 4,
        borderColor: "#0f3460",
        borderStyle: "dashed",
    },
    emptyText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 10,
        color: "#94a3b8",
        textAlign: "center",
    },
    // Create Button
    createButton: {
        backgroundColor: "#10b981",
        padding: 16,
        alignItems: "center",
        marginTop: 16,
        marginBottom: 20,
        borderWidth: 4,
        borderColor: "#059669",
    },
    createButtonText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 12,
        color: "#fff",
    },
});