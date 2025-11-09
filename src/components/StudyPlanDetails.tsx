import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import axios from "axios";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { useNavigation } from "@react-navigation/native";
import { AuthUtils } from "../utils/auth";
import { api } from "../api";

type Props = NativeStackScreenProps<RootStackParamList, "StudyPlanDetails">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "StudyPlanDetails">;

interface Content {
    content_id: string;
    subject: string;
    status: string;
    allocated_minutes: number;
    studied_minutes: number;
    study_plan_day: {
        study_plan_day_id: string;
        date: string;
        status: string;
        allocated_minutes: number;
        studied_minutes: number;
    }[];
}

interface StudyPlan {
    study_plan_id: string;
    subject: string;
    start_date: string;
    end_date: string;
    total_minutes: number;
    minutes_per_day: number;
    Content: Content[];
}

export default function StudyPlanDetailsScreen({ route }: Props) {
    const { id } = route.params;
    const [plan, setPlan] = useState<StudyPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedContent, setExpandedContent] = useState<string | null>(null);
    const navigation = useNavigation<NavigationProp>();

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const token = await AuthUtils.getToken();

                const res = await api.get(`/study-plan/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setPlan(res.data);
            } catch (err) {
                console.error("Erro ao carregar plano:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, [id]);

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

    if (!plan) {
        return (
            <View style={styles.center}>
                <View style={styles.errorBox}>
                    <Text style={styles.errorIcon}>❌</Text>
                    <Text style={styles.errorText}>PLANO NÃO ENCONTRADO</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>← VOLTAR</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Calcula progresso geral
    const calculateProgress = () => {
        if (plan.total_minutes === 0) return 0;
        const totalStudied = plan.Content.reduce((sum, content) => sum + content.studied_minutes, 0);
        return Math.floor((totalStudied / plan.total_minutes) * 100);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📖 DETALHES DA QUEST</Text>
            </View>

            <ScrollView>
                {/* Plan Info Card */}
                <View style={styles.planCard}>
                    <View style={styles.planHeader}>
                        <Text style={styles.planIcon}>🎯</Text>
                        <Text style={styles.planTitle}>{plan.subject}</Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.planStats}>
                        <View style={styles.planStatRow}>
                            <Text style={styles.statLabel}>📅 PERÍODO:</Text>
                            <Text style={styles.statValue}>
                                {new Date(plan.start_date).toLocaleDateString()} → {new Date(plan.end_date).toLocaleDateString()}
                            </Text>
                        </View>
                        
                        <View style={styles.planStatRow}>
                            <Text style={styles.statLabel}>⏱️ TOTAL:</Text>
                            <Text style={styles.statValue}>{plan.total_minutes} MIN</Text>
                        </View>
                        
                        <View style={styles.planStatRow}>
                            <Text style={styles.statLabel}>📊 POR DIA:</Text>
                            <Text style={styles.statValue}>{plan.minutes_per_day} MIN</Text>
                        </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <Text style={styles.progressLabel}>PROGRESSO GERAL</Text>
                        <View style={styles.progressBarOuter}>
                            <View 
                                style={[
                                    styles.progressBarInner, 
                                    { width: `${calculateProgress()}%` }
                                ]} 
                            />
                        </View>
                        <Text style={styles.progressPercentage}>{calculateProgress()}%</Text>
                    </View>
                </View>

                {/* Contents Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>📚 CONTEÚDOS</Text>
                </View>

                {plan.Content.length > 0 ? (
                    <FlatList
                        data={plan.Content}
                        scrollEnabled={false}
                        keyExtractor={(item) => item.content_id}
                        renderItem={({ item }) => {
                            const isExpanded = expandedContent === item.content_id.toString();
                            const contentProgress = item.allocated_minutes > 0 
                                ? Math.floor((item.studied_minutes / item.allocated_minutes) * 100)
                                : 0;

                            return (
                                <View style={styles.contentCard}>
                                    <TouchableOpacity
                                        onPress={() =>
                                            setExpandedContent(
                                                isExpanded ? null : item.content_id.toString()
                                            )
                                        }
                                    >
                                        <View style={styles.contentHeader}>
                                            <Text style={styles.expandIcon}>
                                                {isExpanded ? "▼" : "►"}
                                            </Text>
                                            <View style={styles.contentInfo}>
                                                <Text style={styles.contentTitle}>{item.subject}</Text>
                                                <View style={styles.contentStats}>
                                                    <Text style={styles.contentStatus}>
                                                        STATUS: {item.status.toUpperCase()}
                                                    </Text>
                                                    <Text style={styles.contentTime}>
                                                        {item.studied_minutes}/{item.allocated_minutes} MIN
                                                    </Text>
                                                </View>
                                                
                                                {/* Mini Progress Bar */}
                                                <View style={styles.miniProgressBar}>
                                                    <View 
                                                        style={[
                                                            styles.miniProgressFill, 
                                                            { width: `${contentProgress}%` }
                                                        ]} 
                                                    />
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>

                                    {/* Expanded Days List */}
                                    {isExpanded && (
                                        <View style={styles.daysContainer}>
                                            <View style={styles.daysHeader}>
                                                <Text style={styles.daysHeaderText}>
                                                    ▼ DIAS DE ESTUDO
                                                </Text>
                                            </View>
                                            {item.study_plan_day.map((day) => (
                                                <View key={day.study_plan_day_id} style={styles.dayItem}>
                                                    <View style={styles.dayLeft}>
                                                        <Text style={styles.dayIcon}>
                                                            {day.status === 'completed' ? '✓' : '○'}
                                                        </Text>
                                                        <View>
                                                            <Text style={styles.dayDate}>
                                                                {new Date(day.date).toLocaleDateString()}
                                                            </Text>
                                                            <Text style={styles.dayStatus}>
                                                                {day.status.toUpperCase()}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <Text style={styles.dayTime}>
                                                        {day.studied_minutes}/{day.allocated_minutes} MIN
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            );
                        }}
                    />
                ) : (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>NENHUM CONTEÚDO CADASTRADO</Text>
                    </View>
                )}

                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButtonBottom}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>← VOLTAR</Text>
                </TouchableOpacity>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>━━━━━━━━━━━━━━━━</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1a1a2e",
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1a1a2e",
    },

    // Loading
    loadingBox: {
        backgroundColor: "#16213e",
        padding: 30,
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

    // Error
    errorBox: {
        backgroundColor: "#16213e",
        padding: 30,
        borderWidth: 4,
        borderColor: "#e94560",
        alignItems: "center",
        gap: 16,
    },
    errorIcon: {
        fontSize: 48,
    },
    errorText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 12,
        color: "#e94560",
        textAlign: "center",
    },

    // Header
    header: {
        backgroundColor: "#0f3460",
        padding: 16,
        marginBottom: 20,
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

    // Plan Card
    planCard: {
        backgroundColor: "#16213e",
        borderWidth: 4,
        borderColor: "#3b82f6",
        padding: 16,
        marginBottom: 20,
    },
    planHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 12,
    },
    planIcon: {
        fontSize: 32,
    },
    planTitle: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 14,
        color: "#fff",
        flex: 1,
        lineHeight: 24,
    },
    divider: {
        height: 3,
        backgroundColor: "#0f3460",
        marginVertical: 12,
    },
    planStats: {
        gap: 10,
    },
    planStatRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    statLabel: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#94a3b8",
    },
    statValue: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 9,
        color: "#FFD700",
    },

    // Progress Bar
    progressContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 3,
        borderTopColor: "#0f3460",
    },
    progressLabel: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#94a3b8",
        marginBottom: 8,
        textAlign: "center",
    },
    progressBarOuter: {
        height: 20,
        backgroundColor: "#0f3460",
        borderWidth: 3,
        borderColor: "#1a1a2e",
        marginBottom: 8,
    },
    progressBarInner: {
        height: "100%",
        backgroundColor: "#10b981",
    },
    progressPercentage: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 12,
        color: "#10b981",
        textAlign: "center",
    },

    // Section Header
    sectionHeader: {
        backgroundColor: "#0f3460",
        padding: 8,
        marginBottom: 12,
        borderWidth: 3,
        borderColor: "#16213e",
    },
    sectionTitle: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 12,
        color: "#FFD700",
    },

    // Content Card
    contentCard: {
        backgroundColor: "#16213e",
        borderWidth: 4,
        borderColor: "#0f3460",
        marginBottom: 12,
    },
    contentHeader: {
        padding: 12,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    expandIcon: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 14,
        color: "#3b82f6",
        marginTop: 4,
    },
    contentInfo: {
        flex: 1,
    },
    contentTitle: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 11,
        color: "#fff",
        marginBottom: 8,
        lineHeight: 20,
    },
    contentStats: {
        gap: 4,
        marginBottom: 8,
    },
    contentStatus: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 7,
        color: "#94a3b8",
    },
    contentTime: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#FFD700",
    },

    // Mini Progress Bar
    miniProgressBar: {
        height: 8,
        backgroundColor: "#0f3460",
        borderWidth: 2,
        borderColor: "#1a1a2e",
    },
    miniProgressFill: {
        height: "100%",
        backgroundColor: "#10b981",
    },

    // Days Container
    daysContainer: {
        backgroundColor: "#0f3460",
        marginTop: 8,
    },
    daysHeader: {
        backgroundColor: "#1a1a2e",
        padding: 8,
        borderBottomWidth: 3,
        borderBottomColor: "#16213e",
    },
    daysHeaderText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#3b82f6",
    },
    dayItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
        borderBottomWidth: 2,
        borderBottomColor: "#16213e",
    },
    dayLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flex: 1,
    },
    dayIcon: {
        fontSize: 16,
        color: "#10b981",
    },
    dayDate: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#fff",
        marginBottom: 2,
    },
    dayStatus: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 7,
        color: "#94a3b8",
    },
    dayTime: {
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

    // Back Button
    backButton: {
        backgroundColor: "#e94560",
        borderWidth: 4,
        borderColor: "#c23854",
        padding: 12,
        alignItems: "center",
        marginTop: 16,
    },
    backButtonBottom: {
        backgroundColor: "#e94560",
        borderWidth: 4,
        borderColor: "#c23854",
        padding: 16,
        alignItems: "center",
        marginTop: 20,
        marginBottom: 20,
    },
    backButtonText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 12,
        color: "#fff",
    },

    // Footer
    footer: {
        alignItems: "center",
        marginBottom: 20,
    },
    footerText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#0f3460",
    },
});