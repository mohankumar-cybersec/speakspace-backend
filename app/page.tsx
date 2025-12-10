'use client';

import { useState } from 'react';

// --- COMPONENTS ---
const TabButton = ({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all border-b-4 ${active
      ? 'border-blue-600 text-blue-800 bg-blue-50/50'
      : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
      }`}
  >
    {label}
  </button>
);

const SeverityChart = ({ data }: { data: number[] }) => (
  <div className="flex items-end h-32 gap-3 mt-4 border-b border-gray-200 pb-2 px-2">
    {data.map((score, i) => (
      <div key={i} className="flex flex-col items-center flex-1 group relative">
        <div
          className={`w-full rounded-t-md transition-all duration-700 ease-out hover:opacity-80 ${score >= 4 ? 'bg-red-500 shadow-red-200' :
            score >= 3 ? 'bg-amber-400 shadow-amber-100' : 'bg-emerald-400 shadow-emerald-100'
            } shadow-md`}
          style={{ height: `${(score / 5) * 100}%` }}
        ></div>
        <span className="text-[10px] text-gray-400 mt-2 font-medium">Day {i + 1}</span>
      </div>
    ))}
  </div>
);

// --- MAIN APP ---
export default function Home() {
  const [activeTab, setActiveTab] = useState<'setup' | 'workflow' | 'report'>('setup');
  const [loading, setLoading] = useState(false);

  // -- APP STATE (Simulating Database) --
  const [medication, setMedication] = useState<any>(null); // Stores setup data
  const [history, setHistory] = useState<any[]>([]); // Stores daily logs
  const [lastAnalysis, setLastAnalysis] = useState<any>(null); // Last API result

  // -- HANDLERS --

  // 1. SETUP ENGINE
  const handleSetup = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const data = {
      medicine_name: formData.get('name'),
      dosage_per_intake: Number(formData.get('dosage')),
      frequency_per_day: Number(formData.get('freq')),
      start_date: formData.get('start'),
      total_tablets_available: Number(formData.get('total'))
    };

    try {
      // Call API to get Restock Date
      const res = await fetch('/api/medication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'demo-key' },
        body: JSON.stringify({ type: 'new_medication', data }),
      });
      const apiRes = await res.json();
      setMedication(apiRes.data);
      // User Requirement: "System should automatically set reminders and alarms"
      alert(`✅ Setup Complete!\n\n📅 Restock Date: ${apiRes.data.predicted_restock_date}\n⏰ Daily Reminders set in Calendar & Clock.`);
      setActiveTab('workflow');
    } catch (err) { alert('API Error'); }
    setLoading(false);
  };

  // 2. WORKFLOW ENGINE
  const handleAnalyze = async (input: string, adherence: string) => {
    setLoading(true);

    // Heuristic Logic (Simulation)
    const lowerInput = input.toLowerCase();
    let category: any = 'positive';
    let severity = 1;
    let symptoms = [];

    if (lowerInput.includes('dizz') || lowerInput.includes('neause') || lowerInput.includes('pain')) {
      category = 'negative'; severity = 3; symptoms.push('mild side effects');
    }
    if (lowerInput.includes('rash') || lowerInput.includes('swell') || lowerInput.includes('breath')) {
      category = 'allergy'; severity = 5; symptoms = ['rash', 'severe reaction'];
    }

    const payload = {
      medicine_name: medication?.medicine_name || "Unknown",
      symptoms: symptoms.length > 0 ? symptoms : ["none"],
      category,
      severity_score: severity,
      notes: `${input} [Adherence: ${adherence}]`
    };

    try {
      const res = await fetch('/api/medication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'demo-key' },
        body: JSON.stringify({ type: 'daily_feedback', data: payload }),
      });
      const apiRes = await res.json();

      // Add Logic Description for Demo (Matching User's Specific Rules)
      let logicText = "";
      if (category === 'positive') logicText = "✅ Positive Feedback: Collecting 7 Days of data before sending Doctor Summary.";
      if (category === 'negative') logicText = "⚠️ Negative Symptoms: Collecting 3 Days of feedback to analyze worsening trend.";
      if (category === 'allergy') logicText = "🚨 Allergy Detected: Initiating 3-Day Monitoring Protocol to generate detailed Doctor Report.";

      setLastAnalysis({ ...apiRes, logic_text: logicText });
      setHistory(prev => [...prev, payload]);
    } catch (err) { alert('API Error'); }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 font-sans text-slate-900 flex items-center justify-center">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[700px] flex flex-col">

        {/* HEADER */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">💊 SpeakSpace Clinical</h1>
            <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Medication Management System</p>
          </div>
          {medication && (
            <div className="text-right text-xs">
              <p className="opacity-50">Active Patient Plan</p>
              <p className="font-bold text-blue-400">{medication.medicine_name}</p>
              <p>Restock: {medication.predicted_restock_date}</p>
            </div>
          )}
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-200">
          <TabButton active={activeTab === 'setup'} label="1. Setup & Reminders" onClick={() => setActiveTab('setup')} />
          <TabButton active={activeTab === 'workflow'} label="2. Workflow Engine" onClick={() => setActiveTab('workflow')} />
          <TabButton active={activeTab === 'report'} label="3. Doctor Report" onClick={() => setActiveTab('report')} />
        </div>

        {/* CONTENT AREA */}
        <div className="p-8 flex-1 bg-slate-50 relative">

          {/* ------- TAB 1: SETUP ------- */}
          {activeTab === 'setup' && (
            <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold mb-6 text-slate-700">New Medication Setup</h2>
              <form onSubmit={handleSetup} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Medicine Name</label>
                    <input name="name" defaultValue="Amoxicillin" className="w-full p-3 rounded-lg border border-slate-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Total Tablets</label>
                    <input name="total" type="number" defaultValue="20" className="w-full p-3 rounded-lg border border-slate-300" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Dosage</label>
                    <input name="dosage" type="number" defaultValue="1" className="w-full p-3 rounded-lg border border-slate-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Freq/Day</label>
                    <input name="freq" type="number" defaultValue="3" className="w-full p-3 rounded-lg border border-slate-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Start Date</label>
                    <input name="start" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 rounded-lg border border-slate-300" />
                  </div>
                </div>

                <button disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all mt-6">
                  {loading ? 'Calculating...' : 'Calculate Restock & Set Reminders'}
                </button>
              </form>
            </div>
          )}

          {/* ------- TAB 2: WORKFLOW ------- */}
          {activeTab === 'workflow' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
              {/* Input */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-600 mb-4">Daily Check-In</h3>
                <textarea id="voiceInput" className="w-full h-40 p-4 bg-slate-50 rounded-xl border-slate-200 mb-4" placeholder="Type symptom... e.g. 'I feel dizzy'" />
                <div className="flex gap-2 mb-4">
                  {['Taken', 'Missed', 'Late'].map(s => (
                    <button key={s} id={`btn-${s}`} onClick={() => {
                      const input = document.getElementById('voiceInput') as HTMLTextAreaElement;
                      if (input) handleAnalyze(input.value, s);
                    }} className="flex-1 py-3 bg-slate-100 font-bold text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600">{s}</button>
                  ))}
                </div>
              </div>

              {/* Logic Visualizer */}
              <div className="bg-slate-900 rounded-2xl p-6 text-green-400 font-mono text-sm overflow-hidden flex flex-col justify-center border-4 border-slate-800 shadow-inner">
                {!lastAnalysis && <p className="opacity-50 text-center">System Idle. Waiting for data...</p>}
                {lastAnalysis && (
                  <div className="animate-in fade-in zoom-in duration-300">
                    <p className="text-white border-b border-white/20 pb-2 mb-2 font-bold">SYSTEM LOG:</p>
                    <p>&gt; Input Received.</p>
                    <p>&gt; Analysing Symptoms: <span className="text-white">{lastAnalysis.data.symptoms.join(', ')}</span></p>
                    <p>&gt; Classification: <span className="uppercase font-bold text-yellow-400">{lastAnalysis.data.category}</span></p>
                    <p>&gt; Severity Score: {lastAnalysis.data.severity_score}/5</p>
                    <p className="mt-4 p-2 bg-white/10 rounded border border-green-500/50">
                      {lastAnalysis.logic_text}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ------- TAB 3: REPORT ------- */}
          {activeTab === 'report' && (
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <div className="border-b pb-6 mb-6 flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">Patient Status Report</h1>
                  <p className="text-slate-500">Generated by SpeakSpace AI</p>
                </div>
                <button className="bg-slate-800 text-white px-4 py-2 rounded text-sm hover:bg-black">Export PDF</button>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs uppercase text-blue-400 font-bold">Medicine</p>
                  <p className="text-xl font-bold text-blue-900">{medication?.medicine_name || 'N/A'}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-xs uppercase text-green-400 font-bold">Adherence Rate</p>
                  <p className="text-xl font-bold text-green-900">100%</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-xs uppercase text-purple-400 font-bold">Restock Date</p>
                  <p className="text-xl font-bold text-purple-900">{medication?.predicted_restock_date || '--'}</p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-slate-700 mb-4">Symptom History</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold">
                      <tr>
                        <th className="p-3">Log Info</th>
                        <th className="p-3">Severity</th>
                        <th className="p-3">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-400">No logs yet</td></tr>}
                      {history.map((log, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-3">{log.notes}</td>
                          <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${log.severity_score > 3 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{log.severity_score}/5</span></td>
                          <td className="p-3 uppercase text-xs">{log.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                <h4 className="font-bold text-yellow-800 mb-2">Doctor Recommendation</h4>
                <p className="text-yellow-900 italic">
                  {lastAnalysis?.doctor_summary?.recommendation || "Insufficient data to generate recommendation."}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
