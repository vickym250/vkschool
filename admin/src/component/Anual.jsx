import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";

export default function MarksSheet() {
  const { studentId, session } = useParams();
  const [loading, setLoading] = useState(true);
  const [classResults, setClassResults] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [schoolInfo, setSchoolInfo] = useState({
    name: "SUNSHINE ENGLISH MEDIUM SCHOOL",
    address: "Mannijot, Bhanwapur Road, Siddharthnagar, U.P.",
    affiliation: "AFFILIATED TO U.P. BOARD",
    logoUrl: "",
    slogan: "",
    website: ""
  });

  const TABLE_ROWS_COUNT = 10;

  const normalize = (str = "") => str.toLowerCase().replace(/[^a-z]/g, "");

  const getRow = (exam, subject) => {
    if (!exam || !exam.rows) return { total: 0, marks: 0 };
    // FIX: Exact match for Science/Social Science
    const found = exam.rows.find(
      (r) => normalize(r.subject) === normalize(subject)
    );
    return found || { total: 0, marks: 0 };
  };

  const fetchSchoolDetails = async () => {
    try {
      const schoolRef = doc(db, "settings", "schoolDetails");
      const schoolSnap = await getDoc(schoolRef);
      if (schoolSnap.exists()) {
        setSchoolInfo(schoolSnap.data());
      }
    } catch (err) {
      console.error("Error fetching school details:", err);
    }
  };

  const fetchSubjectsForClass = async (className) => {
    try {
      const docRef = doc(db, "school_config", "master_data");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const mapping = docSnap.data().mapping || {};
        // Pehle full name check karo, fir short name (LKG)
        setSubjects(mapping[className] || mapping[className.replace("Class ", "")] || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchSchoolDetails();

      const lowerId = studentId?.toLowerCase() || "";
      const isBulk = lowerId.includes("class") || lowerId === "lkg" || lowerId === "ukg" || lowerId === "nursery";

      if (isBulk) {
        // Aapke database photo ke hisaab se LKG set kar rahe hain
        let searchName = studentId; 
        if (lowerId === "lkg") searchName = "LKG";
        else if (lowerId === "ukg") searchName = "UKG";
        else if (lowerId.startsWith("class")) {
            // Agar "Class1" hai to space add karega, warna seedha dhoondega
            searchName = studentId.replace(/class/i, "Class ").trim();
        }

        // Subjects ke liye "Class LKG" format try karte hain mapping se
        await fetchSubjectsForClass(searchName.includes("Class") ? searchName : "Class " + searchName);

        // Database Query: className == "LKG"
        const qs = query(
          collection(db, "students"),
          where("className", "==", searchName)
        );
        const stuSnap = await getDocs(qs);
        const students = stuSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const all = [];
        for (const stu of students) {
          const qr = query(
            collection(db, "examResults"),
            where("studentId", "==", stu.id),
            where("session", "==", session)
          );
          const rs = await getDocs(qr);
          const results = rs.docs.map((d) => d.data());
          const h = results.find((r) => r.exam === "Half-Yearly");
          const a = results.find((r) => r.exam === "Annual");
          
          if (h || a) {
            all.push({ 
              student: stu, 
              half: h, 
              annual: a,
              srNo: a?.srNo || h?.srNo || "---" 
            });
          }
        }
        all.sort((x, y) => (parseInt(x.srNo) || 999) - (parseInt(y.srNo) || 999));
        setClassResults(all);
      } else {
        // Single Student Logic
        const stuRef = doc(db, "students", studentId);
        const stuSnap = await getDoc(stuRef);
        if (stuSnap.exists()) {
          const stu = stuSnap.data();
          await fetchSubjectsForClass(stu.className.includes("Class") ? stu.className : "Class " + stu.className);
          const qr = query(
            collection(db, "examResults"),
            where("studentId", "==", studentId),
            where("session", "==", session)
          );
          const rs = await getDocs(qr);
          const results = rs.docs.map((d) => d.data());
          const h = results.find((r) => r.exam === "Half-Yearly");
          const a = results.find((r) => r.exam === "Annual");
          setClassResults([{ student: { id: studentId, ...stu }, half: h, annual: a, srNo: a?.srNo || h?.srNo || "---" }]);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [studentId, session]);

  const handlePrint = () => {
    const content = document.getElementById("marksheet-content").innerHTML;
    const printWindow = window.open("", "_blank", "width=1000,height=1200");
    printWindow.document.write(`
      <html>
        <head>
          <title>${schoolInfo.name}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { margin: 0; padding: 0; background: white !important; }
            .print-page { width: 210mm; height: 296.5mm; padding: 8mm; page-break-after: always; display: flex; justify-content: center; align-items: center; }
            .main-border { border: 4px solid #1e3a8a !important; height: 100%; width: 100%; padding: 10mm; position: relative; display: flex; flex-direction: column; }
            table { border-collapse: collapse; width: 100%; }
            table td, table th { border: 1.5px solid #1e3a8a !important; }
          </style>
        </head>
        <body>
          \${content}
          <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 1000); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return <div className="p-20 text-center font-bold">Loading Report Cards...</div>;

  return (
    <div className="bg-slate-500 min-h-screen p-10 print:bg-white print:p-0">
      <div id="marksheet-content" className="flex flex-col items-center">
        {classResults.map((item) => {
          const { student, half, annual, srNo } = item;
          const getMarksInfo = (sub) => {
            const h = getRow(half, sub);
            const a = getRow(annual, sub);
            return { hMax: Number(h.total) || 0, hObt: Number(h.marks) || 0, aMax: Number(a.total) || 0, aObt: Number(a.marks) || 0 };
          };

          const totalHMax = subjects.reduce((acc, sub) => acc + getMarksInfo(sub).hMax, 0);
          const totalHObt = subjects.reduce((acc, sub) => acc + getMarksInfo(sub).hObt, 0);
          const totalAMax = subjects.reduce((acc, sub) => acc + getMarksInfo(sub).aMax, 0);
          const totalAObt = subjects.reduce((acc, sub) => acc + getMarksInfo(sub).aObt, 0);
          const gMax = totalHMax + totalAMax;
          const gObt = totalHObt + totalAObt;
          const perc = gMax ? ((gObt / gMax) * 100).toFixed(2) : 0;

          return (
            <div key={student.id} className="print-page bg-white shadow-2xl mb-10">
              <div className="main-border">
                {/* Header */}
                <div className="text-center border-b-2 border-[#1e3a8a] pb-2 mb-4 relative">
                  <h1 className="text-3xl font-black text-[#1e3a8a]">{schoolInfo.name}</h1>
                  <p className="text-[10px] font-bold text-gray-600">{schoolInfo.address}</p>
                  <p className="bg-[#1e3a8a] text-white inline-block px-8 py-1 mt-2 text-xs font-bold rounded-full">PROGRESS REPORT : {session}</p>
                  <div className="absolute top-0 right-0 border border-[#1e3a8a] px-2 py-0.5 text-[10px] font-black">SR. NO: {srNo}</div>
                </div>

                {/* Info */}
                <div className="flex justify-between items-start my-4">
                  <div className="flex-grow space-y-2 text-[#1e3a8a] font-bold text-sm">
                    <p className="border-b flex"><span className="w-40 text-gray-500">NAME:</span> <span className="text-black uppercase">{student.name}</span></p>
                    <p className="border-b flex"><span className="w-40 text-gray-500">CLASS:</span> <span className="text-black uppercase">{student.className}</span></p>
                    <p className="border-b flex"><span className="w-40 text-gray-500">FATHER'S NAME:</span> <span className="text-black uppercase">{student.fatherName}</span></p>
                  </div>
                  <div className="w-28 h-32 border-4 border-[#1e3a8a] bg-gray-100 overflow-hidden">
                    <img src={student.photoURL || student.photo} className="w-full h-full object-cover" onError={(e) => e.target.src="https://via.placeholder.com/150"} />
                  </div>
                </div>

                {/* Table */}
                <div className="flex-grow">
                  <table className="w-full text-xs">
                    <thead className="bg-[#1e3a8a] text-white text-center">
                      <tr>
                        <th rowSpan="2" className="p-1">S.N</th>
                        <th rowSpan="2" className="text-left px-2">SUBJECTS</th>
                        <th colSpan="2">HALF YEARLY</th>
                        <th colSpan="2">ANNUAL</th>
                        <th rowSpan="2" className="bg-blue-900">GRAND TOTAL</th>
                      </tr>
                      <tr className="bg-blue-800 text-[9px]">
                        <th className="w-12">MAX</th><th className="w-12">OBT</th>
                        <th className="w-12">MAX</th><th className="w-12">OBT</th>
                      </tr>
                    </thead>
                    <tbody className="text-[#1e3a8a] font-bold">
                      {subjects.map((sub, idx) => {
                        const m = getMarksInfo(sub);
                        return (
                          <tr key={idx} className="text-center h-8">
                            <td>{idx + 1}</td>
                            <td className="text-left px-2 uppercase bg-slate-50">{sub}</td>
                            <td className="text-gray-400">{m.hMax}</td><td className="text-black">{m.hObt}</td>
                            <td className="text-gray-400">{m.aMax}</td><td className="text-black">{m.aObt}</td>
                            <td className="bg-blue-50">{m.hObt + m.aObt}</td>
                          </tr>
                        );
                      })}
                      {Array.from({ length: Math.max(0, TABLE_ROWS_COUNT - subjects.length) }).map((_, i) => (
                        <tr key={i} className="h-8"><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#1e3a8a] text-white font-black text-center">
                      <tr className="h-10">
                        <td colSpan="2" className="text-right px-2 uppercase">Total:</td>
                        <td>{totalHMax}</td><td>{totalHObt}</td>
                        <td>{totalAMax}</td><td>{totalAObt}</td>
                        <td className="bg-yellow-400 text-blue-900 text-lg">{gObt} / {gMax}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Footer logic */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="border-2 border-[#1e3a8a] p-2 text-center"><p className="text-[10px] text-gray-500 uppercase">Percentage</p><p className="text-xl font-black">{perc}%</p></div>
                  <div className="border-2 border-[#1e3a8a] p-2 text-center bg-blue-50"><p className="text-[10px] text-gray-500 uppercase">Result</p><p className="text-xl font-black text-green-600 uppercase">{perc >= 33 ? "PASSED" : "FAILED"}</p></div>
                  <div className="border-2 border-[#1e3a8a] p-2 text-center"><p className="text-[10px] text-gray-500 uppercase">Grade</p><p className="text-xl font-black">{perc >= 75 ? "A" : perc >= 60 ? "B" : perc >= 45 ? "C" : "D"}</p></div>
                </div>

                <div className="flex justify-between items-end mt-10 px-4">
                  <div className="text-center"><div className="w-32 border-t-2 border-[#1e3a8a] mb-1"></div><p className="text-[10px] font-bold uppercase">Class Teacher</p></div>
                  <div className="flex flex-col items-center"><div className="w-16 h-16 border border-dashed rounded-full mb-1"></div><p className="text-[8px] font-bold">{schoolInfo.name}</p></div>
                  <div className="text-center"><div className="w-32 border-t-2 border-[#1e3a8a] mb-1"></div><p className="text-[10px] font-bold uppercase">Principal</p></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-10 right-10 print:hidden flex gap-3">
        <button onClick={() => window.location.reload()} className="bg-white text-black font-bold px-6 py-3 rounded-full shadow-lg border-2 border-[#1e3a8a]">Refresh</button>
        <button onClick={handlePrint} className="bg-[#1e3a8a] text-white font-black px-10 py-3 rounded-full shadow-2xl">PRINT ALL</button>
      </div>
    </div>
  );
}