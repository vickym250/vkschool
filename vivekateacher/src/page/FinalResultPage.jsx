import React, { useState, useEffect } from "react";
import { db } from "../firebase"; 
import { 
  collection, getDocs, query, where, serverTimestamp,
  doc, updateDoc, onSnapshot, getDoc, runTransaction 
} from "firebase/firestore";
import { toast, Toaster } from "react-hot-toast";
import { Trophy, Search, Plus, X, Edit3, Save, ArrowLeft, Zap, Calendar, Hash, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const examTypes = ["Quarterly", "Half-Yearly", "Annual"];
const sessionsList = ["2024-25", "2025-26", "2026-27", "2027-28"]; // Session List Updated

const sortClasses = (classes) => {
  const order = ["LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
  return classes.sort((a, b) => order.indexOf(a) - order.indexOf(b));
};

export default function MobileFinalResult() {
  const navigate = useNavigate();
  const [session, setSession] = useState("2025-26"); 
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [classesList, setClassesList] = useState([]);
  const [dynamicSubjectMaster, setDynamicSubjectMaster] = useState({});
  const [allStudents, setAllStudents] = useState([]); 
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [cls, setCls] = useState(""); 
  const [exam, setExam] = useState("Annual");
  const [rows, setRows] = useState([]);
  const [resultList, setResultList] = useState([]);
  const [masterMax, setMasterMax] = useState("100");
  const [minRand, setMinRand] = useState(33);
  const [maxRand, setMaxRand] = useState(90);

  // 1. Fetch Master Config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, "school_config", "master_data");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const mapping = docSnap.data().mapping;
          const sortedCls = sortClasses(Object.keys(mapping));
          setDynamicSubjectMaster(mapping);
          setClassesList(sortedCls);
          if (!cls) setCls(sortedCls[0]); 
        }
      } catch (err) { toast.error("Config fail!"); }
    };
    fetchConfig();
  }, []);

  // 2. Real-time Results Listener (Filters updated for Admin sync)
  useEffect(() => {
    if (!cls) return;
    const q = query(
      collection(db, "examResults"), 
      where("className", "==", cls), 
      where("exam", "==", exam),
      where("session", "==", session),
      where("delete_at", "==", null) // Admin ke sath sync rahega
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setResultList(list.sort((a, b) => (parseInt(a.examRollNo) || 0) - (parseInt(b.examRollNo) || 0)));
    });
    return () => unsub();
  }, [cls, exam, session]);

  // 3. Fetch Students Logic
  useEffect(() => {
    if (!cls) return;
    const fetchStudents = async () => {
      const q = query(collection(db, "students"), where("className", "==", cls), where("session", "==", session));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => !s.deletedAt); 
      setAllStudents(list.sort((a, b) => (parseInt(a.examRollNo) || 0) - (parseInt(b.examRollNo) || 0)));
    };
    fetchStudents();
    if (!editingId && dynamicSubjectMaster[cls]) {
      setRows(dynamicSubjectMaster[cls].map(sub => ({ subject: sub, total: masterMax, marks: "" })));
    }
  }, [cls, editingId, masterMax, session, dynamicSubjectMaster]);

  const saveResult = async () => {
    if (!selectedStudent) return toast.error("Student select karein!");
    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        let finalSrNo = editingId ? (resultList.find(r => r.id === editingId)?.srNo) : null;

        if (!editingId) {
          const counterId = `counter_${cls}_${exam}_${session}`.replace(/\s+/g, "");
          const counterRef = doc(db, "counters", counterId);
          const counterSnap = await transaction.get(counterRef);

          if (!counterSnap.exists()) {
            finalSrNo = 1;
            transaction.set(counterRef, { current: 1 });
          } else {
            finalSrNo = counterSnap.data().current + 1;
            transaction.update(counterRef, { current: finalSrNo });
          }
        }

        const resDocRef = editingId ? doc(db, "examResults", editingId) : doc(collection(db, "examResults"));
        
        const payload = {
          className: cls, exam, session,
          fatherName: selectedStudent.fatherName || "",
          name: selectedStudent.name || "",
          photoURL: selectedStudent.photoURL || "",
          examRollNo: selectedStudent.examRollNo || "", // Admin sync field
          roll: selectedStudent.examRollNo || "",       // Old sync field
          rows: rows.filter(r => r.subject && r.marks !== ""),
          studentId: selectedStudent.id,
          updatedAt: serverTimestamp(),
          srNo: finalSrNo,
          delete_at: null // ADMIN ME DIKHNE KE LIYE
        };

        if (editingId) transaction.update(resDocRef, payload);
        else {
          payload.createdAt = serverTimestamp();
          transaction.set(resDocRef, payload);
        }
      });

      setShowForm(false);
      toast.success("Result Published Successfully! 🎉");
    } catch (error) { toast.error("Save failed!"); console.error(error); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      <Toaster position="top-center" />
      
      {/* MOBILE HEADER WITH SESSION PICKER */}
      <div className="sticky top-0 z-40 bg-white px-4 py-4 flex flex-col border-b border-slate-100 shadow-sm gap-3">
        <div className="flex items-center justify-between">
            <button onClick={() => navigate("/")} className="p-2 bg-slate-50 rounded-full text-slate-600 active:scale-90 transition-transform"><ArrowLeft size={20}/></button>
            <div className="text-center">
                <h1 className="text-xs font-black uppercase tracking-widest text-slate-800 leading-none">Result Manager</h1>
                <p className="text-[10px] font-bold text-indigo-600 mt-1 uppercase italic">{cls} • {exam}</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100"><Trophy size={18} className="text-amber-500"/></div>
        </div>

        {/* SESSION PICKER BAR */}
        <div className="flex items-center gap-2 bg-indigo-50/50 p-2 rounded-2xl border border-indigo-100">
            <Calendar size={14} className="text-indigo-600 ml-2"/>
            <span className="text-[9px] font-black text-indigo-400 uppercase">Session:</span>
            <select value={session} onChange={(e) => setSession(e.target.value)} className="bg-transparent border-none text-xs font-black text-indigo-700 outline-none flex-1">
                {sessionsList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* CLASS SELECTOR */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {classesList.map(c => (
            <button key={c} onClick={() => setCls(c)} className={`px-5 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap border ${cls === c ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}>{c}</button>
          ))}
        </div>

        {/* EXAM TABS */}
        <div className="flex gap-1 bg-slate-200/50 p-1 rounded-2xl shadow-inner">
          {examTypes.map(e => (
            <button key={e} onClick={() => setExam(e)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${exam === e ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{e}</button>
          ))}
        </div>

        {/* DATA LIST */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center px-1">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Records Found ({resultList.length})</p>
          </div>
          {resultList.map((item, index) => (
            <div key={item.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-300 text-xs">{index + 1}</div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm uppercase leading-tight">{item.name}</h3>
                  <p className="text-[9px] text-slate-400 font-black uppercase italic tracking-wider">Roll: {item.roll} • {item.exam}</p>
                </div>
              </div>
              <button onClick={() => { setEditingId(item.id); setSelectedStudent(item); setRows(item.rows); setShowForm(true); }} className="p-3 bg-slate-50 text-indigo-400 rounded-2xl"><Edit3 size={18}/></button>
            </div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => { setEditingId(null); setSelectedStudent(null); setStudentSearch(""); setShowForm(true); }} className="fixed bottom-6 right-6 bg-indigo-600 text-white w-16 h-16 rounded-[2.2rem] shadow-2xl flex items-center justify-center z-40 border-4 border-white"><Plus size={30} /></button>

      {/* ENTRY FORM */}
      {showForm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end">
          <div className="bg-[#F8FAFC] w-full h-[94vh] rounded-t-[3.5rem] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-8 pt-4 pb-6 bg-white border-b border-slate-50">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">Result Entry</h2>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{cls} • {session}</p>
                </div>
                <button onClick={() => setShowForm(false)} className="p-3 bg-slate-100 text-slate-400 rounded-full"><X size={20}/></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-32">
              {/* SEARCH STUDENT WITH DONE CHECK */}
              <div className="relative">
                <div className="flex items-center bg-white border border-slate-100 rounded-3xl px-5 py-4 shadow-sm">
                  <Search size={18} className="text-slate-400" />
                  <input type="text" placeholder="Select Candidate..." className="bg-transparent flex-1 ml-3 font-bold text-sm outline-none" value={studentSearch} onFocus={() => setIsSearchFocused(true)} onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} onChange={(e) => {setStudentSearch(e.target.value); setSelectedStudent(null);}} disabled={editingId} />
                </div>
                
                {isSearchFocused && !selectedStudent && !editingId && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 rounded-3xl mt-2 shadow-2xl z-50 max-h-52 overflow-y-auto no-scrollbar p-2">
                    {allStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).map(s => {
                      const isDone = resultList.some(res => res.studentId === s.id);
                      return (
                        <button key={s.id} onClick={() => { if(isDone) return toast.error("Already Done!"); setSelectedStudent(s); setStudentSearch(s.name); }} className={`w-full p-4 text-left rounded-2xl border-b border-slate-50 flex justify-between items-center ${isDone ? 'opacity-40 bg-green-50' : ''}`}>
                          <span className={`font-bold text-xs uppercase ${isDone ? 'text-green-700' : 'text-slate-700'}`}>{s.name}</span>
                          {isDone ? <CheckCircle2 size={16} className="text-green-600"/> : <span className="text-[10px] font-black text-indigo-500 italic">#{s.examRollNo}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* MARKS ENTRY (Same as your previous UI) */}
              {/* ... (Rows and Save Button) ... */}
              <div className="space-y-3">
                {rows.map((r, i) => (
                  <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-300 text-[10px]">{i + 1}</div>
                    <div className="flex-1">
                      <span className="font-black text-slate-700 uppercase text-[11px] block italic leading-tight">{r.subject}</span>
                      <span className="text-[8px] font-bold text-slate-300 uppercase italic">Max: {r.total}</span>
                    </div>
                    <input type="number" value={r.marks} onChange={(e) => { const n = [...rows]; n[i].marks = e.target.value; setRows(n); }} className="w-12 text-center font-black text-indigo-600 bg-slate-50 p-2 rounded-xl outline-none" placeholder="--" />
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t">
              <button onClick={saveResult} disabled={loading || !selectedStudent} className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase text-sm shadow-xl flex items-center justify-center gap-3">
                {loading ? "Saving..." : <><Save size={20}/> Publish Result</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
