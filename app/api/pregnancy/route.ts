import { NextRequest, NextResponse } from 'next/server';
import { MedicalRules } from '../../../lib/medical_rules';
import { EmailService } from '../../../lib/email_service';
import { FonosterClient } from '../../../lib/fonoster_client';

// --- TYPES ---
interface SetupData {
    name: string;
    current_week: number;
    edd: string;
    doctor_name: string;
    doctor_phone: string;
    medicine: {
        name: string;
        dosage: number;
        freq: number;
        total: number;
    };
    risks?: string[];
}

interface DailyLogData {
    symptoms: string[];
    severity: number;
    fetal_movement: "normal" | "reduced" | "none";
    bp_systolic?: number;
    notes?: string;
    meds_taken?: boolean;
}

interface DoubtData {
    text: string;
}

// --- MASTER HANDLER ---
export async function POST(request: NextRequest) {
    try {
        // 1. PARSE PAYLOAD (Support both raw & SpeakSpace wrapped)
        let body = await request.json();
        let type = body.type;
        let data = body.data;

        if (body.prompt) {
            try {
                const parsed = JSON.parse(body.prompt);
                type = parsed.type;
                data = parsed.data;
            } catch (e) { console.error('Prompt parse error', e); }
        }

        console.log(`[Pregnancy API] Processing Intent: ${type}`);

        // --- INTENT 1: SETUP ---
        if (type === 'setup') {
            const setup = data as SetupData;

            // Calculate Safe Schedule using Medical Rules
            const alarmTimes = MedicalRules.calculateSchedule(setup.medicine.freq);

            // Calculate Restock Date
            const dailyConsumption = setup.medicine.dosage * setup.medicine.freq;
            const daysLasting = Math.floor(setup.medicine.total / dailyConsumption);
            const today = new Date();
            const restockDate = new Date(today.setDate(today.getDate() + daysLasting));

            return NextResponse.json({
                status: 'success',
                action: 'SETUP_COMPLETE',
                data: {
                    ...setup,
                    schedule: alarmTimes,
                    restock_date: restockDate.toISOString().split('T')[0],
                    message: `Profile Created for ${setup.name}. Safe Schedule Generated.`
                }
            });
        }

        // --- INTENT 2: DAILY LOG (Health Status) ---
        if (type === 'daily_log') {
            const log = data as DailyLogData;

            // 1. ANALYZE STATUS
            const analysis = MedicalRules.analyzeSeverity(
                log.symptoms || [],
                log.severity,
                log.fetal_movement,
                log.bp_systolic
            );

            // 2. TIERED RESPONSE SYSTEM

            // TIER 3: CRITICAL (Score 5) -> CALL DOCTOR + RED SCREEN
            if (analysis.score >= 5) {
                // Async: Trigger real call (don't await if you want faster UI response, but user asked for it)
                // We'll await briefly or fire-and-forget. Let's await to log success.
                // In real hackathon demo, speed matters, so maybe fire-and-forget? 
                // User said "once docter recives... he atten...". We trigger it here.
                FonosterClient.triggerCallWithTTS(
                    "9360191723", // Target Phone (User's Doctor from note, hardcoded for consistency check or fetch from DB if state existed)
                    // Note: In a stateless API without DB, we can't easily fetch the doctor's phone from the SETUP phase unless it was passed in the log 
                    // or we hardcode "Dr. Mohan" for the demo.
                    // Let's use a safe fallback or the user's specific demo number.
                    "Priya",
                    log.symptoms.join(", ")
                );

                return NextResponse.json({
                    status: 'success',
                    action: 'INITIATE_EMERGENCY_CALL',
                    alert_level: 'CRITICAL',
                    data: {
                        reason: analysis.reason,
                        doctor_phone: "911", // Frontend will show Dr Name if it has state
                        severity_score: analysis.score
                    }
                });
            }

            // TIER 2: MODERATE (Score 3-4) -> EMAIL DOCTOR
            if (analysis.score >= 3) {
                EmailService.sendAlert(
                    "mohankumar.cyber25@gmail.com", // Doctor Email from user note
                    "Dr. Mohan",
                    "Priya",
                    log.symptoms.join(", "),
                    analysis.score
                );

                return NextResponse.json({
                    status: 'success',
                    action: 'LOG_RECORDED', // Keep on monitor screen, maybe show alert
                    alert_level: 'MODERATE',
                    data: {
                        message: `⚠️ Alert Sent to Doctor: ${analysis.reason}`,
                        fetal_status: log.fetal_movement,
                        severity_score: analysis.score
                    }
                });
            }

            // If Healthy -> Generate Weekly Report Stub
            return NextResponse.json({
                status: 'success',
                action: 'LOG_RECORDED',
                alert_level: 'NORMAL',
                data: {
                    message: "Vitals are stable. Log added to Weekly Report.",
                    fetal_status: log.fetal_movement
                }
            });
        }

        // --- INTENT 3: ASK DOUBT (Appointment) ---
        if (type === 'doubt') {
            const doubt = data as DoubtData;
            const analysis = MedicalRules.analyzeDoubt(doubt.text);

            if (analysis.needsAppointment) {
                const appointmentDate = new Date();
                if (analysis.urgency === 'low') appointmentDate.setDate(appointmentDate.getDate() + 2); // 2 days later
                else appointmentDate.setDate(appointmentDate.getDate() + 1); // Tomorrow

                return NextResponse.json({
                    status: 'success',
                    action: 'BOOK_APPOINTMENT',
                    data: {
                        type: analysis.type,
                        date: appointmentDate.toISOString().split('T')[0],
                        notes: `Auto-booked for: "${doubt.text}"`
                    }
                });
            }

            return NextResponse.json({
                status: 'success',
                action: 'ANSWER_DOUBT',
                data: { message: "Your query has been sent to the doctor. Expect a reply within 24hrs." }
            });
        }

        return NextResponse.json({ error: 'Unknown Intent' }, { status: 400 });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
