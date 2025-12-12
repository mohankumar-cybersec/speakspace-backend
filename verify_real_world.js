const nodemailer = require('nodemailer');
const fs = require('fs');

// Simple color helper
const colors = {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    reset: "\x1b[0m"
};

async function verifyRealWorld() {
    console.log(colors.yellow + "\n=== LIFEGUARD SYSTEM DIAGNOSTIC ===\n" + colors.reset);

    // 1. EMAIL TEST
    const EMAIL_USER = "mohankumar.cyber25@gmail.com";
    const EMAIL_PASS = "tguvifruxiwmktxg"; // USER MUST REPLACE OR SET ENV

    console.log("--> Testing Email Service...");
    if (EMAIL_PASS === "YOUR_GMAIL_APP_PASSWORD") {
        console.log(colors.red + "FAIL: You must edit this script or set EMAIL_PASS to test email." + colors.reset);
    } else {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: EMAIL_USER, pass: EMAIL_PASS }
        });
        try {
            await transporter.verify();
            console.log(colors.green + "SUCCESS: Email Credentials are VALID." + colors.reset);
        } catch (error) {
            console.log(colors.red + "FAIL: Email Error: " + error.message + colors.reset);
        }
    }

    // 2. FONOSTER CONNECTION TEST
    const PROJECT_ID = "4499709e-04be-4137-85c6-2e94f4ab74b6"; // User Provided
    const ACCESS_KEY_ID = "APghyb9ss7mqfrm4t8ah4bviyv6yn1wg1u";
    const ACCESS_KEY_SECRET = "2YMr8NaNcQuUNHoNUi441R3RwoXDfhBzjlPT2oZaGA64XHDG0TmtPpHsEm0655rq";

    console.log("\n--> Testing Fonoster Connection...");

    const endpoints = [
        `https://api.fonoster.com/v1/projects/${PROJECT_ID}/calls`,
        `https://api.fonoster.com/v1/calls`,
        `https://api.fonoster.com/v1/applications`
    ];

    for (const url of endpoints) {
        console.log(`    Trying Endpoint: ${url}`);
        try {
            const auth = Buffer.from(`${ACCESS_KEY_ID}:${ACCESS_KEY_SECRET}`).toString('base64');
            const res = await fetch(url, {
                method: 'GET', // Try GET first to see if we can list items or get 405 (Method Not Allowed) which implies URL exists
                headers: { 'Authorization': `Basic ${auth}` }
            });
            console.log(`    Status: ${res.status}`);
            if (res.ok) {
                const json = await res.json();
                console.log(colors.green + "    SUCCESS: Endpoint Reachable!" + colors.reset);
                console.log("    Response Sample:", JSON.stringify(json).substring(0, 100));
            } else {
                const text = await res.text();
                // If 405, it means "Method Not Allowed" so the Endpoint IS valid but needs POST.
                if (res.status === 405) {
                    console.log(colors.green + "    PARTIAL SUCCESS: Endpoint Exists (405 Method Not Allowed)." + colors.reset);
                } else {
                    console.log(colors.red + "    FAIL: " + text.substring(0, 100) + colors.reset);
                }
            }
        } catch (e) {
            console.log(colors.red + "    NETWORK FAIL: " + e.message + colors.reset);
        }
    }

    console.log("\n=== DIAGNOSTIC COMPLETE ===");
}

verifyRealWorld();
