import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { AuthUtils } from "../utils/auth";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { useNavigation } from "@react-navigation/native";
import { api } from "../api";
import { SafeAreaView } from "react-native-safe-area-context";
import { baseURL } from "../api";

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
            setItems(itemsRes.data);
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

            setUser(res.data);
            // Atualiza a lista de itens
            fetchData();
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
                <View style={styles.loadingBox}>
                    <Text style={styles.loadingText}>CARREGANDO LOJA...</Text>
                    <ActivityIndicator size="large" color="#FFD700" />
                </View>
            </View>
        );
    }

    const availableItems = items.filter(
        (item) => item.name !== "Default Body" && item.name !== "Default Face"
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#1a1a2e" }}>
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🛒 LOJA DE ITENS</Text>
            </View>

            {/* Player Points Card */}
            {user && (
                <View style={styles.pointsCard}>
                    <View style={styles.pointsContent}>
                        <Text style={styles.pointsIcon}>💰</Text>
                        <View style={styles.pointsInfo}>
                            <Text style={styles.pointsLabel}>SEUS PONTOS</Text>
                            <Text style={styles.pointsValue}>{user.points}</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Shop Instructions */}
            <View style={styles.instructionsBox}>
                <Text style={styles.instructionsText}>
                    ▶ COMPRE ITENS PARA CUSTOMIZAR SEU PERSONAGEM
                </Text>
            </View>

            {/* Items List */}
            <FlatList
                data={availableItems}
                keyExtractor={(item) => item.item_id.toString()}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    const canAfford = user ? user.points >= item.price : false;
                    
                    return (
                        <View style={styles.itemCard}>
                            <View style={styles.itemHeader}>
                                {/* Item Image */}
                                <View style={styles.itemImageContainer}>
                                    <Image 
                                        source={{ uri: `${baseURL}${item.image_url}` }} 
                                        style={styles.itemImage} 
                                    />
                                    {item.purchased && (
                                        <View style={styles.purchasedBadge}>
                                            <Text style={styles.purchasedBadgeText}>✓</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Item Info */}
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemSlot}>SLOT: {item.slot.toUpperCase()}</Text>
                                    <Text style={styles.itemDesc} numberOfLines={2}>
                                        {item.description}
                                    </Text>
                                    
                                    {/* Price */}
                                    <View style={styles.priceContainer}>
                                        <Text style={styles.priceIcon}>💰</Text>
                                        <Text style={[
                                            styles.priceValue,
                                            !canAfford && !item.purchased && styles.priceExpensive
                                        ]}>
                                            {item.price}
                                        </Text>
                                        <Text style={styles.priceLabel}>PONTOS</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Buy Button */}
                            <View style={styles.itemFooter}>
                                {item.purchased ? (
                                    <View style={styles.buttonPurchased}>
                                        <Text style={styles.buttonPurchasedText}>✓ JÁ COMPRADO</Text>
                                    </View>
                                ) : canAfford ? (
                                    <TouchableOpacity
                                        style={styles.buttonBuy}
                                        onPress={() => handleBuy(item)}
                                    >
                                        <Text style={styles.buttonBuyText}>► COMPRAR</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.buttonDisabled}>
                                        <Text style={styles.buttonDisabledText}>✗ PONTOS INSUFICIENTES</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyIcon}>📦</Text>
                        <Text style={styles.emptyText}>NENHUM ITEM DISPONÍVEL</Text>
                    </View>
                }
            />

            {/* Back Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.backButtonText}>← VOLTAR</Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>━━━━━━━━━━━━━━━━</Text>
            </View>
        </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1a1a2e",
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
        fontSize: 12,
        color: "#FFD700",
        marginBottom: 20,
        textAlign: "center",
    },

    // Header
    header: {
        backgroundColor: "#0f3460",
        padding: 16,
        borderBottomWidth: 4,
        borderBottomColor: "#16213e",
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

    // Points Card
    pointsCard: {
        backgroundColor: "#16213e",
        borderWidth: 4,
        borderColor: "#FFD700",
        margin: 16,
        padding: 16,
    },
    pointsContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    pointsIcon: {
        fontSize: 48,
    },
    pointsInfo: {
        flex: 1,
    },
    pointsLabel: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#94a3b8",
        marginBottom: 8,
    },
    pointsValue: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 24,
        color: "#FFD700",
    },

    // Instructions
    instructionsBox: {
        backgroundColor: "#0f3460",
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 12,
        borderWidth: 3,
        borderColor: "#16213e",
    },
    instructionsText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#3b82f6",
        textAlign: "center",
        lineHeight: 16,
    },

    // List
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },

    // Item Card
    itemCard: {
        backgroundColor: "#16213e",
        borderWidth: 4,
        borderColor: "#0f3460",
        marginBottom: 16,
    },
    itemHeader: {
        flexDirection: "row",
        padding: 12,
        gap: 12,
    },
    itemImageContainer: {
        position: "relative",
        width: 80,
        height: 80,
        backgroundColor: "#0f3460",
        borderWidth: 3,
        borderColor: "#1a1a2e",
    },
    itemImage: {
        width: "100%",
        height: "100%",
        resizeMode: "contain",
    },
    purchasedBadge: {
        position: "absolute",
        top: -6,
        right: -6,
        backgroundColor: "#10b981",
        borderWidth: 3,
        borderColor: "#059669",
        width: 24,
        height: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    purchasedBadgeText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 12,
        color: "#fff",
    },

    // Item Info
    itemInfo: {
        flex: 1,
        justifyContent: "space-between",
    },
    itemName: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 11,
        color: "#fff",
        marginBottom: 4,
        lineHeight: 18,
    },
    itemSlot: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 7,
        color: "#3b82f6",
        marginBottom: 6,
    },
    itemDesc: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 7,
        color: "#94a3b8",
        lineHeight: 12,
        marginBottom: 8,
    },

    // Price
    priceContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    priceIcon: {
        fontSize: 16,
    },
    priceValue: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 14,
        color: "#FFD700",
    },
    priceExpensive: {
        color: "#e94560",
    },
    priceLabel: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 7,
        color: "#94a3b8",
    },

    // Item Footer (Buttons)
    itemFooter: {
        borderTopWidth: 3,
        borderTopColor: "#0f3460",
    },
    buttonBuy: {
        backgroundColor: "#10b981",
        borderBottomWidth: 4,
        borderBottomColor: "#059669",
        padding: 12,
        alignItems: "center",
    },
    buttonBuyText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 10,
        color: "#fff",
    },
    buttonPurchased: {
        backgroundColor: "#64748b",
        borderBottomWidth: 4,
        borderBottomColor: "#475569",
        padding: 12,
        alignItems: "center",
    },
    buttonPurchasedText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 10,
        color: "#fff",
    },
    buttonDisabled: {
        backgroundColor: "#2d1515",
        borderBottomWidth: 4,
        borderBottomColor: "#e94560",
        padding: 12,
        alignItems: "center",
    },
    buttonDisabledText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#e94560",
    },

    // Empty State
    emptyBox: {
        backgroundColor: "#16213e",
        padding: 40,
        alignItems: "center",
        borderWidth: 4,
        borderColor: "#0f3460",
        borderStyle: "dashed",
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 10,
        color: "#94a3b8",
        textAlign: "center",
    },

    // Back Button
    backButton: {
        backgroundColor: "#64748b",
        borderWidth: 4,
        borderColor: "#475569",
        marginHorizontal: 16,
        marginBottom: 16,
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
        alignItems: "center",
        marginBottom: 20,
    },
    footerText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#0f3460",
    },
});