import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, ActivityIndicator } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import axios from "axios";
import { AuthUtils } from "../utils/auth";
import { api } from "../api";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "CreateStudyPlan">;

const weekDays = [
    { label: "DOM", value: 0, emoji: "🌙" },
    { label: "SEG", value: 1, emoji: "⭐" },
    { label: "TER", value: 2, emoji: "⭐" },
    { label: "QUA", value: 3, emoji: "⭐" },
    { label: "QUI", value: 4, emoji: "⭐" },
    { label: "SEX", value: 5, emoji: "⭐" },
    { label: "SAB", value: 6, emoji: "🌙" },
];

export default function CreateStudyPlanScreen() {
    const navigation = useNavigation<NavigationProp>();

    const [subject, setSubject] = useState("");
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [weekDaysSelected, setWeekDaysSelected] = useState<number[]>([]);
    const [minutesPerDay, setMinutesPerDay] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    const toggleWeekDay = (day: number) => {
        setWeekDaysSelected((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR');
    };

    const onStartDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || startDate;
        setShowStartDatePicker(Platform.OS === 'ios');
        setStartDate(currentDate);
    };

    const onEndDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || endDate;
        setShowEndDatePicker(Platform.OS === 'ios');
        setEndDate(currentDate);
    };

    const handleSubmit = async () => {
        if (!subject || weekDaysSelected.length === 0 || !minutesPerDay) {
            return Alert.alert("Erro", "Preencha todos os campos.");
        }

        setIsLoading(true);

        try {
            const token = await AuthUtils.getToken();
            const item = await api.post(
                "/study-plan",
                {
                    subject,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    week_days: weekDaysSelected,
                    minutes_per_day: Number(minutesPerDay),
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            Alert.alert("Sucesso", "Plano de estudo criado!");
            navigation.navigate("StudyPlanDetails", { id: item.data });
        } catch (err) {
            console.error(err);
            Alert.alert("Erro", "Não foi possível criar o plano.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🎮 NOVA QUEST</Text>
                <Text style={styles.headerSubtitle}>CRIAR PLANO DE ESTUDOS</Text>
            </View>

            {/* Matéria */}
            <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>📚 MATÉRIA</Text>
                </View>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="DIGITE A MATÉRIA..."
                        placeholderTextColor="#64748b"
                        value={subject}
                        onChangeText={setSubject}
                        editable={!isLoading}
                    />
                </View>
            </View>

            {/* Data de Início */}
            <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>📅 DATA INÍCIO</Text>
                </View>
                <TouchableOpacity 
                    style={styles.dateButton} 
                    onPress={() => setShowStartDatePicker(true)}
                    disabled={isLoading}
                >
                    <Text style={styles.dateIcon}>▶</Text>
                    <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                </TouchableOpacity>
                {showStartDatePicker && (
                    <DateTimePicker
                        value={startDate}
                        mode="date"
                        display="default"
                        onChange={onStartDateChange}
                    />
                )}
            </View>

            {/* Data de Término */}
            <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>🏁 DATA FIM</Text>
                </View>
                <TouchableOpacity 
                    style={styles.dateButton} 
                    onPress={() => setShowEndDatePicker(true)}
                    disabled={isLoading}
                >
                    <Text style={styles.dateIcon}>▶</Text>
                    <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                </TouchableOpacity>
                {showEndDatePicker && (
                    <DateTimePicker
                        value={endDate}
                        mode="date"
                        display="default"
                        onChange={onEndDateChange}
                    />
                )}
            </View>

            {/* Dias da Semana */}
            <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>📆 DIAS DA SEMANA</Text>
                </View>
                <View style={styles.weekDaysContainer}>
                    {weekDays.map((day) => (
                        <TouchableOpacity
                            key={day.value}
                            style={[
                                styles.weekDayButton,
                                weekDaysSelected.includes(day.value) && styles.weekDayButtonSelected,
                            ]}
                            onPress={() => toggleWeekDay(day.value)}
                            disabled={isLoading}
                        >
                            <Text style={styles.weekDayEmoji}>{day.emoji}</Text>
                            <Text style={[
                                styles.weekDayText,
                                weekDaysSelected.includes(day.value) && styles.weekDayTextSelected
                            ]}>
                                {day.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Minutos por Dia */}
            <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>⏱️ MINUTOS/DIA</Text>
                </View>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="EX: 30"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                        value={minutesPerDay}
                        onChangeText={setMinutesPerDay}
                        editable={!isLoading}
                    />
                </View>
            </View>

            {/* Botões de Ação */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={[
                        styles.createButton,
                        isLoading && styles.createButtonDisabled
                    ]} 
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={styles.createButtonText}>CRIANDO...</Text>
                        </View>
                    ) : (
                        <Text style={styles.createButtonText}>✓ CRIAR QUEST</Text>
                    )}
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    disabled={isLoading}
                >
                    <Text style={styles.backButtonText}>← VOLTAR</Text>
                </TouchableOpacity>
            </View>

            {/* Footer Decorativo */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>━━━━━━━━━━━━━━━━</Text>
                <Text style={styles.footerIcon}>🎯</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#1a1a2e",
        flexGrow: 1,
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
        fontSize: 16,
        color: "#FFD700",
        marginBottom: 8,
        textShadowColor: "#000",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 0,
    },
    headerSubtitle: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#94a3b8",
    },

    // Input Groups
    inputGroup: {
        marginBottom: 20,
    },
    labelContainer: {
        backgroundColor: "#16213e",
        padding: 8,
        marginBottom: 8,
        borderWidth: 3,
        borderColor: "#0f3460",
    },
    label: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 10,
        color: "#FFD700",
    },
    inputWrapper: {
        borderWidth: 4,
        borderColor: "#0f3460",
        backgroundColor: "#16213e",
    },
    input: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 10,
        color: "#fff",
        padding: 12,
        minHeight: 48,
    },

    // Date Button
    dateButton: {
        backgroundColor: "#16213e",
        borderWidth: 4,
        borderColor: "#0f3460",
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    dateIcon: {
        fontSize: 16,
        color: "#3b82f6",
    },
    dateText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 12,
        color: "#fff",
    },

    // Week Days
    weekDaysContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    weekDayButton: {
        backgroundColor: "#16213e",
        borderWidth: 4,
        borderColor: "#0f3460",
        padding: 12,
        alignItems: "center",
        minWidth: 70,
    },
    weekDayButtonSelected: {
        backgroundColor: "#0f3460",
        borderColor: "#3b82f6",
    },
    weekDayEmoji: {
        fontSize: 16,
        marginBottom: 4,
    },
    weekDayText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#94a3b8",
    },
    weekDayTextSelected: {
        color: "#FFD700",
    },

    // Buttons
    buttonContainer: {
        marginTop: 20,
        gap: 12,
    },
    createButton: {
        backgroundColor: "#10b981",
        borderWidth: 4,
        borderColor: "#059669",
        padding: 16,
        alignItems: "center",
    },
    createButtonDisabled: {
        backgroundColor: "#064e3b",
        borderColor: "#022c22",
        opacity: 0.7,
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    createButtonText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 12,
        color: "#fff",
    },
    backButton: {
        backgroundColor: "#e94560",
        borderWidth: 4,
        borderColor: "#c23854",
        padding: 16,
        alignItems: "center",
    },
    backButtonText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 12,
        color: "#fff",
    },

    // Footer
    footer: {
        marginTop: 40,
        marginBottom: 20,
        alignItems: "center",
        gap: 8,
    },
    footerText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#0f3460",
    },
    footerIcon: {
        fontSize: 24,
    },
});