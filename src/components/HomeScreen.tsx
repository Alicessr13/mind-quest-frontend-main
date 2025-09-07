import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import axios from "axios";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../App"; // ajuste conforme seu projeto
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");

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
        }, [fetchData])
    );

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
});