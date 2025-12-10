
async function test() {
    const payload = {
        medicine_name: "Amoxicillin",
        dosage_per_intake: 1,
        frequency_per_day: 3,
        start_date: "2025-12-10",
        end_date: "2025-12-20",
        total_tablets_available: 20,
        schedule_times: ["08:00", "14:00", "20:00"],
        notes: "Take after food",
        predicted_restock_date: null // Testing api calculation fallback
    };

    try {
        const res = await fetch('http://localhost:3000/api/medication', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'demo-key'
            },
            body: JSON.stringify(payload)
        });

        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

test();
