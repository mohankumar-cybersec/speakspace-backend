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
    /**
     * Analyzes symptoms to determine Severity Score (0-5)
     * 0-2: Safe/Warning
     * 3-4: Moderate (Email Doctor)
     * 5: Critical (Call Doctor)
     */
    analyzeSeverity: (symptoms: string[], reportedSeverity: number, fetalMovement: string, bpSystolic?: number) => {
        // LEVEL 5: CRITICAL EMERGENCY
        // 1. BP Check
        if (bpSystolic && bpSystolic >= 160) return { score: 5, reason: "CRITICAL BP (>160): Preeclampsia Risk" };

        // 2. Critical Keywords
        const criticalKeywords = ['bleed', 'water', 'vision', 'blur', 'faint', 'seizure', 'unconscious'];
        const criticalMatch = symptoms.find(s => criticalKeywords.some(k => s.toLowerCase().includes(k)));
        if (criticalMatch) return { score: 5, reason: `CRITICAL SYMPTOM: ${criticalMatch.toUpperCase()}` };

        // 3. Fetal Distress
        if (fetalMovement === 'none') return { score: 5, reason: "NO FETAL MOVEMENT DETECTED" };

        // LEVEL 4: SERIOUS (High Severity or Specific Pain)
        const seriousKeywords = ['cramp', 'fever', 'swelling', 'vomit'];
        const seriousMatch = symptoms.find(s => seriousKeywords.some(k => s.toLowerCase().includes(k)));

        if (seriousMatch && reportedSeverity >= 5) return { score: 4, reason: `SERIOUS WARNING: Severe ${seriousMatch}` };
        if (reportedSeverity >= 8) return { score: 4, reason: "HIGH PAIN THRESHOLD REPORTED" };

        // LEVEL 3: MODERATE (Needs Attention)
        if (seriousMatch) return { score: 3, reason: `MODERATE: Persistent ${seriousMatch}` };
        if (reportedSeverity >= 6) return { score: 3, reason: "MODERATE PAIN REPORTED" };

        // LEVEL 0-2: NORMAL/MILD
        return { score: reportedSeverity > 2 ? 2 : 1, reason: "Routine Health Log" };
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
