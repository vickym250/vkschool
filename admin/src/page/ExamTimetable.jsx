import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { 
  doc, setDoc, getDoc, onSnapshot, collection, 
  query, where, getDocs, writeBatch 
} from "firebase/firestore"; 

const ExamTimetable = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedClass, setSelectedClass] = useState("Class 1"); 
<<<<<<< HEAD
  const [selectedExam, setSelectedExam] = useState("Half-Yearly"); 
  const [selectedSession, setSelectedSession] = useState("2025-26");
=======
  // 🔥 New State for Exam Type
  const [selectedExam, setSelectedExam] = useState("Half-Yearly"); 
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
  
  const [masterMapping, setMasterMapping] = useState({}); 
  const [dynamicSubjects, setDynamicSubjects] = useState([]); 
  const [availableClasses, setAvailableClasses] = useState([]); 

<<<<<<< HEAD
  // 🔥 Priority Order: Isse hi sequence banega
  const classOrder = [
    "Nursery", "LKG", "UKG", 
    "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", 
    "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"
  ];

=======
  const availableClasses = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
  // 🔥 Exam Types
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
  const examTypes = ["Quarterly", "Half-Yearly", "Annual", "Pre-Board"];

  const [formData, setFormData] = useState({ 
    date: '', 
    day: '', 
    startTime: '09:00', 
    endTime: '12:00', 
    subject: '',
    isHoliday: false 
  });

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

<<<<<<< HEAD
  // 1. FETCH CLASSES & MASTER MAPPING
=======
  // 1. FETCH MASTER SUBJECT MAPPING
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
  useEffect(() => {
    const unsubClasses = onSnapshot(collection(db, "classes"), (snapshot) => {
      // 🔥 FIX: data ko trim kar rahe hain taaki "UKG " (space) jaisi galti na ho
      const classData = snapshot.docs.map(d => (d.data().name || d.data().className || "").trim());
      
      // 🔥 FIX: Sorting logic ko improve kiya taaki unknown classes end mein aayein
      const sortedClasses = classData.sort((a, b) => {
        const indexA = classOrder.indexOf(a);
        const indexB = classOrder.indexOf(b);
        
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });

      setAvailableClasses(sortedClasses);
      // Agar list mein UKG hai par selected nahi hai, toh debug ke liye use list mein check karein
    });

    const unsubMapping = onSnapshot(doc(db, "school_config", "master_data"), (docSnap) => {
      if (docSnap.exists()) setMasterMapping(docSnap.data().mapping || {});
    });

    return () => { unsubClasses(); unsubMapping(); };
  }, []);

<<<<<<< HEAD
  // 2. FETCH EXAM DATA (CLASS & TYPE SPECIFIC)
=======
  // 2. FETCH CLASS & EXAM SPECIFIC DATA
  // Ab ye selectedClass ya selectedExam badalne par fetch karega
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
  useEffect(() => {
    const fetchClassExams = async () => {
      setFetching(true);
      try {
        // Path change: Timetables -> Class -> Exams -> ExamType
        const docRef = doc(db, "Timetables", selectedClass);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data()[selectedExam]) {
          const examData = docSnap.data()[selectedExam];
<<<<<<< HEAD
          setExams(examData.sort((a, b) => new Date(a.date) - new Date(b.date)));
=======
          const sortedExams = examData.sort((a, b) => new Date(a.date) - new Date(b.date));
          setExams(sortedExams);
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
        } else {
          setExams([]); // Agar us exam type ka data nahi hai to khali kar do
        }
      } catch (err) { console.error(err); }
      setFetching(false);
    };

    fetchClassExams();
    const subjectsForThisClass = masterMapping[selectedClass] || [];
    setDynamicSubjects(subjectsForThisClass);
    setFormData(prev => ({ ...prev, subject: subjectsForThisClass[0] || '', isHoliday: false }));
  }, [selectedClass, selectedExam, masterMapping]);

<<<<<<< HEAD
  // 3. AUTO DAY & DATE LOGIC
=======
  }, [selectedClass, selectedExam, masterMapping]);

>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
  useEffect(() => {
    if (formData.date) {
      const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date(formData.date));
      setFormData(prev => ({ ...prev, day: dayName }));
    }
  }, [formData.date]);

  // 4. 🔥 SYNC GLOBAL ROLL NUMBERS (1-1000 Logic)
  const syncGlobalRollNumbers = async () => {
    const confirm = window.confirm("Bhai, kya aap pure school ke bacchon ka Roll Number 1 se start karke save karna chahte hain?");
    if (!confirm) return;

    setLoading(true);
    try {
      const q = query(collection(db, "students"), where("session", "==", selectedSession));
      const snap = await getDocs(q);
      let allStudents = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => !s.deletedAt);

      allStudents.sort((a, b) => {
        const indexA = classOrder.indexOf((a.className || "").trim());
        const indexB = classOrder.indexOf((b.className || "").trim());
        if (indexA !== indexB) return indexA - indexB;
        return a.name.localeCompare(b.name);
      });

      const batch = writeBatch(db);
      allStudents.forEach((stu, index) => {
        const docRef = doc(db, "students", stu.id);
        batch.update(docRef, { examRollNo: index + 1 });
      });

      await batch.commit();
      alert(`✅ Done! ${allStudents.length} bacchon ka sequence set ho gaya.`);
    } catch (err) { alert("Error syncing!"); }
    setLoading(false);
  };

  const addToList = (e) => {
    e.preventDefault();
<<<<<<< HEAD
    if(!formData.date) return alert("Date select karo!");
=======
    if(!formData.date) return alert("Bhai, Date select karo!");
    if(!formData.isHoliday && !formData.subject) return alert("Subject select karo!");
    
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
    const finalTime = formData.isHoliday ? "---" : `${formData.startTime} - ${formData.endTime}`;
    const newEntry = { ...formData, subject: formData.isHoliday ? "OFF / GAP" : formData.subject, time: finalTime, id: Date.now() };
    const updatedExams = [...exams, newEntry].sort((a, b) => new Date(a.date) - new Date(b.date));
    setExams(updatedExams);
<<<<<<< HEAD
    
    const currentDate = new Date(formData.date);
    currentDate.setDate(currentDate.getDate() + 1);
    setFormData({ ...formData, date: currentDate.toISOString().split('T')[0], isHoliday: false });
=======

    const currentDate = new Date(formData.date);
    currentDate.setDate(currentDate.getDate() + 1);
    const nextDateStr = currentDate.toISOString().split('T')[0];

    setFormData({ ...formData, date: nextDateStr, isHoliday: false });
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
  };

  const saveToDatabase = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "Timetables", selectedClass);
<<<<<<< HEAD
      await setDoc(docRef, { [selectedExam]: exams }, { merge: true });
      alert(`✅ Saved for ${selectedClass}!`);
    } catch (e) { alert("Error!"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10 text-slate-800">
      {fetching && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-md font-bold text-indigo-600 animate-pulse uppercase">Fetching...</div>}

      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-8 flex flex-col md:flex-row justify-between items-center gap-4 no-print border border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-indigo-900 uppercase italic">Exam Planner Pro</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master 1-1000 Series Sync</p>
          </div>
          
          <div className="flex flex-wrap gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <button onClick={syncGlobalRollNumbers} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-emerald-700">
              🔄 Sync Global Rolls
            </button>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="p-2 rounded-xl font-bold bg-white text-indigo-600 outline-none text-xs border">
              {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
            <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} className="p-2 rounded-xl font-bold bg-white text-violet-600 outline-none text-xs border">
              {examTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
=======
      // Data ko exam type ke field ke andar save kar rahe hain
      await setDoc(docRef, { [selectedExam]: exams }, { merge: true });
      alert(`✅ ${selectedClass} - ${selectedExam} Timetable Synced!`);
    } catch (e) {
      alert("Error saving!");
    } finally {
      setLoading(false);
    }
  };

  const removeEntry = (id) => {
    setExams(exams.filter(exam => exam.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10 font-sans text-slate-800">
      {fetching && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 font-bold text-indigo-900 animate-pulse uppercase tracking-widest text-xs">Fetching {selectedExam} for {selectedClass}...</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="no-print flex flex-col lg:flex-row justify-between items-center mb-8 gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent uppercase tracking-tight">Exam Planner</h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide">Manage Timetables for all Exam Types</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            {/* Class Dropdown */}
            <div className="flex items-center gap-2">
                <span className="pl-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class</span>
                <select 
                className="p-3 border-none bg-white rounded-xl font-bold text-indigo-600 shadow-sm outline-none cursor-pointer"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                >
                {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                </select>
            </div>

            {/* 🔥 Exam Type Dropdown */}
            <div className="flex items-center gap-2 border-l pl-4 border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exam Type</span>
                <select 
                className="p-3 border-none bg-white rounded-xl font-bold text-violet-600 shadow-sm outline-none cursor-pointer"
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                >
                {examTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
            </div>
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
<<<<<<< HEAD
          <div className="no-print lg:col-span-4 bg-white p-6 rounded-[2rem] shadow-xl border border-indigo-50 h-fit">
            <h3 className="text-xs font-black mb-6 text-indigo-900 uppercase">Entry Form</h3>
            <form onSubmit={addToList} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
                <input type="date" className="w-full p-4 rounded-2xl bg-slate-50 font-bold border-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="flex items-center gap-3 bg-red-50 p-4 rounded-2xl border border-red-100">
                <input type="checkbox" id="isHoliday" className="w-4 h-4 accent-red-600" checked={formData.isHoliday} onChange={(e) => setFormData({...formData, isHoliday: e.target.checked})} />
                <label htmlFor="isHoliday" className="text-xs font-bold text-red-700 uppercase">Holiday / Gap</label>
              </div>
              {!formData.isHoliday && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="time" className="p-3 rounded-xl bg-slate-50 font-bold" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                    <input type="time" className="p-3 rounded-xl bg-slate-50 font-bold" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                  </div>
                  <select className="w-full p-4 rounded-2xl bg-slate-50 font-bold outline-none" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}>
                    {dynamicSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </>
              )}
              <button type="submit" className="w-full p-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Add Entry</button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
             <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-slate-900 uppercase underline decoration-indigo-500 decoration-4 underline-offset-8">{selectedExam}</h2>
                <p className="text-sm font-bold text-slate-400 mt-2 uppercase">{selectedClass} | {selectedSession}</p>
             </div>
             
             {exams.length > 0 ? (
               <div className="overflow-hidden rounded-3xl border border-slate-100">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50">
                     <tr className="text-[10px] text-slate-400 uppercase">
                       <th className="p-5 font-bold">Date & Day</th>
                       <th className="p-5 font-bold">Subject</th>
                       <th className="p-5 font-bold">Timing</th>
                       <th className="no-print p-5 font-bold text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y">
                     {exams.map((item) => (
                       <tr key={item.id} className={item.isHoliday ? 'bg-red-50/50' : ''}>
                         <td className="p-5">
                            <div className="font-bold text-indigo-600">{formatDateDisplay(item.date)}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">{item.day}</div>
                         </td>
                         <td className="p-5 font-black uppercase text-slate-700">{item.subject}</td>
                         <td className="p-5 font-bold text-xs text-slate-500">{item.time}</td>
                         <td className="no-print p-5 text-right">
                            <button onClick={() => setExams(exams.filter(x => x.id !== item.id))} className="text-red-400 font-black text-[10px]">DELETE</button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             ) : (
               <div className="text-center py-20 text-slate-300 font-bold uppercase text-xs tracking-widest">No datesheet found</div>
             )}

             <div className="no-print mt-8 flex flex-col sm:flex-row gap-4">
               <button onClick={saveToDatabase} disabled={loading} className="flex-1 bg-emerald-500 text-white py-5 rounded-2xl font-black shadow-lg uppercase">
                 {loading ? "SAVING..." : `💾 Sync ${selectedExam}`}
               </button>
               <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-5 rounded-2xl font-black shadow-lg uppercase">🖨️ Print Sheet</button>
             </div>
=======
          {/* Form Section */}
          <div className="no-print lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-indigo-50">
              <h3 className="text-lg font-bold mb-6 text-indigo-900 uppercase flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-600 rounded-full"></span> {selectedExam} Entry
              </h3>
              
              <form onSubmit={addToList} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase ml-1 mb-2">Date</label>
                  <input type="date" className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>

                <div className="flex items-center gap-3 bg-red-50 p-4 rounded-2xl border border-red-100">
                  <input type="checkbox" id="isHoliday" className="w-5 h-5 accent-red-600" checked={formData.isHoliday} onChange={(e) => setFormData({...formData, isHoliday: e.target.checked})} />
                  <label htmlFor="isHoliday" className="text-sm font-bold text-red-700 uppercase tracking-tight">Holiday / Gap</label>
                </div>
                
                {!formData.isHoliday && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-2">Start Time</label>
                        <input type="time" className="w-full p-3 rounded-xl bg-slate-50 border-none font-bold" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-2">End Time</label>
                        <input type="time" className="w-full p-3 rounded-xl bg-slate-50 border-none font-bold" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase ml-1 mb-2">Subject</label>
                      <select className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}>
                          {dynamicSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                      </select>
                    </div>
                  </>
                )}

                <button type="submit" className={`w-full p-5 rounded-2xl font-bold shadow-lg text-white uppercase tracking-widest text-sm ${formData.isHoliday ? 'bg-red-600' : 'bg-indigo-600'}`}>
                  Add to {selectedExam}
                </button>
              </form>
            </div>
          </div>

          {/* Table Section */}
          <div className="lg:col-span-8">
            <div id="print-area" className="bg-white p-4 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 min-h-[500px]">
                <div className="hidden print:block text-center mb-8">
                    <h1 className="text-4xl font-black text-slate-900 uppercase">Examination Date Sheet</h1>
                    {/* Header showing Exam Type */}
                    <p className="text-xl font-bold text-slate-600 underline decoration-indigo-500 decoration-4">
                        {selectedClass} | {selectedExam} | Session 2025-26
                    </p>
                </div>

                <div className="mb-4 no-print flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">Live Preview: {selectedExam}</span>
                </div>

                {exams.length > 0 ? (
                  <div className="overflow-x-auto rounded-3xl border border-slate-100">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-5 font-bold text-[10px] text-slate-400 uppercase">Date & Day</th>
                          <th className="p-5 font-bold text-[10px] text-slate-400 uppercase">Subject</th>
                          <th className="p-5 font-bold text-[10px] text-slate-400 uppercase">Timing</th>
                          <th className="no-print p-5 font-bold text-[10px] text-slate-400 uppercase text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {exams.map((item) => (
                          <tr key={item.id} className={`group transition-colors ${item.isHoliday ? 'bg-red-50/50 holiday-row' : 'hover:bg-slate-50/50'}`}>
                            <td className="p-5">
                              <div className={`font-bold ${item.isHoliday ? 'text-red-600' : 'text-indigo-600'}`}>{formatDateDisplay(item.date)}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase">{item.day}</div>
                            </td>
                            <td className="p-5 font-black uppercase text-slate-700">{item.subject}</td>
                            <td className={`p-5 font-bold italic text-sm ${item.isHoliday ? 'text-red-300' : 'text-slate-500'}`}>{item.time}</td>
                            <td className="no-print p-5 text-right">
                              <button onClick={() => removeEntry(item.id)} className="text-red-400 hover:text-red-600 font-bold text-[10px]">DELETE</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                    <div className="text-6xl mb-4 opacity-20">🗓️</div>
                    <p className="font-black uppercase text-xs tracking-widest">No {selectedExam} Schedule Found</p>
                  </div>
                )}
            </div>

            <div className="no-print mt-8 flex flex-col sm:flex-row gap-4">
              <button onClick={saveToDatabase} disabled={loading} className="flex-1 bg-emerald-500 text-white py-5 rounded-2xl font-black shadow-lg uppercase tracking-widest">
                {loading ? "SAVING..." : `💾 SYNC ${selectedExam.toUpperCase()} DATA`}
              </button>
              <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black shadow-lg uppercase tracking-widest">
                🖨️ PRINT DATE SHEET
              </button>
            </div>
>>>>>>> a86c5b55597f50df9bd3a08d2b0769b9cf33db0a
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamTimetable;