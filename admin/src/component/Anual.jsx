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
    const found = exam.rows.find(
      (r) => normalize(r.subject) === normalize(subject)
    );
    return found || { total: 0, marks: 0 };
  };

  const handlePrint = () => {
    const content = document.getElementById("marksheet-content").innerHTML;
    const printWindow = window.open("", "_blank", "width=1100,height=1400");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print - ${schoolInfo.name}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&display=swap');
            @page { size: A4 portrait; margin: 0; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
            body { margin: 0; padding: 0; background: #fff; font-family: 'Roboto', sans-serif; }
            .print-page { 
              width: 210mm; 
              height: 297mm; 
              padding: 10mm; 
              margin: 0 auto;
              background: white;
              page-break-after: always; 
              display: flex; 
              flex-direction: column;
              overflow: hidden;
            }
            .main-border { 
              border: 5px double #1e3a8a; 
              height: 100%; 
              width: 100%; 
              padding: 8mm; 
              display: flex; 
              flex-direction: column; 
              border-radius: 8px;
            }
            table { border-collapse: collapse; width: 100%; margin-top: 5px; }
            table td, table th { border: 2px solid #1e3a8a !important; padding: 6px !important; font-size: 13px; font-weight: 900; }
            .info-line { display: flex; border-bottom: 1.5px dashed #1e3a8a; padding-bottom: 2px; margin-bottom: 10px; align-items: center; }
            .info-label { width: 140px; font-size: 11px; color: #1e3a8a; font-weight: 900; text-transform: uppercase; }
            .info-value { font-size: 14px; color: #000; font-weight: 900; text-transform: uppercase; flex: 1; }
          </style>
        </head>
        <body>
          <div class="print-container">${content}</div>
          <script>
            window.onload = () => {
              setTimeout(() => { window.print(); window.close(); }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const sRef = doc(db, "settings", "schoolDetails");
      const sSnap = await getDoc(sRef);
      if (sSnap.exists()) setSchoolInfo(sSnap.data());

      const lowerId = studentId?.toLowerCase() || "";
      const isBulk = lowerId.includes("class") || ["lkg", "ukg", "nursery"].includes(lowerId);

      if (isBulk) {
        let sName = lowerId === "lkg" ? "LKG" : lowerId === "ukg" ? "UKG" : studentId.replace(/class/i, "Class ").trim();
        const mSnap = await getDoc(doc(db, "school_config", "master_data"));
        if (mSnap.exists()) {
          const mapping = mSnap.data().mapping || {};
          setSubjects(mapping[sName] || mapping["Class "+sName] || []);
        }
        const stuSnap = await getDocs(query(collection(db, "students"), where("className", "==", sName)));
        const students = stuSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const all = [];
        for (const stu of students) {
          const rSnap = await getDocs(query(collection(db, "examResults"), where("studentId", "==", stu.id), where("session", "==", session)));
          const resDocs = rSnap.docs.map(d => d.data());
          const h = resDocs.find(r => r.exam === "Half-Yearly");
          const a = resDocs.find(r => r.exam === "Annual");
          if (h || a) {
            all.push({ student: stu, half: h, annual: a, srNo: a?.srNo || h?.srNo || "---" });
          }
        }
        all.sort((x, y) => (x.student.examRollNo || 0) - (y.student.examRollNo || 0));
        setClassResults(all);
      } else {
        const stuSnap = await getDoc(doc(db, "students", studentId));
        if (stuSnap.exists()) {
          const stu = stuSnap.data();
          const mSnap = await getDoc(doc(db, "school_config", "master_data"));
          if (mSnap.exists()) setSubjects(mSnap.data().mapping[stu.className] || []);
          const rSnap = await getDocs(query(collection(db, "examResults"), where("studentId", "==", studentId), where("session", "==", session)));
          const resDocs = rSnap.docs.map(d => d.data());
          setClassResults([{ 
            student: { id: studentId, ...stu }, 
            half: resDocs.find(r => r.exam === "Half-Yearly"), 
            annual: resDocs.find(r => r.exam === "Annual"), 
            srNo: resDocs[0]?.srNo || "---" 
          }]);
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [studentId, session]);

  if (loading) return <div className="p-20 text-center font-black text-indigo-600">LOADING MARKSHEETS...</div>;

  return (
    <div className="bg-slate-900 min-h-screen p-4 md:p-10 print:p-0 text-slate-900">
      <div id="marksheet-content" className="flex flex-col items-center">
        {classResults.map((item) => {
          const { student, half, annual, srNo } = item;
          const mName = annual?.motherName || half?.motherName || student?.motherName || "---";
          const dob = annual?.dob || half?.dob || student?.dob || "---";
          const roll = annual?.examRollNo || half?.examRollNo || student?.examRollNo || "---";
          const addr = annual?.address || half?.address || student?.address || "---";

          const getMarks = (sub) => {
            const h = getRow(half, sub);
            const a = getRow(annual, sub);
            return { hMax: Number(h.total) || 0, hObt: Number(h.marks) || 0, aMax: Number(a.total) || 0, aObt: Number(a.marks) || 0 };
          };

          const tHMax = subjects.reduce((s, sub) => s + getMarks(sub).hMax, 0);
          const tHObt = subjects.reduce((s, sub) => s + getMarks(sub).hObt, 0);
          const tAMax = subjects.reduce((s, sub) => s + getMarks(sub).aMax, 0);
          const tAObt = subjects.reduce((s, sub) => s + getMarks(sub).aObt, 0);
          const gMax = tHMax + tAMax;
          const gObt = tHObt + tAObt;
          const perc = gMax ? ((gObt / gMax) * 100).toFixed(2) : 0;

          return (
            <div key={student.id} className="print-page shadow-2xl mb-10 bg-white">
              <div className="main-border">
                {/* School Header Section */}
                <div className="flex items-center border-b-4 border-blue-900 pb-2 mb-4">
                  {schoolInfo.logoUrl && <img src={schoolInfo.logoUrl} className="w-20 h-20 object-contain mr-4" alt="logo" />}
                  <div className="flex-1 text-center">
                    <h1 className="text-3xl font-black text-blue-900 uppercase leading-none">{schoolInfo.name}</h1>
                    <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase">{schoolInfo.address}</p>
                    <div className="mt-2 inline-block bg-blue-900 text-white px-10 py-1 rounded-full text-xs font-black italic">
                      PROGRESS REPORT : {session}
                    </div>
                  </div>
                  <div className="text-right flex flex-col gap-1 min-w-[90px]">
                    <div className="border-2 border-blue-900 px-2 py-0.5 text-xs font-black">SR: {srNo}</div>
                    <div className="border-2 border-blue-900 px-2 py-0.5 text-xs font-black bg-slate-50">ROLL: {roll}</div>
                  </div>
                </div>

                {/* Personal Information Grid */}
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <div className="info-line"><span className="info-label">Student Name:</span><span className="info-value">{student.name}</span></div>
                    <div className="info-line"><span className="info-label">Father's Name:</span><span className="info-value">{student.fatherName}</span></div>
                    <div className="info-line"><span className="info-label">Mother's Name:</span><span className="info-value">{mName}</span></div>
                    <div className="flex gap-4">
                      <div className="info-line flex-1"><span className="info-label w-24">Class:</span><span className="info-value">{student.className}</span></div>
                      <div className="info-line flex-1"><span className="info-label w-24">Date of Birth:</span><span className="info-value">{dob}</span></div>
                    </div>
                    <div className="info-line"><span className="info-label">Address:</span><span className="info-value text-[11px] leading-tight normal-case">{addr}</span></div>
                  </div>
                  <div className="w-28 h-32 border-4 border-blue-900 p-0.5 bg-white">
                    <img src={student.photoURL || student.photo} className="w-full h-full object-cover" alt="student-photo" />
                  </div>
                </div>

                {/* Academic Result Table */}
                <div className="flex-grow">
                  <table className="text-center">
                    <thead className="bg-blue-900 text-white">
                      <tr>
                        <th rowSpan="2" className="w-10">S.N</th>
                        <th rowSpan="2" className="text-left px-3">SUBJECTS</th>
                        <th colSpan="2" className="py-1 uppercase">Half Yearly</th>
                        <th colSpan="2" className="py-1 uppercase">Annual Exam</th>
                        <th rowSpan="2" className="bg-blue-800 uppercase">Grand Total</th>
                      </tr>
                      <tr className="text-[10px] bg-blue-700">
                        <th className="w-14">MAX</th><th className="w-14">OBT</th>
                        <th className="w-14">MAX</th><th className="w-14">OBT</th>
                      </tr>
                    </thead>
                    <tbody className="uppercase font-black text-blue-900">
                      {subjects.map((sub, i) => {
                        const m = getMarks(sub);
                        return (
                          <tr key={i} className="h-8">
                            <td className="bg-slate-50">{i+1}</td>
                            <td className="text-left px-3">{sub}</td>
                            <td className="text-gray-300">{m.hMax}</td><td className="text-black text-base">{m.hObt}</td>
                            <td className="text-gray-300">{m.aMax}</td><td className="text-black text-base">{m.aObt}</td>
                            <td className="bg-blue-50 text-lg font-black">{m.hObt + m.aObt}</td>
                          </tr>
                        );
                      })}
                      {Array.from({ length: Math.max(0, TABLE_ROWS_COUNT - subjects.length) }).map((_, i) => (
                        <tr key={i} className="h-8"><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-blue-900 text-white">
                      <tr className="h-12 font-black">
                        <td colSpan="2" className="text-right px-6 text-sm uppercase">Total Marks Obtained</td>
                        <td>{tHMax}</td><td>{tHObt}</td>
                        <td>{tAMax}</td><td>{tAObt}</td>
                        {/* Result Format: Obtained / Max */}
                        <td className="bg-yellow-400 text-blue-900 text-lg border-none">{gObt} / {gMax}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Final Result Metrics */}
                <div className="grid grid-cols-3 gap-4 mt-5">
                  <div className="border-4 border-blue-900 p-2 text-center rounded-lg">
                    <p className="text-[9px] font-black text-gray-400 uppercase">Percentage</p>
                    <p className="text-2xl font-black">{perc}%</p>
                  </div>
                  <div className="border-4 border-blue-900 p-2 text-center rounded-lg bg-blue-50">
                    <p className="text-[9px] font-black text-gray-400 uppercase">Result Status</p>
                    <p className={`text-2xl font-black ${perc >= 33 ? 'text-green-700' : 'text-red-600'}`}>
                      {perc >= 33 ? "PASSED" : "FAILED"}
                    </p>
                  </div>
                  <div className="border-4 border-blue-900 p-2 text-center rounded-lg">
                    <p className="text-[9px] font-black text-gray-400 uppercase">Final Grade</p>
                    <p className="text-2xl font-black">
                      {perc >= 75 ? "A+" : perc >= 60 ? "A" : perc >= 45 ? "B" : "C"}
                    </p>
                  </div>
                </div>

                {/* Footer Signature Section */}
                <div className="flex justify-between items-end mt-auto pt-8 px-6 pb-2">
                  <div className="text-center">
                    <div className="w-36 border-t-2 border-blue-900 mb-1"></div>
                    <p className="text-[10px] font-black uppercase text-blue-900">Class Teacher</p>
                  </div>
                  <div className="w-20 h-20 border border-dashed border-slate-200 rounded-full flex items-center justify-center opacity-30">
                    <span className="text-[8px] font-bold">SCHOOL SEAL</span>
                  </div>
                  <div className="text-center">
                    <div className="w-36 border-t-2 border-blue-900 mb-1"></div>
                    <p className="text-[10px] font-black uppercase text-blue-900">Principal Signature</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-10 right-10 flex gap-4 print:hidden">
        <button onClick={() => window.location.reload()} className="bg-white border-2 border-blue-900 text-blue-900 font-black px-8 py-3 rounded-full shadow-lg hover:bg-slate-50 transition-all">
          REFRESH
        </button>
        <button onClick={handlePrint} className="bg-blue-900 text-white font-black px-12 py-3 rounded-full shadow-2xl hover:scale-105 transition-transform">
          PRINT ALL CARDS
        </button>
      </div>
    </div>
  );
}