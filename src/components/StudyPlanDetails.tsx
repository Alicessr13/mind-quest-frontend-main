import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import axios from "axios";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App"; // ajuste para o seu projeto
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

type Props = NativeStackScreenProps<RootStackParamList, "StudyPlanDetails">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "StudyPlanDetails">;


interface Content {
    content_id: string;
    subject: string;
    status: string;
    allocated_minutes: number;
    studied_minutes: number;
    StudyPlanDay: {
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
                const token = await AsyncStorage.getItem("token");

                const res = await axios.get(`http://192.168.0.17:3333/study-plan/${id}`, {
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
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!plan) {
        return (
            <View style={styles.center}>
                <Text>Plano de estudo não encontrado.</Text>
                <TouchableOpacity
                            
                            onPress={() => {
                                navigation.goBack();
                            }}>
                            <Text>Voltar</Text>
                            </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Cabeçalho */}
            <View style={styles.header}>
                <Text style={styles.title}>{plan.subject}</Text>
                <Text>
                    {new Date(plan.start_date).toLocaleDateString()} →{" "}
                    {new Date(plan.end_date).toLocaleDateString()}
                </Text>
                <Text>Total: {plan.total_minutes} min</Text>
                <Text>Por dia: {plan.minutes_per_day} min</Text>
            </View>

            {/* Conteúdos */}
            <Text style={styles.sectionTitle}>Conteúdos</Text>
            <FlatList
                data={plan.Content}
                keyExtractor={(item) => item.content_id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <TouchableOpacity
                            onPress={() =>
                                setExpandedContent(expandedContent === item.content_id.toString() ? null : item.content_id.toString())
                            }
                        >
                            <Text style={styles.cardTitle}>{item.subject}</Text>
                            <Text>Status: {item.status}</Text>
                            <Text>
                                {item.studied_minutes}/{item.allocated_minutes} min
                            </Text>
                        </TouchableOpacity>

                        {/* Dias de estudo (expansível) */}
                        {expandedContent === item.content_id.toString() && (
                            <View style={styles.subList}>
                                {item.StudyPlanDay.map((day) => (
                                    <View key={day.study_plan_day_id} style={styles.subItem}>
                                        <Text>
                                            {new Date(day.date).toLocaleDateString()} - {day.status}
                                        </Text>
                                        <Text>
                                            {day.studied_minutes}/{day.allocated_minutes} min
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            />
            <TouchableOpacity
                            
                            onPress={() => {
                                navigation.goBack();
                            }}>
                            <Text>Voltar</Text>
                            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { marginBottom: 20 },
    title: { fontSize: 22, fontWeight: "bold" },
    sectionTitle: { fontSize: 18, fontWeight: "600", marginVertical: 10 },
    card: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        elevation: 2,
    },
    cardTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
    subList: { marginTop: 10, paddingLeft: 10 },
    subItem: {
        paddingVertical: 5,
        borderBottomColor: "#ddd",
        borderBottomWidth: 1,
    },
});
