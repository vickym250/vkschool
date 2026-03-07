import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { 
  collection, getDocs, query, where, serverTimestamp,
  doc, deleteDoc, getDoc, runTransaction
} from "firebase/firestore";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

/* ==========================================
   1. REPORT CARD MODAL (Updated with DOB & Address)
   ========================================== */
const ReportCardModal = ({ data, onClose }) => {
  const navigate = useNavigate();
  const [school, setSchool] = useState({
    name: "Sun Shine School",
    address: "Mahanua",
    affiliation: "UP BOARD",
    contact: "234565467",
    logoUrl: ""
  });

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const schoolSnap = await getDoc(doc(db, "settings", "schoolDetails"));
        if (schoolSnap.exists()) setSchool(schoolSnap.data());
      } catch (err) { console.error("School data fetch error:", err); }
    };
    fetchSchool();
  }, []);

  useEffect(() => {
    if (data?.exam === "Annual" && data?.studentId) {
      navigate(`/marksheet/${data.studentId}/${data.session}`, { replace: true });
    }
  }, [data, navigate]);

  if (!data || data.exam === "Annual") return null;

  const { rows } = data;
  const grandTotalObt = rows.reduce((s, r) => s + (Number(r.marks) || 0), 0);
  const grandTotalMax = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);
  const percent = grandTotalMax ? ((grandTotalObt / grandTotalMax) * 100).toFixed(2) : "0.00";
  const grade = Number(percent) >= 33 ? "PASS" : "FAIL";

  return (
    <div className="fixed inset-0 bg-black/90 z-[999] flex justify-center items-start overflow-y-auto p-2 md:p-10 text-slate-900 uppercase">
      <div id="printable-area" className="relative bg-white w-full max-w-[850px] border-[6px] md:border-[12px] border-double border-blue-900 p-4 md:p-10 font-serif shadow-2xl my-4 md:my-10">
        <div className="absolute -top-10 md:-top-14 right-0 flex gap-2 no-print">
          <button onClick={() => window.print()} className="px-5 py-2 bg-indigo-600 text-white text-xs font-black rounded-full shadow-xl">🖨️ PRINT</button>
          <button onClick={onClose} className="px-5 py-2 bg-white text-red-600 text-xs font-black rounded-full shadow-xl border border-red-100">CLOSE</button>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b-[3px] border-blue-900 pb-4 mb-6">
          <img src={school.logoUrl} alt="Logo" className="w-16 h-16 md:w-20 md:h-20 object-contain" />
          <div className="flex-1 px-4 text-center md:text-left">
            <p className="text-blue-800 font-bold text-[9px] uppercase tracking-[0.2em]">Affiliated to: {school.affiliation}</p>
            <h1 className="text-2xl md:text-3xl font-black uppercase text-blue-900 leading-tight">{school.name}</h1>
            <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">{school.address}</p>
          </div>
          <div className="mt-2 md:mt-0 md:text-right border-t md:border-t-0 md:border-l-2 border-blue-900 pl-4">
            <span className="block text-[9px] font-bold text-gray-400 uppercase">Sr. No: {data.srNo || '---'}</span>
            <span className="text-lg font-black text-blue-900 italic leading-none">{data.session}</span>
            <div className="mt-1 bg-blue-900 text-white text-[9px] px-2 py-0.5 rounded font-black">{data.exam}</div>
          </div>
        </div>

        {/* Student Info Section (Updated with DOB & Address) */}
        <div className="flex justify-between items-start gap-6 mb-6">
          <div className="flex-1 grid grid-cols-1 gap-y-1">
            {[
              { label: "STUDENT NAME", value: data.name, bold: true },
              { label: "EXAM ROLL NO", value: data.examRollNo },
              { label: "DATE OF BIRTH", value: data.dob || "N/A" }, // Naya Field
              { label: "CLASS", value: data.className },
              { label: "FATHER'S NAME", value: data.fatherName || "N/A" },
              { label: "MOTHER'S NAME", value: data.motherName || "N/A" },
              { label: "ADDRESS", value: data.address || "N/A" } // Naya Field
            ].map((item, idx) => (
              <div key={idx} className="flex border-b border-gray-100 py-1 items-center">
                <span className="w-32 font-bold text-blue-900 text-[10px] md:text-[12px] shrink-0">{item.label}:</span>
                <span className={`uppercase text-gray-800 text-[11px] ${item.bold ? 'font-black' : 'font-medium'}`}>{item.value}</span>
              </div>
            ))}
          </div>
          <div className="w-24 h-28 border-2 border-blue-900 p-0.5 shadow-sm">
            {data.photoURL ? <img src={data.photoURL} className="w-full h-full object-cover" alt="Student" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[8px]">PHOTO</div>}
          </div>
        </div>

        {/* Marks Table */}
        <table className="w-full border-collapse border-2 border-black text-[11px] md:text-[13px] mb-6">
          <thead>
            <tr className="bg-blue-900 text-white">
              <th className="border border-black p-1.5 w-10">S.N</th>
              <th className="border border-black p-1.5 text-left">SUBJECTS</th>
              <th className="border border-black p-1.5 w-16">MAX</th>
              <th className="border border-black p-1.5 w-16">OBT.</th>
              <th className="border border-black p-1.5 w-20">RESULT</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="even:bg-gray-50">
                <td className="border border-black p-1.5 text-center font-bold text-gray-400">{i + 1}</td>
                <td className="border border-black p-1.5 uppercase font-black text-blue-900">{r.subject}</td>
                <td className="border border-black p-1.5 text-center">{r.total}</td>
                <td className="border border-black p-1.5 text-center font-black text-base">{r.marks}</td>
                <td className="border border-black p-1.5 text-center font-bold text-[10px]">{Number(r.marks) >= (Number(r.total) * 0.33) ? "PASS" : "FAIL"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-blue-50 font-black border-t-2 border-black text-blue-900">
              <td colSpan="2" className="border border-black p-2 text-right">TOTAL MARKS:</td>
              <td className="border border-black p-2 text-center">{grandTotalMax}</td>
              <td className="border border-black p-2 text-center text-xl">{grandTotalObt}</td>
              <td className="border border-black p-2 text-center">{grade}</td>
            </tr>
          </tfoot>
        </table>

        {/* Result Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="border border-blue-900 rounded-lg p-2 text-center">
              <p className="text-[8px] text-gray-400 font-bold">Percentage</p>
              <p className="text-lg font-black text-blue-900">{percent}%</p>
            </div>
            <div className="border border-blue-900 rounded-lg p-2 text-center bg-blue-50/50">
              <p className="text-[8px] text-gray-400 font-bold">Grade</p>
              <p className="text-lg font-black text-blue-900">{percent >= 80 ? "A+" : percent >= 60 ? "A" : percent >= 45 ? "B" : "C"}</p>
            </div>
            <div className="border border-blue-900 rounded-lg p-2 text-center">
              <p className="text-[8px] text-gray-400 font-bold">Status</p>
              <p className={`text-lg font-black ${grade === "PASS" ? "text-green-600" : "text-red-600"}`}>{grade}</p>
            </div>
        </div>

        {/* Footer Signatures */}
        <div className="flex justify-between items-end mt-12 px-4">
          <div className="text-center"><div className="w-32 border-b border-gray-400 mb-1"></div><p className="text-[9px] font-black uppercase text-gray-400">Class Teacher</p></div>
          <div className="text-center"><div className="w-44 border-b-2 border-blue-900 mb-1"></div><p className="text-[9px] font-black uppercase text-blue-900">Principal Signature</p></div>
        </div>
      </div>
    </div>
  );
};

/* ==========================================
   2. MAIN DASHBOARD PAGE
   ========================================== */
export default function FinalResultPage() {
  const navigate = useNavigate();
  
  const [session, setSession] = useState("2025-26");
  const availableSessions = ["2024-25", "2025-26", "2026-27", "2027-28"];
  const [dashboardSearch, setDashboardSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  
  const [allStudents, setAllStudents] = useState([]); 
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [name, setName] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [cls, setCls] = useState(""); 
  const [exam, setExam] = useState("Annual");
  const [rows, setRows] = useState([{ subject: "", total: "100", marks: "" }]);
  
  const [resultList, setResultList] = useState([]);
  const [filterClass, setFilterClass] = useState("");
  const [filterExam, setFilterExam] = useState("Annual");

  const [subjectMaster, setSubjectMaster] = useState({});
  const [classesList, setClassesList] = useState([]);
  const examTypes = ["Quarterly", "Half-Yearly", "Annual"];
  const [showDropdown, setShowDropdown] = useState(false);

  // Magic Features
  const [globalMax, setGlobalMax] = useState("100");
  const [magicMin, setMagicMin] = useState("50");
  const [magicMax, setMagicMax] = useState("90");

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "school_config", "master_data"));
        if (docSnap.exists()) {
          const mapping = docSnap.data().mapping || {};
          setSubjectMaster(mapping);
          const sortedClasses = Object.keys(mapping).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
          setClassesList(sortedClasses);
          if (sortedClasses.length > 0) {
            setCls(sortedClasses[0]);
            setFilterClass(sortedClasses[0]);
          }
        }
      } catch (err) { console.error("Master data error:", err); }
    };
    fetchMasterData();
  }, []);

  const loadResults = async () => {
    const classToFetch = showForm ? cls : filterClass;
    const examToFetch = showForm ? exam : filterExam;
    if (!classToFetch) return;
    try {
      const q = query(
        collection(db, "examResults"), 
        where("className", "==", classToFetch), 
        where("exam", "==", examToFetch), 
        where("session", "==", session)
      );
      const snap = await getDocs(q);
      setResultList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error("Fetch Results Error:", err); }
  };

  useEffect(() => { if(!showForm) loadResults(); }, [filterClass, filterExam, session, showForm]);
  useEffect(() => { if(showForm) loadResults(); }, [exam, cls, session, showForm]);

  useEffect(() => {
    if (!cls) return;
    const fetchStudents = async () => {
      const q = query(collection(db, "students"), where("className", "==", cls), where("session", "==", session));
      const snap = await getDocs(q);
      setAllStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchStudents();
    if (!editingId && subjectMaster[cls]) {
      setRows(subjectMaster[cls].map(sub => ({ subject: sub, total: globalMax, marks: "" })));
    }
  }, [cls, subjectMaster, editingId, session]);

  const applyGlobalMax = (val) => {
    setGlobalMax(val);
    setRows(rows.map(r => ({ ...r, total: val })));
  };

  const magicFillMarks = () => {
    const min = parseInt(magicMin);
    const max = parseInt(magicMax);
    if (isNaN(min) || isNaN(max) || min > max) return toast.error("Check Min/Max Range!");
    setRows(rows.map(r => ({ ...r, marks: (Math.floor(Math.random() * (max - min + 1)) + min).toString() })));
    toast.success(`Magic Fill Applied!`);
  };

  const handlePrintAll = () => {
    if(filterExam === "Annual") {
        navigate(`/marksheet/${filterClass.replace(/\s+/g, '')}/${session}`);
    } else {
        toast.error("Bulk Print sirf Annual exam ke liye hai.");
    }
  };

  const handleRowChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  // --- SAVE RESULT (Updated to include DOB & Address) ---
  const saveResult = async () => {
    if (!selectedStudentId) return toast.error("Student select karo!");
    const isAlreadyDone = resultList.some(res => String(res.studentId) === String(selectedStudentId) && res.exam === exam && res.session === session);
    if (!editingId && isAlreadyDone) return toast.error("Result already exists!");

    setLoading(true);
    try {
      const student = allStudents.find(s => s.id === selectedStudentId);
      const cleanRows = rows.filter(r => r.subject.trim() !== "").map(r => ({
        subject: r.subject.trim(),
        total: Number(r.total) || 0,
        marks: Number(r.marks) || 0
      }));

      await runTransaction(db, async (transaction) => {
        let finalSrNo;
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

        const resultDocRef = editingId ? doc(db, "examResults", editingId) : doc(collection(db, "examResults"));
        
        // Payload with DOB and Address from Student collection
        const payload = {
          session, 
          studentId: selectedStudentId, 
          name: student?.name || name,
          className: cls, 
          examRollNo: student?.examRollNo || "",
          regNo: student?.regNo || "",
          fatherName: student?.fatherName || "", 
          motherName: student?.motherName || "",
          dob: student?.dob || "", // Fetching DOB from student data
          address: student?.address || "", // Fetching Address from student data
          photoURL: student?.photoURL || "", 
          exam, 
          rows: cleanRows, 
          updatedAt: serverTimestamp()
        };

        if (editingId) transaction.update(resultDocRef, payload);
        else {
          payload.srNo = finalSrNo;
          payload.createdAt = serverTimestamp();
          transaction.set(resultDocRef, payload);
        }
      });

      toast.success("Result Saved!");
      setShowForm(false); setEditingId(null); loadResults();
    } catch (e) { 
      console.error(e);
      toast.error("Save failed."); 
    } finally { setLoading(false); }
  };

  return (
    <div className="p-3 md:p-8 bg-slate-50 min-h-screen font-black italic text-slate-900 uppercase">
      <Toaster />
      {showModal && <ReportCardModal data={selectedResult} onClose={() => setShowModal(false)} />}
      
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white p-6 rounded-[24px] md:rounded-[32px] border shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 italic leading-none">Result Dashboard</h1>
            <div className="flex items-center gap-2 mt-2">
               <span className="text-[9px] text-slate-400">SESSION:</span>
               <select value={session} onChange={(e) => setSession(e.target.value)} className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black outline-none border-none">
                  {availableSessions.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrintAll} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-black text-xs shadow-md">🖨️ Print All</button>
            <button onClick={() => { setEditingId(null); setSelectedStudentId(""); setStudentSearch(""); setShowForm(true); }} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-xs shadow-md">+ Add Result</button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl border shadow-sm">
            <span className="text-[9px] text-slate-400">CLASS</span>
            <select className="w-full bg-transparent font-black outline-none italic" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
              {classesList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="bg-white p-4 rounded-2xl border shadow-sm">
            <span className="text-[9px] text-slate-400">EXAM</span>
            <select className="w-full bg-transparent font-black outline-none italic" value={filterExam} onChange={e => setFilterExam(e.target.value)}>
              {examTypes.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg text-white">
            <span className="text-[9px] text-indigo-200">SEARCH</span>
            <input type="text" placeholder="NAME / ROLL NO..." className="w-full bg-transparent text-white placeholder:text-indigo-300 font-black outline-none italic" value={dashboardSearch} onChange={(e) => setDashboardSearch(e.target.value)} />
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-[24px] border shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs italic">
            <thead className="bg-slate-50 border-b text-[9px] text-slate-400 uppercase">
              <tr>
                <th className="px-6 py-4">SR. NO</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4 text-center">Exam Roll</th>
                <th className="px-6 py-4 text-center">Exam</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-black">
              {resultList
                .filter(r => r.name.toLowerCase().includes(dashboardSearch.toLowerCase()) || (r.examRollNo && r.examRollNo.toString().includes(dashboardSearch)))
                .sort((a, b) => (parseInt(a.examRollNo) || 0) - (parseInt(b.examRollNo) || 0))
                .map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-indigo-600">{r.srNo || '-'}</td>
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border">
                      {r.photoURL ? <img src={r.photoURL} className="w-full h-full object-cover" alt="S" /> : <div className="w-full h-full bg-slate-100" />}
                    </div>
                    <div>
                      <p className="text-slate-800 text-sm leading-none uppercase">{r.name}</p>
                      <p className="text-[9px] text-slate-400 italic mt-1 font-bold">Reg: {r.regNo || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">{r.examRollNo}</td>
                  <td className="px-6 py-4 text-center text-indigo-600">{r.exam}</td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button onClick={() => { setEditingId(r.id); setSelectedStudentId(r.studentId); setStudentSearch(r.name); setCls(r.className); setExam(r.exam); setRows(r.rows); setShowForm(true); }} className="text-blue-600 border px-3 py-1 rounded-lg font-black text-[9px] hover:bg-blue-50">Edit</button>
                    <button onClick={() => {setSelectedResult(r); setShowModal(true);}} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-black text-[9px] hover:bg-indigo-700">View</button>
                    <button onClick={() => {if(window.confirm('Delete?')) deleteDoc(doc(db, "examResults", r.id)).then(loadResults)}} className="text-red-300 ml-1 hover:text-red-600">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Result Entry Form */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-2">
          <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[30px] shadow-2xl overflow-y-auto p-5 md:p-10 italic">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-lg font-black text-indigo-600 italic">Result Entry Form</h2>
              <button onClick={() => setShowForm(false)} className="bg-slate-100 p-2 px-4 rounded-full font-black">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block text-[9px]">CLASS</label>
                      <select className="w-full bg-slate-50 p-3 rounded-2xl font-black outline-none" value={cls} onChange={e => setCls(e.target.value)} disabled={editingId}>
                        {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block text-[9px]">EXAM</label>
                      <select className="w-full bg-slate-50 p-3 rounded-2xl font-black outline-none" value={exam} onChange={e => setExam(e.target.value)}>
                        {examTypes.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>
              </div>

              <div className="relative">
                <label className="text-slate-400 block text-[9px]">STUDENT SEARCH ({cls})</label>
                <input type="text" className="w-full bg-indigo-50/50 p-3 font-black border-2 border-indigo-100 rounded-2xl outline-none" value={studentSearch} onClick={() => setShowDropdown(true)} onChange={e => {setStudentSearch(e.target.value); setShowDropdown(true);}} disabled={editingId} />
                {showDropdown && !editingId && (
                  <div className="absolute left-0 w-full bg-white border-2 border-indigo-100 rounded-2xl z-20 max-h-56 overflow-y-auto shadow-xl mt-1">
                    {allStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || (s.examRollNo && s.examRollNo.toString().includes(studentSearch))).map(s => {
                       const isDone = resultList.some(res => String(res.studentId) === String(s.id) && res.exam === exam && res.session === session);
                       return (
                         <div key={s.id} onClick={() => { if(isDone) return toast.error("Already Done!"); setSelectedStudentId(s.id); setName(s.name); setStudentSearch(s.name); setShowDropdown(false); }} className={`p-3 cursor-pointer flex justify-between items-center hover:bg-indigo-600 hover:text-white ${isDone ? 'opacity-40 pointer-events-none bg-red-50' : ''}`}>
                           <div className="flex flex-col">
                             <span className="text-xs uppercase">{s.name}</span>
                             <span className="text-[8px] font-bold">EXAM ROLL: {s.examRollNo}</span>
                           </div>
                           {isDone && <span className="text-[7px] font-black">✓ DONE</span>}
                         </div>
                       );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Magic Fill Settings */}
            <div className="flex flex-wrap items-end gap-3 mb-4 bg-slate-50 p-4 rounded-3xl border border-dashed border-slate-200">
               <div className="w-24">
                  <label className="text-slate-400 block text-[7px] mb-1">ALL MAX</label>
                  <input type="number" className="w-full p-2 bg-white rounded-xl font-black outline-none border text-center text-xs" value={globalMax} onChange={(e) => applyGlobalMax(e.target.value)} />
               </div>
               <div className="w-20">
                  <label className="text-slate-400 block text-[7px] mb-1">MIN RANGE</label>
                  <input type="number" className="w-full p-2 bg-white rounded-xl font-black outline-none border text-center text-xs text-red-500" value={magicMin} onChange={(e) => setMagicMin(e.target.value)} />
               </div>
               <div className="w-20">
                  <label className="text-slate-400 block text-[7px] mb-1">MAX RANGE</label>
                  <input type="number" className="w-full p-2 bg-white rounded-xl font-black outline-none border text-center text-xs text-green-600" value={magicMax} onChange={(e) => setMagicMax(e.target.value)} />
               </div>
               <button onClick={magicFillMarks} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2 rounded-xl font-black text-[9px] shadow-lg hover:scale-105 transition-transform">✨ APPLY MAGIC FILL</button>
            </div>

            {/* Marks Table Entry */}
            <div className="rounded-[20px] border-2 border-slate-50 overflow-hidden bg-slate-50/20 mb-8">
              <table className="w-full text-xs font-black uppercase italic">
                <thead className="bg-slate-100 text-slate-400">
                  <tr><th className="p-3 text-left">Subject</th><th className="p-3 text-center w-20">Total</th><th className="p-3 text-center w-24 text-indigo-600">Obt.</th><th className="p-3 w-8"></th></tr>
                </thead>
                <tbody className="divide-y divide-white">
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td className="p-1"><input className="w-full p-2 bg-transparent outline-none font-black" value={r.subject} onChange={e => handleRowChange(i, 'subject', e.target.value)} /></td>
                      <td className="p-1"><input type="number" className="w-full p-2 bg-transparent outline-none text-center" value={r.total} onChange={e => handleRowChange(i, 'total', e.target.value)} /></td>
                      <td className="p-1"><input type="number" className="w-full p-2 bg-transparent outline-none text-center text-indigo-600 text-lg font-black" value={r.marks} onChange={e => handleRowChange(i, 'marks', e.target.value)} /></td>
                      <td className="p-1 text-center"><button onClick={() => setRows(rows.filter((_, idx) => idx !== i))} className="text-red-200 hover:text-red-600">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex gap-2">
              <button className="flex-1 bg-slate-100 py-4 rounded-2xl font-black shadow-sm" onClick={() => setShowForm(false)}>Close</button>
              <button disabled={loading} className="flex-[2] py-4 rounded-2xl bg-indigo-600 text-white font-black shadow-xl hover:bg-indigo-700" onClick={saveResult}>{loading ? 'WAIT...' : 'SAVE RESULT'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}