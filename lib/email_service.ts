import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const EmailService = {
    sendAlert: async (doctorEmail: string, doctorName: string, patientName: string, note: string, severity: number) => {
        if (!process.env.EMAIL_USER) {
            console.log("⚠️ EMAIL_USER not set. Simulating Email to " + doctorEmail);
            return;
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: doctorEmail,
            subject: `⚠️ LifeGuard Alert: Patient ${patientName} (Severity ${severity}/5)`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #d9534f;">Moderate Risk Alert</h2>
                    <p><strong>Doctor ${doctorName},</strong></p>
                    <p>Your patient <b>${patientName}</b> has reported symptoms requiring attention.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-left: 5px solid #f0ad4e; margin: 20px 0;">
                        <p><strong>Reported Note:</strong></p>
                        <p><i>"${note}"</i></p>
                        <p><strong>AI Severity Score:</strong> ${severity}/5</p>
                    </div>

                    <p>Please review their profile or contact them if necessary.</p>
                    <p style="font-size: 12px; color: #888;">Powered by LifeGuard Maternal AI</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`📧 Email sent to ${doctorEmail}`);
        } catch (error) {
            console.error("Email Error:", error);
        }
    }
};
