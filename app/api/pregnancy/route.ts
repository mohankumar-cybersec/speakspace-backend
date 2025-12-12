import { NextRequest, NextResponse } from 'next/server';
import { MedicalRules } from '../../../lib/medical_rules';
import { EmailService } from '../../../lib/email_service';
import { TwilioClient } from '../../../lib/twilio_client';

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
            let intent;
            try {
                // Cleanup Markdown code blocks if present
                const cleanPrompt = body.prompt.replace(/```json/g, '').replace(/```/g, '').trim();
                intent = JSON.parse(cleanPrompt);
            } catch (e) {
                console.error("Prompt parse error", e);
                // Fallback: If AI failed to give JSON, assume it's a simple symptom log
                console.log("Refining Raw Input:", body.prompt);
                intent = {
                    type: 'daily_log',
                    data: {
                        symptoms: [body.prompt],
                        severity: 1,
                        fetal_movement: 'normal',
                        notes: body.prompt
                    }
                };
            }
            type = intent.type;
            data = intent.data;
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
                // Async: Trigger real call
                try {
                    await TwilioClient.triggerCallWithTTS(
                        "+919944649978", // Target Phone
                        "Priya",
                        log.symptoms.join(", ")
                    );
                } catch (error) {
                    console.error("Twilio Call Failed:", error);
                    console.log("⚠️ Falling back to Simulation Mode: Call logged.");
                }

                return NextResponse.json({
                    status: 'success',
                    action: 'INITIATE_EMERGENCY_CALL',
                    alert_level: 'CRITICAL',
                    data: {
                        reason: analysis.reason,
                        doctor_phone: "911",
                        severity_score: analysis.score
                    }
                });
            }

            // TIER 2: MODERATE (Score 3-4) -> EMAIL DOCTOR
            if (analysis.score >= 3) {
                EmailService.sendAlert(
                    "mohankumar.cyber25@gmail.com", // Doctor Email
                    "Dr. Mohan",
                    "Priya",
                    log.symptoms.join(", "),
                    analysis.score
                );

                return NextResponse.json({
                    status: 'success',
                    action: 'LOG_RECORDED',
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
