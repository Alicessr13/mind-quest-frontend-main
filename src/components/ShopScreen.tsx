import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthUtils } from "../utils/auth";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { useNavigation } from "@react-navigation/native";
import { api } from "../api";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ShopScreen">;

interface User {
    user_id: string;
    name: string;
    points: number;
}

interface Item {
    item_id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    slot: string;
    purchased: boolean;
}

export default function ShopScreen() {
    const [user, setUser] = useState<User | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<NavigationProp>();

    const fetchData = async () => {
        try {
            const token = await AuthUtils.getToken();

            const [userRes, itemsRes] = await Promise.all([
                api.get("/user", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                api.get("/items", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            setUser(userRes.data);
            setItems(itemsRes.data); // agora funciona pois backend retorna array direto
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
            Alert.alert("Erro", "Não foi possível carregar a loja.");
        } finally {
            setLoading(false);
        }
    };

    const handleBuy = async (item: Item) => {
        try {
            if (!user) return;

            const token = await AuthUtils.getToken();
            const res = await api.post(
                `/users/${user.user_id}/buy`,
                { item_id: item.item_id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setUser(res.data); // agora sim, res.data é o usuário atualizado
            Alert.alert("Sucesso", `Você comprou ${item.name}!`);
        } catch (err: any) {
            console.error(err);
            Alert.alert("Erro", err.response?.data?.message || "Não foi possível comprar o item.");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {user && (
                <View style={styles.header}>
                    <Text style={styles.title}>Loja de Itens</Text>
                    <Text style={styles.subtitle}>Pontos: {user.points}</Text>
                </View>
            )}

            <FlatList
                data={items.filter(
                    (item) => item.name !== "Default Body" && item.name !== "Default Face"
                )}
                keyExtractor={(item) => item.item_id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Image source={{ uri: item.image_url }} style={styles.image} />
                        <View style={styles.cardContent}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemDesc}>{item.description}</Text>
                            <Text style={styles.itemPrice}>{item.price} pontos</Text>

                            {item.purchased ? (
                                <TouchableOpacity
                                    style={[styles.buyButton, { backgroundColor: "gray" }]}
                                    disabled
                                >
                                    <Text style={styles.buyButtonText}>Já comprado</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.buyButton}
                                    onPress={() => handleBuy(item)}
                                >
                                    <Text style={styles.buyButtonText}>Comprar</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            />
            <TouchableOpacity style={{ marginBottom: 40, alignItems: "center" }}
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
    header: { marginBottom: 20, alignItems: "center" },
    title: { fontSize: 22, fontWeight: "bold" },
    subtitle: { fontSize: 16, color: "gray" },
    card: {
        flexDirection: "row",
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        elevation: 3,
    },
    image: { width: 80, height: 80, borderRadius: 8 },
    cardContent: { flex: 1, marginLeft: 15 },
    itemName: { fontSize: 18, fontWeight: "bold" },
    itemDesc: { fontSize: 14, color: "gray", marginVertical: 5 },
    itemPrice: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
    buyButton: {
        backgroundColor: "#3b82f6",
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    buyButtonText: { color: "#fff", fontWeight: "bold" },
});
