# Medication Restock & Reminder Workflow API

This is the backend API for the SpeakSpace Hackathon submission. It processes medication details extracted from voice notes and returns confirmation.

## Project Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Locally**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:3000/api/medication`.

3. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Deployment Guide

You can deploy this Next.js app to Vercel, Railway, or Render.

**Vercel (Recommended)**:
1. Push this code to GitHub.
2. Import the repository in Vercel.
3. Add Environment Variable `API_KEY` (optional, defaults to 'demo-key').
4. Deploy.

**API Endpoint URL**:  
`https://speakspace-backend-vercel.vercel.app/api/medication`

### 🟢 Hackathon Submission Details

**1. API Endpoint**
\`\`\`
https://speakspace-backend-vercel.vercel.app/api/pregnancy
\`\`\`

**2. Prompt Template (Copy & Paste into SpeakSpace)**
\`\`\`text
You are 'LifeGuard', a Maternal Health AI.
Analyze the user's input to detect the INTENT.
Output strict JSON.

INTENT 1: SETUP
User says: "I am pregnant, 24 weeks..." or "Start taking Prenatal vitamins..."
Output:
{
  "type": "setup",
  "data": {
    "name": "Jane Doe",
    "current_week": number,
    "edd": "YYYY-MM-DD",
    "doctor_name": "Dr. Name",
    "doctor_phone": "Phone",
    "medicine": { "name": "Drug Name", "freq": number }
  }
}

INTENT 2: DAILY LOG
User says: "Felt baby kick", "have headache", "took meds"
Output:
{
  "type": "daily_log",
  "data": {
    "symptoms": ["list", "of", "symptoms"],
    "severity": number (1-10),
    "fetal_movement": "normal" | "reduced" | "none",
    "bp_systolic": number (optional),
    "notes": "string"
  }
}

INTENT 3: DOUBT
User says: "Is it normal to feel..." or "I have a pain..."
Output:
{
  "type": "doubt",
  "data": { "text": "User's full question" }
}
\`\`\`

**3. Headers**
*   Key: `x-api-key`
*   Value: `demo-key`
