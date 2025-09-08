import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ActiveTimer {
    startTime: number;
    initialSeconds: number;
    isActive: boolean;
    dayId: string;
    timerKey: string;
    dayData: {
        study_plan_day_id: string;
        content: {
            subject: string;
        };
        allocated_minutes: number;
        studied_minutes: number;
        status: string;
    };
}

export class TimerManager {
    private static readonly ACTIVE_TIMER_KEY = "active_timer_global";

    // Salva o timer ativo globalmente
    static async setActiveTimer(timerData: ActiveTimer): Promise<void> {
        try {
            await AsyncStorage.setItem(
                TimerManager.ACTIVE_TIMER_KEY,
                JSON.stringify(timerData)
            );
        } catch (error) {
            console.error("Erro ao salvar timer ativo:", error);
        }
    }

    // Busca o timer ativo atual
    static async getActiveTimer(): Promise<ActiveTimer | null> {
        try {
            const timerData = await AsyncStorage.getItem(TimerManager.ACTIVE_TIMER_KEY);
            
            if (!timerData) {
                return null;
            }

            const timer: ActiveTimer = JSON.parse(timerData);
            
            // Verifica se o timer ainda é válido
            if (!timer.isActive) {
                await TimerManager.clearActiveTimer();
                return null;
            }

            return timer;
        } catch (error) {
            console.error("Erro ao buscar timer ativo:", error);
            return null;
        }
    }

    // Remove o timer ativo
    static async clearActiveTimer(): Promise<void> {
        try {
            await AsyncStorage.removeItem(TimerManager.ACTIVE_TIMER_KEY);
        } catch (error) {
            console.error("Erro ao limpar timer ativo:", error);
        }
    }

    // Verifica se existe um timer ativo e retorna os dados necessários para navegação
    static async checkForActiveTimer(): Promise<{
        hasActiveTimer: boolean;
        timerData?: ActiveTimer;
    }> {
        try {
            const timer = await TimerManager.getActiveTimer();
            
            if (!timer) {
                return { hasActiveTimer: false };
            }

            // Verifica se o timer não expirou
            const currentTime = Date.now();
            const elapsedSeconds = Math.floor((currentTime - timer.startTime) / 1000);
            const remainingSeconds = Math.max(0, timer.initialSeconds - elapsedSeconds);

            if (remainingSeconds <= 0) {
                // Timer expirou, remove
                await TimerManager.clearActiveTimer();
                return { hasActiveTimer: false };
            }

            return {
                hasActiveTimer: true,
                timerData: timer
            };
        } catch (error) {
            console.error("Erro ao verificar timer ativo:", error);
            return { hasActiveTimer: false };
        }
    }

    // Verifica se existe outro timer ativo para um dia diferente
    static async hasConflictingTimer(currentDayId: string): Promise<{
        hasConflict: boolean;
        conflictingTimer?: ActiveTimer;
    }> {
        try {
            const activeTimer = await TimerManager.getActiveTimer();
            
            if (!activeTimer) {
                return { hasConflict: false };
            }

            if (activeTimer.dayId === currentDayId) {
                return { hasConflict: false };
            }

            return {
                hasConflict: true,
                conflictingTimer: activeTimer
            };
        } catch (error) {
            console.error("Erro ao verificar conflito de timer:", error);
            return { hasConflict: false };
        }
    }
}