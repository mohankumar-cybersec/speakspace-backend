import { NextRequest, NextResponse } from 'next/server'; // Force Vercel Deploy v2

interface MedicationData {
  medicine_name: string | null;
  dosage_per_intake: number | null;
  frequency_per_day: number | null;
  start_date: string | null;
  end_date: string | null;
  total_tablets_available: number | null;
  schedule_times: string[];
  notes: string | null;
  predicted_restock_date: string | null;
}

interface FeedbackData {
  medicine_name: string | null;
  symptoms: string[];
  category: 'positive' | 'negative' | 'allergy' | null;
  severity_score: number | null;
  notes: string | null;
}

interface IncomingPayload {
  type: 'new_medication' | 'daily_feedback';
  data: MedicationData | FeedbackData;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authorization
    const apiKey = request.headers.get('x-api-key');
    const validKey = process.env.API_KEY || 'demo-key';
    if (apiKey !== validKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Body with Safety Check
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('Received Payload:', JSON.stringify(body, null, 2));

    // 3. Handle Types
    // Ensure we handle the "Legacy" format (just fields) by defaulting to type='new_medication'
    // This supports the previous prompt version if not updated immediately.
    let payloadType = body.type;
    let payloadData = body.data;

    // Auto-detect legacy format if 'medicine_name' is at top level
    if (!payloadType && body.medicine_name) {
      payloadType = 'new_medication';
      payloadData = body;
    }

    // --- LOGIC 1: NEW MEDICATION (Restock Calculator) ---
    if (payloadType === 'new_medication') {
      const stats = payloadData as MedicationData;

      // Fallback Calc
      if (!stats.predicted_restock_date && stats.start_date && stats.total_tablets_available && stats.dosage_per_intake && stats.frequency_per_day) {
        const dailyConsumption = stats.dosage_per_intake * stats.frequency_per_day;
        if (dailyConsumption > 0) {
          const daysLasting = Math.floor(stats.total_tablets_available / dailyConsumption);
          const startDate = new Date(stats.start_date);
          const restockDate = new Date(startDate);
          restockDate.setDate(startDate.getDate() + daysLasting);
          stats.predicted_restock_date = restockDate.toISOString().split('T')[0];
        }
      }

      return NextResponse.json({
        status: 'success',
        message: 'Medication Setup Processed',
        action: 'CALENDAR_SETUP', // Hint to Frontend what to do
        data: stats
      });
    }

    // --- LOGIC 2: DAILY FEEDBACK (Symptom Analysis) ---
    if (payloadType === 'daily_feedback') {
      const feedback = payloadData as FeedbackData;

      let doctorRecommendation = "Continue monitoring.";
      let alertLevel = "LOW";

      // Logic based on Severity & Category
      if (feedback.category === 'allergy' || (feedback.severity_score && feedback.severity_score >= 4)) {
        doctorRecommendation = "URGENT: STOP medication immediately and consult your doctor.";
        alertLevel = "CRITICAL";
      } else if (feedback.category === 'negative') {
        doctorRecommendation = "Monitor symptoms for 3 days. If worsening, contact doctor.";
        alertLevel = "MODERATE";
      } else if (feedback.category === 'positive') {
        doctorRecommendation = "Continue medication as prescribed. Great progress!";
        alertLevel = "e_GOOD";
      }

      // Simulate Trend Data (Mock data for visualization requirement)
      const visualizationData = {
        chart_type: "severity_trend",
        data_points: [1, 1, 2, feedback.severity_score || 0] // Mock history + current
      };

      return NextResponse.json({
        status: 'success',
        message: 'Feedback Analyzed',
        action: 'SHOW_REPORT',
        alert_level: alertLevel,
        doctor_summary: {
          subject: `${alertLevel} Alert - ${feedback.medicine_name}`,
          recommendation: doctorRecommendation,
          symptoms_detected: feedback.symptoms
        },
        data: feedback,
        visualization: visualizationData
      });
    }

    return NextResponse.json({ error: 'Unknown request type' }, { status: 400 });

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
