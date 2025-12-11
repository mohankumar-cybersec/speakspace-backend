export const MedicalRules = {
    // 1. SLEEP PROTECTION: No alarms between 11 PM (23:00) and 6 AM (06:00)
    SLEEP_WINDOW_START: 23,
    SLEEP_WINDOW_END: 6,

    // 2. MORNING SICKNESS BUFFER: Avoid early morning (6-8 AM). Start at 9 AM.
    SAFE_START_HOUR: 9,

    /**
     * Calculates safe medication times based on frequency.
     * Ensures no doses fall during sleep window.
     */
    calculateSchedule: (frequency: number): string[] => {
        // Default safe schedules
        if (frequency === 1) return ["09:00"]; // After morning sickness
        if (frequency === 2) return ["09:00", "20:00"]; // 11hr gap, safe for sleep
        if (frequency === 3) return ["08:00", "14:00", "20:00"]; // 6hr gap (Standard Antibiotic)
        if (frequency === 4) return ["08:00", "12:00", "16:00", "20:00"]; // 4hr gap

        // Fallback for custom freq (spaced evenly between 08:00 and 20:00)
        const times: string[] = [];
        const startHour = 8;
        const endHour = 20;
        const gap = Math.floor((endHour - startHour) / (frequency - 1));

        for (let i = 0; i < frequency; i++) {
            const hour = startHour + (i * gap);
            times.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        return times;
    },

    /**
     * Checks if symptoms indicate an EMERGENCY
     */
    isEmergency: (symptoms: string[], severity: number, fetalMovement: string, bpSystolic?: number) => {
        // Rule 1: Preeclampsia Risk
        if (bpSystolic && bpSystolic >= 160) return { isEmergency: true, reason: "CRITICAL BP: Risk of Preeclampsia" };

        // Rule 2: Physical Trauma
        const dangerKeywords = ['bleeding', 'water break', 'severe cramps', 'vision blur', 'fainted'];
        const detectedDanger = symptoms.find(s => dangerKeywords.some(k => s.toLowerCase().includes(k)));
        if (detectedDanger) return { isEmergency: true, reason: `DANGER SIGN: ${detectedDanger.toUpperCase()}` };

        // Rule 3: Fetal Distress
        if (fetalMovement === 'none') return { isEmergency: true, reason: "NO FETAL MOVEMENT DETECTED" };

        // Rule 4: Severe Pain
        if (severity >= 8) return { isEmergency: true, reason: "SEVERE PAIN THRESHOLD EXCEEDED" };

        return { isEmergency: false, reason: null };
    },

    /**
     * Determines if a doubt requires an appointment
     */
    analyzeDoubt: (text: string) => {
        const textLower = text.toLowerCase();

        // High Urgency
        if (textLower.includes('tight') || textLower.includes('pain') || textLower.includes('swell')) {
            return { needsAppointment: true, urgency: 'high', type: 'Emergency Consult' };
        }

        // Low Urgency (General doubts)
        if (textLower.includes('diet') || textLower.includes('weight') || textLower.includes('vitamin') || textLower.includes('sleep')) {
            return { needsAppointment: true, urgency: 'low', type: 'Routine Query' };
        }

        return { needsAppointment: false, urgency: 'none', type: null };
    }
};
