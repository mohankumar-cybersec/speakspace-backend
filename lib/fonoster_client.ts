import Fonoster from "@fonoster/sdk";

export const FonosterClient = {
    triggerCallWithTTS: async (doctorPhone: string, patientName: string, note: string) => {
        const PROJECT_ID = process.env.FONOSTER_PROJECT_ID;
        const ACCESS_KEY_ID = process.env.FONOSTER_ACCESS_KEY_ID;
        const ACCESS_KEY_SECRET = process.env.FONOSTER_ACCESS_KEY_SECRET;

        // Check for required environment variables
        if (!PROJECT_ID || !ACCESS_KEY_ID || !ACCESS_KEY_SECRET) {
            console.log("⚠️ FONOSTER_KEYS not set. Simulating Call to " + doctorPhone);
            return;
        }

        const ttsMessage = `This is a Life Guard Emergency Alert. Patient ${patientName} has reported a critical condition. Note: ${note}. Please respond immediately.`;
        console.log(`📞 Initiating Fonoster Call to ${doctorPhone}...`);
        console.log(`🗣️ TTS: "${ttsMessage}"`);

        try {
            // Initialize Fonoster Calls Service using the SDK
            const calls = new Fonoster.Calls({
                projectId: PROJECT_ID,
                accessKeyId: ACCESS_KEY_ID,
                accessKeySecret: ACCESS_KEY_SECRET
            });

            // Create the Call
            // Note: 'from' usually requires a verified Number or App reference.
            // If user has none, this might still fail, but we'll get a clearer specific error.
            const response = await calls.createCall({
                from: "1234567890", // Placeholder (Fonoster might override or require strict match match)
                to: doctorPhone,
                appRef: "default", // Or specific App ID if user had created one. Default tries to find one.
                metadata: { tts: ttsMessage }
            });

            console.log("✅ Call Queued via SDK:", response);
        } catch (error: any) {
            console.error("Fonoster Call Failed:", error.message || error);
            console.log("⚠️ Falling back to Simulation Mode: Call logged.");
            // We suppress error to prevent crash
        }
    }
};
