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
`https://<your-project-url>/api/medication`

## SpeakSpace Configuration

Copy these details into the SpeakSpace Custom Action configuration:

**1. Name**: Medication Restock & Reminder Workflow
**2. Description**: Extracts medication details from a single user input, calculates dosage schedule, predicts restock date, and sends structured data to backend.

**3. Prompt Template** (PASTE EXACTLY):
```text
You are a strict medical data extraction engine. The user will enter all medication details in one single sentence or paragraph. Extract and compute the following fields and return ONLY a clean JSON object with no explanation.

Required fields to extract:
- medicine_name
- dosage_per_intake (number of tablets per dose)
- frequency_per_day (1, 2, 3…)
- start_date
- end_date
- total_tablets_available
- schedule_times (explicit times if given)
- notes (any extra info)

Restock Calculation Logic:
1. total_days = number of days between start_date and end_date (inclusive)
2. total_needed = total_days * frequency_per_day * dosage_per_intake
3. tablets_remaining = total_tablets_available – tablets_consumed_so_far
4. predicted_restock_date = date when tablets_remaining becomes zero (based on consumption rate)

If any field is missing, return null for that field.

Final Output Format:
{
  "medicine_name": "",
  "dosage_per_intake": "",
  "frequency_per_day": "",
  "start_date": "",
  "end_date": "",
  "total_tablets_available": "",
  "schedule_times": [],
  "notes": "",
  "predicted_restock_date": ""
}

User Input:
$PROMPT
```

**4. Notes**: Select "User Selects Note"
**5. API URL**: Your deployed URL (e.g., `https://your-app.vercel.app/api/medication`)
**6. Authorization**:
   - Header: `x-api-key`
   - Value: `demo-key` (or your configured key)
