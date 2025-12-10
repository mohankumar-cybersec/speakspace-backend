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

## 🏆 SpeakSpace Hackathon Submission Details

### 1. API Endpoint
**URL**: `https://speakspace-backend-vercel.vercel.app/api/medication`
**Method**: `POST`
**Authorization**: `x-api-key: demo-key` (Header)

### 2. Custom Action Configuration (Copy-Paste this into SpeakSpace)

**Name**: Intelligent Medication Response
**Description**: Analyzes voice notes for medication setup, restock calculations, and symptom severity tracking.
**Action URL**: `https://speakspace-backend-vercel.vercel.app/api/medication`

**Prompt Template**:
```text
You are an Intelligent Medical Analysis Engine.
Your goal is to detect the USER'S INTENT from their input and return a strict JSON object.

Intent 1: NEW MEDICATION SETUP
User says: "I need to take Amoxicillin..." or "Start taking..."
Action: Extract dosage, frequency, start/end dates, tablets available.
Output Type: "new_medication"

Intent 2: DAILY SYMPTOM FEEDBACK
User says: "I feel dizzy..." or "Had a rash..." or "Feeling better..."
Action:
- Extract symptoms.
- Categorize as "positive", "negative", or "allergy".
- Assign Severity Score (0-5) where 0=none, 5=severe/allergy.
- Extract medicine name if mentioned.
Output Type: "daily_feedback"

--- OUTPUT FORMAT (JSON ONLY) ---

IF NEW MEDICATION:
{
  "type": "new_medication",
  "data": {
    "medicine_name": "string",
    "dosage_per_intake": number,
    "frequency_per_day": number,
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "total_tablets_available": number,
    "schedule_times": ["HH:MM"],
    "notes": "string",
    "predicted_restock_date": "YYYY-MM-DD" (calculate if sufficient data)
  }
}

IF DAILY FEEDBACK:
{
  "type": "daily_feedback",
  "data": {
    "medicine_name": "string (or null)",
    "symptoms": ["symptom1", "symptom2"],
    "category": "positive" | "negative" | "allergy",
    "severity_score": number (0-5),
    "notes": "string"
  }
}

User Input:
$PROMPT
```

**4. Notes**: Select "User Selects Note"
**5. API URL**: `https://speakspace-backend-vercel.vercel.app/api/medication`
**6. Authorization**:
   - Header: `x-api-key`
   - Value: `demo-key` (or your configured key)
