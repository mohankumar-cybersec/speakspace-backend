
async function test() {
    const url = 'https://speakspace-backend-vercel.vercel.app/api/medication'; // Live URL

    console.log("--- TEST 1: New Medication Setup ---");
    const setupPayload = {
        type: "new_medication",
        data: {
            medicine_name: "Azithromycin",
            dosage_per_intake: 1,
            frequency_per_day: 1,
            start_date: "2025-12-10",
            total_tablets_available: 5
        }
    };
    await send(url, setupPayload);

    console.log("\n--- TEST 2: Daily Feedback (Negative) ---");
    const feedbackPayload = {
        type: "daily_feedback",
        data: {
            medicine_name: "Azithromycin",
            symptoms: ["dizziness", "itching"],
            category: "negative",
            severity_score: 3,
            notes: "Felt dizzy 30 mins after taking."
        }
    };
    await send(url, feedbackPayload);

    console.log("\n--- TEST 3: Allergy Alert (CRITICAL) ---");
    const allergyPayload = {
        type: "daily_feedback",
        data: {
            medicine_name: "Penicillin",
            symptoms: ["severe swelling", "difficulty breathing"],
            category: "allergy",
            severity_score: 5,
            notes: "Emergency."
        }
    };
    await send(url, allergyPayload);
}

async function send(url, payload) {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': 'demo-key' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
