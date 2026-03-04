import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { 
  collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, query, where, getDocs 
} from 'firebase/firestore';
import { Save, Clock, Printer, RefreshCw, Sparkles, CalendarDays, Timer } from 'lucide-react';

const TimetablePro = () => {
  const [teachers, setTeachers] = useState([]);
  const [periods, setPeriods] = useState([]);
<<<<<<< HEAD
  const [dynamicClasses, setDynamicClasses] = useState([]); // 🔥 Firestore se aane wali classes
=======
  const [dynamicClasses, setDynamicClasses] = useState([]);
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const scrollContainerRef = useRef(null);
  const lastScrollPos = useRef(0);

  const [selectedSession, setSelectedSession] = useState("2025-26"); 
  const [showMagicModal, setShowMagicModal] = useState(false);
  
<<<<<<< HEAD
  // Setup State
=======
  // 🔥 Naya Setup State: Bina purane logic ko distrub kiye
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
  const [setup, setSetup] = useState({ 
    total: 8, 
    lunchAt: 4, 
    offAt: 8,
<<<<<<< HEAD
    startTime: "08:00",
    periodDuration: 45,
    lunchDuration: 30
  });

  // 🔥 Classes ko sahi sequence mein dikhane ke liye order
  const classSortOrder = [
    "Nursery", "LKG", "UKG", 
    "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", 
    "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"
  ];

  useEffect(() => {
    setLoading(true);

    // 1. 🔥 Fetch Dynamic Classes (Real-time from 'classes' collection)
=======
    startTime: "08:00", // Default Start Time
    periodDuration: 45,  // Default 45 Mins
    lunchDuration: 30    // Default 30 Mins
  });

  useEffect(() => {
    setLoading(true);
    setPeriods([]); 

    const qPeriods = query(collection(db, "timetablePeriods"), where("session", "==", selectedSession));
    const unsubPeriods = onSnapshot(qPeriods, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPeriods(data.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })));
      setLoading(false);

      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = lastScrollPos.current;
      }
    });

    const qTeachers = query(collection(db, "teachers"), where("session", "==", selectedSession));
    const unsubTeachers = onSnapshot(qTeachers, (snapshot) => {
      const activeTeachers = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(t => t.isDeleted !== true); 
      setTeachers(activeTeachers);
    });

>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
    const unsubClasses = onSnapshot(collection(db, "classes"), (snapshot) => {
      const classData = snapshot.docs.map(d => d.data().name || d.data().className);
      
      // Sorting Logic: classSortOrder ke hisab se sort karega
      const sortedClasses = classData.sort((a, b) => {
        const indexA = classSortOrder.indexOf(a);
        const indexB = classSortOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        return a.localeCompare(b, undefined, { numeric: true });
      });
      
      setDynamicClasses(sortedClasses);
    });

<<<<<<< HEAD
    // 2. Fetch Periods
    const qPeriods = query(collection(db, "timetablePeriods"), where("session", "==", selectedSession));
    const unsubPeriods = onSnapshot(qPeriods, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPeriods(data.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })));
      setLoading(false);
    });

    // 3. Fetch Teachers
    const qTeachers = query(collection(db, "teachers"), where("session", "==", selectedSession));
    const unsubTeachers = onSnapshot(qTeachers, (snapshot) => {
      const activeTeachers = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(t => t.isDeleted !== true); 
      setTeachers(activeTeachers);
    });

    return () => { unsubPeriods(); unsubTeachers(); unsubClasses(); };
  }, [selectedSession]);

  // 🔥 Time Calculation (12-Hour format fix)
  const calculateTime = (index, currentSetup) => {
    let [hours, minutes] = currentSetup.startTime.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;

=======
    return () => { unsubPeriods(); unsubTeachers(); unsubClasses(); };
  }, [selectedSession]);

  // 🔥 12-Hour Time Calculator (Fix: 12 ke baad 1 bajega)
  const calculateTime = (index, currentSetup) => {
    let [hours, minutes] = currentSetup.startTime.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;

>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
    for (let i = 1; i < index; i++) {
      totalMinutes += Number(currentSetup.periodDuration);
      if (i === Number(currentSetup.lunchAt)) {
        totalMinutes += Number(currentSetup.lunchDuration);
      }
    }

    let newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    const ampm = newHours >= 12 ? 'PM' : 'AM';
<<<<<<< HEAD
    newHours = newHours % 12 || 12;
    return `${newHours}:${newMins.toString().padStart(2, '0')} ${ampm}`;
  };

  // 🔥 Magic Fill Logic (Uses Dynamic Classes)
=======
    
    newHours = newHours % 12;
    newHours = newHours ? newHours : 12; // 0 ko 12 mein badle
    
    return `${newHours}:${newMins.toString().padStart(2, '0')} ${ampm}`;
  };

>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
  const startMagicGeneration = () => {
    if (!window.confirm(`Generate for ${selectedSession}?`)) return;
    const newGeneratedPeriods = [];
    for (let i = 1; i <= setup.total; i++) {
      let label = `P${i}`;
      let type = 'class';
      let periodInternalName = label; 
<<<<<<< HEAD
      let time = calculateTime(i, setup);
=======
      let time = calculateTime(i, setup); // 🔥 Ab time dynamic calculate hoga
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a

      if (i === Number(setup.lunchAt)) { 
        type = 'break'; 
        periodInternalName = 'LUNCH'; 
      } else if (i === Number(setup.offAt)) { 
        type = 'off'; 
        periodInternalName = 'OFF'; 
      }

<<<<<<< HEAD
      const updatedAssignments = { periodName: periodInternalName };
=======
      const updatedAssignments = {
        periodName: periodInternalName
      };
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a

      if (type === 'class') {
        let currentPeriodClasses = [...dynamicClasses]; 
        currentPeriodClasses.sort(() => Math.random() - 0.5);
        teachers.forEach((teacher) => {
<<<<<<< HEAD
          if (currentPeriodClasses.length > 0) { 
            updatedAssignments[teacher.id] = currentPeriodClasses.pop(); 
          } else { 
            updatedAssignments[teacher.id] = "FREE"; 
          }
=======
          if (currentPeriodClasses.length > 0) { updatedAssignments[teacher.id] = currentPeriodClasses.pop(); }
          else { updatedAssignments[teacher.id] = "FREE"; }
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
        });
      }

      newGeneratedPeriods.push({
        id: `period_${selectedSession.replace('-', '_')}_${i}`, 
        label, time, type, session: selectedSession, teacherAssignments: updatedAssignments
      });
    }
    setPeriods(newGeneratedPeriods);
    setIsEditing(true);
    setShowMagicModal(false);
  };

  const saveAll = async () => {
<<<<<<< HEAD
=======
    if (scrollContainerRef.current) { lastScrollPos.current = scrollContainerRef.current.scrollLeft; }
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
    setLoading(true);
    try {
      const batch = writeBatch(db);
      periods.forEach(p => {
        const ref = doc(db, "timetablePeriods", p.id);
        batch.set(ref, { ...p, session: selectedSession }, { merge: true });
      });
      await batch.commit();
      setIsEditing(false);
<<<<<<< HEAD
=======
      setTimeout(() => { if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = lastScrollPos.current; }, 50);
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
      alert(`Saved Successfully!`);
    } catch (err) { alert("Error: " + err.message); }
    finally { setLoading(false); }
  };

  const handleAssignmentChange = (periodId, teacherId, className) => {
<<<<<<< HEAD
    setPeriods(prev => prev.map(p => {
      if (p.id === periodId) {
        return { 
          ...p, 
          teacherAssignments: { ...(p.teacherAssignments || {}), [teacherId]: className } 
        };
=======
    if (scrollContainerRef.current) { lastScrollPos.current = scrollContainerRef.current.scrollLeft; }
    setPeriods(prev => prev.map(p => {
      if (p.id === periodId) {
        const updatedAssignments = { 
          ...(p.teacherAssignments || {}), 
          [teacherId]: className
        };
        return { ...p, teacherAssignments: updatedAssignments };
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
      }
      return p;
    }));
    if(!isEditing) setIsEditing(true);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white flex-col gap-4 italic uppercase tracking-widest"><RefreshCw className="animate-spin text-indigo-500" size={40} /> Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 printable-area text-slate-800">
      
<<<<<<< HEAD
      {/* --- Magic Modal --- */}
=======
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          #print-area { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            transform: none !important; 
            box-shadow: none !important; 
            border: none !important; 
          }
          .no-print { display: none !important; }
          
          table { width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; }
          th, td { 
            padding: 8px 4px !important; 
            border: 0.5px solid #000 !important; 
          }
          
          .teacher-name { font-size: 12px !important; font-weight: 900 !important; }
          .teacher-sub { font-size: 9px !important; }
          .period-label { font-size: 12px !important; }
          .period-time { font-size: 9px !important; }
          
          .sticky { position: static !important; }
          .overflow-x-auto { overflow: visible !important; width: 100% !important; }
        }
      `}} />

>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
      {showMagicModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 no-print">
          <div className="bg-white p-6 max-w-md w-full shadow-2xl rounded-3xl">
            <h2 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
<<<<<<< HEAD
              <Timer className="text-indigo-600" /> Master Setup
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Start Time</label>
                  <input type="time" value={setup.startTime} onChange={(e) => setSetup({...setup, startTime: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold border border-slate-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Periods</label>
                  <input type="number" value={setup.total} onChange={(e) => setSetup({...setup, total: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold border border-slate-100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-indigo-400 uppercase">Period (Min)</label>
                  <input type="number" value={setup.periodDuration} onChange={(e) => setSetup({...setup, periodDuration: e.target.value})} className="w-full p-3 bg-indigo-50/50 rounded-xl font-bold text-indigo-700 border border-indigo-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-orange-400 uppercase">Lunch (Min)</label>
                  <input type="number" value={setup.lunchDuration} onChange={(e) => setSetup({...setup, lunchDuration: e.target.value})} className="w-full p-3 bg-orange-50/50 rounded-xl font-bold text-orange-700 border border-orange-100" />
                </div>
              </div>
            </div>
=======
              <Timer className="text-indigo-600" /> Setup Timetable
            </h2>
            <div className="space-y-4">
              {/* Row 1: Start Time & Total */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Start Time</label>
                  <input type="time" value={setup.startTime} onChange={(e) => setSetup({...setup, startTime: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none border border-slate-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Total Periods</label>
                  <input type="number" value={setup.total} onChange={(e) => setSetup({...setup, total: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none border border-slate-100" />
                </div>
              </div>

              {/* Row 2: Durations */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-indigo-400 uppercase ml-1">Period (Min)</label>
                  <input type="number" value={setup.periodDuration} onChange={(e) => setSetup({...setup, periodDuration: e.target.value})} className="w-full p-3 bg-indigo-50/50 rounded-xl font-bold outline-none text-indigo-700 border border-indigo-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-orange-400 uppercase ml-1">Lunch (Min)</label>
                  <input type="number" value={setup.lunchDuration} onChange={(e) => setSetup({...setup, lunchDuration: e.target.value})} className="w-full p-3 bg-orange-50/50 rounded-xl font-bold outline-none text-orange-700 border border-orange-100" />
                </div>
              </div>

              {/* Row 3: Lunch/Off Position */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Lunch At (P#)</label>
                   <input type="number" value={setup.lunchAt} onChange={(e) => setSetup({...setup, lunchAt: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none border border-slate-100 text-orange-700" />
                </div>
                <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Off At (P#)</label>
                   <input type="number" value={setup.offAt} onChange={(e) => setSetup({...setup, offAt: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none border border-slate-100 text-red-700" />
                </div>
              </div>
            </div>

>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowMagicModal(false)} className="flex-1 py-3 font-black text-xs uppercase text-slate-400">Cancel</button>
              <button onClick={startMagicGeneration} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-indigo-200">Magic Fill</button>
            </div>
          </div>
        </div>
      )}

<<<<<<< HEAD
      {/* --- Main Board --- */}
      <div id="print-area" className="w-full mx-auto bg-white shadow-2xl overflow-hidden border border-slate-200">
=======
      <div id="print-area" className="w-full mx-auto bg-white shadow-2xl  overflow-hidden border border-slate-200">
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
        <div className="bg-slate-900 p-5 flex justify-between items-center no-print">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg"><Clock size={24}/></div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays size={14} className="text-indigo-400"/>
<<<<<<< HEAD
                <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="bg-transparent text-indigo-400 font-black text-[11px] uppercase outline-none">
                  <option value="2025-26">2025-26</option>
                  <option value="2026-27">2026-27</option>
                </select>
              </div>
              <h1 className="text-white font-black text-lg tracking-widest uppercase leading-none">Teacher Master Schedule</h1>
=======
                <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="bg-transparent text-indigo-400 font-black text-[11px] uppercase outline-none cursor-pointer">
                  <option value="2024-25" className="text-slate-900">2024-25</option>
                  <option value="2025-26" className="text-slate-900">2025-26</option>
                  <option value="2026-27" className="text-slate-900">2026-27</option>
                </select>
              </div>
              <h1 className="text-white font-black text-lg tracking-widest uppercase leading-none">Master Schedule</h1>
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
            </div>
          </div>

          <div className="flex gap-3">
            {!isEditing ? (
              <>
                <button onClick={() => setShowMagicModal(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg"><Sparkles size={16}/> Magic Setup</button>
                <button onClick={() => window.print()} className="bg-white/10 text-white px-5 py-2.5 rounded-2xl font-black text-xs border border-white/20 flex items-center gap-2"><Printer size={16}/> Print</button>
              </>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => window.location.reload()} className="bg-slate-700 text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase">Discard</button>
                <button onClick={saveAll} className="bg-emerald-500 text-white px-8 py-2.5 rounded-2xl font-black text-xs uppercase shadow-lg flex items-center gap-2"><Save size={16}/> Save Master Data</button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto" ref={scrollContainerRef}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                <th className="p-5 border sticky left-0 bg-slate-50 z-20 w-[240px] text-left">
                  <span className="text-[10px] font-black uppercase text-slate-400 italic">Faculty ({teachers.length})</span>
                </th>
                {periods.map((p) => (
<<<<<<< HEAD
                  <th key={p.id} className="p-4 border min-w-[150px]">
                    <div className="flex flex-col items-center">
                      <span className="font-black text-[14px] uppercase text-slate-800 leading-none">{p.label}</span>
=======
                  <th key={p.id} className={`p-4 border min-w-[150px] ${p.type === 'break' ? 'bg-orange-50/50' : p.type === 'off' ? 'bg-red-50/50' : ''}`}>
                    <div className="flex flex-col items-center">
                      <span className="font-black text-[14px] uppercase text-slate-800 leading-none">
                        {p.label}
                      </span>
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
                      <span className="text-[10px] font-bold text-indigo-500 mt-1">{p.time}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className="hover:bg-indigo-50/20 border-b">
                  <td className="p-5 border sticky left-0 bg-white z-10 shadow-sm">
                    <p className="font-black text-[14px] text-slate-800 uppercase leading-none mb-1">{t.name}</p>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{t.subject}</p>
                  </td>
                  
                  {periods.map((p) => (
<<<<<<< HEAD
                    <td key={p.id} className={`p-4 border text-center ${p.type === 'break' ? 'bg-orange-50/30' : p.type === 'off' ? 'bg-red-50/30' : ''}`}>
=======
                    <td key={p.id} className={`p-4 border text-center transition-all ${p.type === 'break' ? 'bg-orange-50/30' : p.type === 'off' ? 'bg-red-50/30' : ''}`}>
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
                      {p.type === 'break' ? (
                        <span className="text-[11px] font-black text-orange-700 uppercase bg-orange-100 px-3 py-1.5 rounded-xl">LUNCH</span>
                      ) : p.type === 'off' ? (
                        <span className="text-[11px] font-black text-red-700 uppercase bg-red-100 px-3 py-1.5 rounded-xl">OFF</span>
                      ) : (
                        <select 
                          className={`w-full text-center text-[13px] font-black bg-transparent outline-none cursor-pointer ${p.teacherAssignments?.[t.id] && p.teacherAssignments[t.id] !== "FREE" ? 'text-indigo-700' : 'text-slate-300 italic'}`}
                          value={p.teacherAssignments?.[t.id] || ""}
                          onChange={(e) => handleAssignmentChange(p.id, t.id, e.target.value)}
                        >
                          <option value="">—</option>
                          <option value="FREE">FREE</option>
<<<<<<< HEAD
                          {/* 🔥 Dynamic Classes list from Firestore */}
=======
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
                          {dynamicClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
<<<<<<< HEAD
=======
      
      {!isEditing && (
        <div className="mt-6 flex justify-center no-print">
            <div className="bg-white px-6 py-3 rounded-full border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                    <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest">{teachers.length} Faculty Found</span>
                </div>
            </div>
        </div>
      )}
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
    </div>
  );
};

export default TimetablePro;