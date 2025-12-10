import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    // 1. Authorization
    const apiKey = request.headers.get('x-api-key');
    // Allow 'demo-key' for testing or an environment variable
    const validKey = process.env.API_KEY || 'demo-key';
    
    if (apiKey !== validKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Body
    const body = await request.json();
    console.log('Received Payload:', JSON.stringify(body, null, 2));

    // 3. Validation & Parsing
    // SpeakSpace might send the result in a 'prompt' field if it's a raw webhook, 
    // OR it sends the clean JSON if the prompt engine executed it.
    // Based on user instructions, we expect CLEAN JSON.
    // However, we should be robust.
    
    let stats: MedicationData = {
      medicine_name: body.medicine_name || null,
      dosage_per_intake: Number(body.dosage_per_intake) || null,
      frequency_per_day: Number(body.frequency_per_day) || null,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      total_tablets_available: Number(body.total_tablets_available) || null,
      schedule_times: Array.isArray(body.schedule_times) ? body.schedule_times : [],
      notes: body.notes || null,
      predicted_restock_date: body.predicted_restock_date || null,
    };

    // 4. Re-calculate Restock Date (Fail-safe)
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

    // 5. Response
    return NextResponse.json({
      status: 'success',
      message: 'Medication workflow processed successfully',
      data: stats
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
