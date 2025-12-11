'use client';

import { useState } from 'react';

// --- VISUAL COMPONENTS ---

// 1. EMERGENCY OVERLAY (Simulation)
const EmergencyOverlay = ({ data, onDismiss }: { data: any, onDismiss: () => void }) => {
  if (!data) return null;
  return (
    <div className="fixed inset-0 z-50 bg-red-600 flex flex-col items-center justify-center animate-pulse">
      <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-md w-full mx-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <span className="text-4xl">📞</span>
        </div>
        <h1 className="text-3xl font-black text-red-600 mb-2">CONNECTING...</h1>
        <p className="text-xl font-bold text-slate-800">Dr. {data.doctor_phone}</p>
        <div className="my-6 p-4 bg-red-50 border border-red-200 rounded-xl text-left">
          <p className="text-xs font-bold text-red-400 uppercase">Emergency Reason</p>
          <p className="text-lg font-bold text-red-900">{data.reason}</p>
        </div>
        <button onClick={onDismiss} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all">
          End Simulation
        </button>
      </div>
      <p className="text-white mt-8 font-mono opacity-80 animate-none">LIFEGUARD PROTOCOL ACTIVE</p>
    </div>
  );
};

// 2. CALENDAR EVENT CARD
const CalendarEvent = ({ time, title, type }: { time: string, title: string, type: 'med' | 'appt' }) => (
  <div className={`p-4 rounded-xl border-l-4 mb-3 flex justify-between items-center ${type === 'med' ? 'bg-blue-50 border-blue-400' : 'bg-purple-50 border-purple-400'}`}>
    <div>
      <p className="text-xs font-bold opacity-60 uppercase">{type === 'med' ? 'Medication' : 'Appointment'}</p>
      <h4 className="font-bold text-slate-700">{title}</h4>
    </div>
    <span className="text-xl font-mono font-bold text-slate-500">{time}</span>
  </div>
);

// --- MAIN PAGE ---
export default function PregnancyHub() {
  const [activeTab, setActiveTab] = useState<'profile' | 'monitor' | 'calendar'>('profile');
  const [loading, setLoading] = useState(false);

  // STATE
  const [profile, setProfile] = useState<any>(null);
  const [emergencyData, setEmergencyData] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);

  // HANDLERS
  const handleSetup = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const payload = {
      type: 'setup',
      data: {
        name: formData.get('name'),
        current_week: Number(formData.get('week')),
        edd: formData.get('edd'),
        doctor_name: formData.get('doc_name'),
        doctor_phone: formData.get('doc_phone'),
        medicine: {
          name: formData.get('med_name'),
          dosage: 1, freq: Number(formData.get('freq')), total: 20
        }
      }
    };

    try {
      const res = await fetch('/api/pregnancy', { method: 'POST', body: JSON.stringify(payload) });
      const json = await res.json();
      setProfile(json.data);
      setActiveTab('monitor');
      alert(`🤰 Pregnancy Profile Created!\nSafe Schedule: ${json.data.schedule.join(', ')}`);
    } catch (err) { alert('Setup Failed'); }
    setLoading(false);
  };

  const handleLog = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    // Convert Input to Arrays/Types
    const type = formData.get('log_type'); // 'symptom' or 'doubt'
    const input = formData.get('input') as string;

    setLoading(true);

    if (type === 'health') {
      const payload = {
        type: 'daily_log',
        data: {
          symptoms: [input], // In real app, AI extracts this
          severity: Number(formData.get('severity')),
          fetal_movement: formData.get('fetal'),
          bp_systolic: Number(formData.get('bp')) || 120
        }
      };
      const res = await fetch('/api/pregnancy', { method: 'POST', body: JSON.stringify(payload) });
      const json = await res.json();

      if (json.action === 'INITIATE_EMERGENCY_CALL') {
        setEmergencyData(json.data); // Triggers Overlay
      } else {
        alert(`✅ ${json.data.message}`);
      }
    }
    else if (type === 'doubt') {
      const payload = { type: 'doubt', data: { text: input } };
      const res = await fetch('/api/pregnancy', { method: 'POST', body: JSON.stringify(payload) });
      const json = await res.json();

      if (json.action === 'BOOK_APPOINTMENT') {
        setAppointments(prev => [...prev, json.data]);
        setActiveTab('calendar'); // Switch to show effect
        alert(`📅 Appointment Auto-Booked: ${json.data.date}`);
      } else {
        alert(json.data.message);
      }
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-pink-50 font-sans text-slate-900 p-4 md:p-8">
      {emergencyData && <EmergencyOverlay data={emergencyData} onDismiss={() => setEmergencyData(null)} />}

      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden min-h-[800px] flex flex-col">
        {/* HEADER */}
        <div className="bg-pink-600 text-white p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🤰 LifeGuard: Maternal Care</h1>
            <p className="opacity-80 text-sm">Pregnancy Monitoring System</p>
          </div>
          {profile && (
            <div className="text-right">
              <p className="font-bold text-lg">{profile.name}</p>
              <p className="text-pink-200 text-sm">Week {profile.current_week} • Due: {profile.edd}</p>
            </div>
          )}
        </div>

        {/* NAV */}
        <div className="flex border-b">
          {['profile', 'monitor', 'calendar'].map(t => (
            <button
              key={t} onClick={() => setActiveTab(t as any)}
              className={`flex-1 py-4 font-bold uppercase text-xs tracking-wider ${activeTab === t ? 'text-pink-600 border-b-4 border-pink-600 bg-pink-50' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="p-8 flex-1 bg-gray-50">

          {/* TAB 1: SETUP */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSetup} className="space-y-6 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold text-gray-700 mb-4">Maternal Profile Setup</h2>
              <div className="grid grid-cols-2 gap-4">
                <input name="name" placeholder="Name" defaultValue="Jane Doe" className="p-3 border rounded-xl" required />
                <input name="week" type="number" placeholder="Week (e.g. 24)" defaultValue="24" className="p-3 border rounded-xl" required />
              </div>
              <input name="edd" type="date" className="w-full p-3 border rounded-xl" required />

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h3 className="text-sm font-bold text-blue-500 mb-2 uppercase">Doctor Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input name="doc_name" placeholder="Dr. Name" defaultValue="Dr. Smith" className="p-3 border rounded-xl" />
                  <input name="doc_phone" placeholder="Phone" defaultValue="555-0199" className="p-3 border rounded-xl" />
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <h3 className="text-sm font-bold text-green-500 mb-2 uppercase">Medication Plan</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input name="med_name" placeholder="Medicine" defaultValue="Prenatal Vitamins" className="p-3 border rounded-xl" />
                  <select name="freq" className="p-3 border rounded-xl">
                    <option value="1">1x Daily (Morning)</option>
                    <option value="2">2x Daily</option>
                    <option value="3">3x Daily</option>
                  </select>
                </div>
              </div>
              <button disabled={loading} className="w-full bg-pink-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-pink-700 transition">
                {loading ? 'Analyzing...' : 'Initialize Pregnancy Profile'}
              </button>
            </form>
          )}

          {/* TAB 2: MONITOR */}
          {activeTab === 'monitor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Health Log */}
              <form onSubmit={handleLog} className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
                <input type="hidden" name="log_type" value="health" />
                <h3 className="font-bold text-gray-700 flex items-center gap-2">📝 Daily Health Check</h3>

                <div>
                  <label className="text-xs font-bold text-gray-400">Fetal Movement</label>
                  <select name="fetal" className="w-full p-3 border rounded-lg mt-1">
                    <option value="normal">Normal (Active)</option>
                    <option value="reduced">Reduced Movement</option>
                    <option value="none">No Movement (Critical)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400">Symptoms</label>
                  <input name="input" placeholder="e.g., headache, swelling..." className="w-full p-3 border rounded-lg mt-1" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400">Severity (1-10)</label>
                    <input name="severity" type="number" defaultValue="1" max="10" className="w-full p-3 border rounded-lg mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400">BP Systolic</label>
                    <input name="bp" type="number" placeholder="120" className="w-full p-3 border rounded-lg mt-1" />
                  </div>
                </div>

                <button className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-black">Log Health Status</button>
              </form>

              {/* Doubt Engine */}
              <form onSubmit={handleLog} className="bg-purple-50 p-6 rounded-2xl shadow-sm border border-purple-100 space-y-4 flex flex-col">
                <input type="hidden" name="log_type" value="doubt" />
                <h3 className="font-bold text-purple-800 flex items-center gap-2">❓ Ask a Doubt</h3>
                <p className="text-sm text-purple-600">The AI will auto-book appointments for serious concerns.</p>

                <textarea name="input" className="flex-1 p-4 border rounded-xl resize-none" placeholder="e.g. I feel a sharp pain in my lower abdomen..." required></textarea>

                <button className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700">Analyze Query</button>
              </form>
            </div>
          )}

          {/* TAB 3: CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="space-y-6 animate-in fade-in zoom-in">
              <h2 className="text-xl font-bold text-gray-700">📅 Maternal Calendar</h2>

              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Today's Schedule</h3>
                {(!profile && appointments.length === 0) && <p className="text-center py-10 opacity-40">No Profile Active</p>}

                {profile && profile.schedule.map((time: string) => (
                  <CalendarEvent key={time} time={time} title={`Take ${profile.medicine.name}`} type="med" />
                ))}

                {appointments.map((appt, i) => (
                  <CalendarEvent key={i} time="TBD" title={`Appointment: ${appt.notes}`} type="appt" />
                ))}

                {profile && (
                  <div className="mt-8 pt-6 border-t flex justify-between items-center opacity-60">
                    <span className="text-xs font-bold">NEXT RESTOCK</span>
                    <span className="font-mono">{profile.restock_date}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
