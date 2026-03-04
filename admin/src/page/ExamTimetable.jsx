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
  const [selectedExam, setSelectedExam] = useState("Half-Yearly"); 
  const [selectedSession, setSelectedSession] = useState("2025-26");
  
  const [masterMapping, setMasterMapping] = useState({}); 
  const [dynamicSubjects, setDynamicSubjects] = useState([]); 
  const [availableClasses, setAvailableClasses] = useState([]); 

  // 🔥 Priority Order: Isse hi sequence banega
  const classOrder = [
    "Nursery", "LKG", "UKG", 
    "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", 
    "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"
  ];

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

  // 1. FETCH CLASSES & MASTER MAPPING
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

  // 2. FETCH EXAM DATA (CLASS & TYPE SPECIFIC)
  useEffect(() => {
    const fetchClassExams = async () => {
      setFetching(true);
      try {
        const docRef = doc(db, "Timetables", selectedClass);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data()[selectedExam]) {
          const examData = docSnap.data()[selectedExam];
          setExams(examData.sort((a, b) => new Date(a.date) - new Date(b.date)));
        } else {
          setExams([]);
        }
      } catch (err) { console.error(err); }
      setFetching(false);
    };

    fetchClassExams();
    const subjectsForThisClass = masterMapping[selectedClass] || [];
    setDynamicSubjects(subjectsForThisClass);
    setFormData(prev => ({ ...prev, subject: subjectsForThisClass[0] || '', isHoliday: false }));
  }, [selectedClass, selectedExam, masterMapping]);

  // 3. AUTO DAY & DATE LOGIC
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
    if(!formData.date) return alert("Date select karo!");
    const finalTime = formData.isHoliday ? "---" : `${formData.startTime} - ${formData.endTime}`;
    const newEntry = { ...formData, subject: formData.isHoliday ? "OFF / GAP" : formData.subject, time: finalTime, id: Date.now() };
    const updatedExams = [...exams, newEntry].sort((a, b) => new Date(a.date) - new Date(b.date));
    setExams(updatedExams);
    
    const currentDate = new Date(formData.date);
    currentDate.setDate(currentDate.getDate() + 1);
    setFormData({ ...formData, date: currentDate.toISOString().split('T')[0], isHoliday: false });
  };

  const saveToDatabase = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "Timetables", selectedClass);
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamTimetable;