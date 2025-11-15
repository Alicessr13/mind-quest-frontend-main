import { useEffect, useState, useCallback } from "react";
import { View, Image, Text, Button, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import axios from "axios";
import { AuthUtils } from "../utils/auth";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { api } from "../api";
import { baseUrl } from "../api";
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Profile">;

export default function UserProfile() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<NavigationProp>();

    const fetchUserData = async () => {
        try {
            const token = await AuthUtils.getToken();
            const res = await api.get("/user", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(res.data);
        } catch (err) {
            console.error(err);
            Alert.alert("Erro", "Não foi possível carregar o usuário.");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchUserData();
        }, [])
    );

    const handleEquip = async (itemId: number) => {
        try {
            const token = await AuthUtils.getToken();
            const res = await api.post(
                `/users/${user.user_id}/equip`,
                { item_id: itemId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUser(res.data);
            Alert.alert("Sucesso", "Item equipado!");
        } catch (err: any) {
            console.error(err);
            Alert.alert("Erro", err.response?.data?.message || "Não foi possível equipar o item.");
        }
    };

    const handleUnequip = async (slot: string) => {
        try {
            const token = await AuthUtils.getToken();
            const res = await api.post(
                `/users/${user.user_id}/unequip`,
                { slot },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUser(res.data);
            Alert.alert("Sucesso", "Item desequipado!");
        } catch (err: any) {
            console.error(err);
            Alert.alert("Erro", err.response?.data?.message || "Não foi possível desequipar o item.");
        }
    };

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

    if (!user) {
        return (
            <View style={styles.center}>
                <View style={styles.errorBox}>
                    <Text style={styles.errorIcon}>❌</Text>
                    <Text style={styles.errorText}>USUÁRIO NÃO ENCONTRADO</Text>
                </View>
            </View>
        );
    }

    const equippedItems = [
        user.item_body,
        user.item_face,
        user.item_skin_top,
        user.item_skin_bottom,
        user.item_shoes,
        user.item_hair,
        user.item_accessory,
        user.item_hand_accessory,
    ].filter(Boolean);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>👤 PERFIL DO JOGADOR</Text>
            </View>

            <ScrollView>
                {/* Player Info Card */}
                <View style={styles.playerCard}>
                    <View style={styles.playerHeader}>
                        <Text style={styles.playerIcon}>🎮</Text>
                        <View style={styles.playerInfo}>
                            <Text style={styles.playerName}>{user.name}</Text>
                            <View style={styles.pointsContainer}>
                                <Text style={styles.pointsLabel}>PONTOS:</Text>
                                <Text style={styles.pointsValue}>{user.points}</Text>
                                <Text style={styles.pointsCoin}>💰</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Shop Button */}
                <TouchableOpacity
                    style={styles.shopButton}
                    onPress={() => navigation.navigate("ShopScreen")}
                >
                    <Text style={styles.shopButtonIcon}>🛒</Text>
                    <Text style={styles.shopButtonText}>IR PARA A LOJA</Text>
                </TouchableOpacity>

                {/* Character Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>⚔️ SEU PERSONAGEM</Text>
                </View>

                <View style={styles.characterContainer}>
                    <View style={styles.characterDisplay}>
                        {equippedItems.map((item: any, index: number) => (
                            <Image
                                source={{ uri: `${baseUrl}${item.image_url}` }}
                                style={styles.characterLayer}
                            />
                        ))}
                    </View>

                    {/* Equipped Items List */}
                    <View style={styles.equippedList}>
                        {equippedItems.map((item: any, index: number) => {
                            const isDefault =
                                item.name === "Default Body" || item.name === "Default Face";

                            return (
                                <View key={index} style={styles.equippedItem}>
                                    <View style={styles.equippedItemInfo}>
                                        <Text style={styles.equippedItemIcon}>✓</Text>
                                        <Text style={styles.equippedItemName}>{item.name}</Text>
                                    </View>
                                    {!isDefault && (
                                        <TouchableOpacity
                                            style={styles.unequipButton}
                                            onPress={() => handleUnequip(item.slot)}
                                        >
                                            <Text style={styles.unequipButtonText}>REMOVER</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Inventory Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>🎒 INVENTÁRIO</Text>
                </View>

                <View style={styles.inventoryGrid}>
                    {user.Inventory.map((inv: any, index: number) => {
                        const item = inv.item;
                        const isEquipped =
                            user.item_body?.item_id === item.item_id ||
                            user.item_face?.item_id === item.item_id ||
                            user.item_skin_top?.item_id === item.item_id ||
                            user.item_skin_bottom?.item_id === item.item_id ||
                            user.item_shoes?.item_id === item.item_id ||
                            user.item_hair?.item_id === item.item_id ||
                            user.item_accessory?.item_id === item.item_id ||
                            user.item_hand_accessory?.item_id === item.item_id;

                        const isDefault =
                            item.name === "Default Body" || item.name === "Default Face";

                        return (
                            <View key={index} style={styles.inventoryItem}>
                                <View style={styles.itemImageContainer}>
                                    <Image
                                        source={{ uri: `${baseUrl}${item.image_url}` }}
                                        style={styles.itemImage}
                                    />
                                    {isEquipped && (
                                        <View style={styles.equippedBadge}>
                                            <Text style={styles.equippedBadgeText}>E</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.itemName} numberOfLines={2}>
                                    {item.name}
                                </Text>
                                {!isDefault && (
                                    isEquipped ? (
                                        <TouchableOpacity
                                            style={styles.itemButtonUnequip}
                                            onPress={() => handleUnequip(item.slot)}
                                        >
                                            <Text style={styles.itemButtonText}>REMOVER</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.itemButtonEquip}
                                            onPress={() => handleEquip(item.item_id)}
                                        >
                                            <Text style={styles.itemButtonText}>EQUIPAR</Text>
                                        </TouchableOpacity>
                                    )
                                )}
                            </View>
                        );
                    })}
                </View>

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
            </ScrollView>
        </View>
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

    // Loading & Error
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

    // Player Card
    playerCard: {
        backgroundColor: "#16213e",
        borderWidth: 4,
        borderColor: "#3b82f6",
        margin: 16,
        padding: 16,
    },
    playerHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    playerIcon: {
        fontSize: 48,
    },
    playerInfo: {
        flex: 1,
    },
    playerName: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 16,
        color: "#fff",
        marginBottom: 12,
    },
    pointsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    pointsLabel: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#94a3b8",
    },
    pointsValue: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 14,
        color: "#FFD700",
    },
    pointsCoin: {
        fontSize: 20,
    },

    // Shop Button
    shopButton: {
        backgroundColor: "#10b981",
        borderWidth: 4,
        borderColor: "#059669",
        marginHorizontal: 16,
        marginBottom: 20,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    shopButtonIcon: {
        fontSize: 24,
    },
    shopButtonText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 12,
        color: "#fff",
    },

    // Section Header
    sectionHeader: {
        backgroundColor: "#0f3460",
        padding: 8,
        marginHorizontal: 16,
        marginBottom: 12,
        borderWidth: 3,
        borderColor: "#16213e",
    },
    sectionTitle: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 12,
        color: "#FFD700",
    },

    // Character Display
    characterContainer: {
        marginHorizontal: 16,
        marginBottom: 20,
    },
    characterDisplay: {
        width: 200,
        height: 300,
        position: "relative",
        alignSelf: "center",
        backgroundColor: "#16213e",
        borderWidth: 4,
        borderColor: "#0f3460",
        marginBottom: 16,
    },
    characterLayer: {
        position: "absolute",
        width: "100%",
        height: "100%",
        resizeMode: "contain",
    },

    // Equipped Items List
    equippedList: {
        backgroundColor: "#16213e",
        borderWidth: 4,
        borderColor: "#0f3460",
        padding: 12,
        gap: 8,
    },
    equippedItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 2,
        borderBottomColor: "#0f3460",
    },
    equippedItemInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flex: 1,
    },
    equippedItemIcon: {
        fontSize: 16,
        color: "#10b981",
    },
    equippedItemName: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#fff",
        flex: 1,
    },
    unequipButton: {
        backgroundColor: "#e94560",
        borderWidth: 3,
        borderColor: "#c23854",
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    unequipButtonText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 7,
        color: "#fff",
    },

    // Inventory Grid
    inventoryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginHorizontal: 16,
        marginBottom: 20,
        gap: 12,
    },
    inventoryItem: {
        width: "30%",
        backgroundColor: "#16213e",
        borderWidth: 4,
        borderColor: "#0f3460",
        padding: 8,
        alignItems: "center",
        gap: 8,
    },
    itemImageContainer: {
        position: "relative",
        width: 60,
        height: 60,
    },
    itemImage: {
        width: "100%",
        height: "100%",
        resizeMode: "contain",
    },
    equippedBadge: {
        position: "absolute",
        top: -4,
        right: -4,
        backgroundColor: "#10b981",
        borderWidth: 2,
        borderColor: "#059669",
        width: 20,
        height: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    equippedBadgeText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 10,
        color: "#fff",
    },
    itemName: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 7,
        color: "#fff",
        textAlign: "center",
        height: 28,
    },
    itemButtonEquip: {
        backgroundColor: "#10b981",
        borderWidth: 3,
        borderColor: "#059669",
        paddingHorizontal: 8,
        paddingVertical: 6,
        width: "100%",
        alignItems: "center",
    },
    itemButtonUnequip: {
        backgroundColor: "#e94560",
        borderWidth: 3,
        borderColor: "#c23854",
        paddingHorizontal: 8,
        paddingVertical: 6,
        width: "100%",
        alignItems: "center",
    },
    itemButtonText: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 6,
        color: "#fff",
    },

    // Back Button
    backButton: {
        backgroundColor: "#64748b",
        borderWidth: 4,
        borderColor: "#475569",
        marginHorizontal: 16,
        marginBottom: 20,
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