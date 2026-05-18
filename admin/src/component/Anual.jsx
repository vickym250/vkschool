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

// ─── Theme Definitions ───────────────────────────────────────────────────────
const THEMES = {
  blue: {
    label: "Blue",
    primary: "#1e3a8a",
    primaryLight: "#1d4ed8",
    headerBg: "#1e3a8a",
    headerBgLight: "#1d4ed8",
    banner: "#7dd3fc",
    bannerText: "#1e3a8a",
    resultBox: "#f0f9ff",
    rollBg: "#fef08a",
    accent: "#dbeafe",
    tableFoot: "#1e3a8a",
    tableFootLight: "#1d4ed8",
    infoLabel: "#1e3a8a",
    gradeText: "#b91c1c",
    resultText: "#15803d",
  },
  green: {
    label: "Green",
    primary: "#14532d",
    primaryLight: "#166534",
    headerBg: "#14532d",
    headerBgLight: "#15803d",
    banner: "#86efac",
    bannerText: "#14532d",
    resultBox: "#f0fdf4",
    rollBg: "#fef08a",
    accent: "#dcfce7",
    tableFoot: "#14532d",
    tableFootLight: "#166534",
    infoLabel: "#14532d",
    gradeText: "#b91c1c",
    resultText: "#15803d",
  },
  red: {
    label: "Red",
    primary: "#7f1d1d",
    primaryLight: "#991b1b",
    headerBg: "#7f1d1d",
    headerBgLight: "#b91c1c",
    banner: "#fca5a5",
    bannerText: "#7f1d1d",
    resultBox: "#fff1f2",
    rollBg: "#fef08a",
    accent: "#fee2e2",
    tableFoot: "#7f1d1d",
    tableFootLight: "#991b1b",
    infoLabel: "#7f1d1d",
    gradeText: "#1d4ed8",
    resultText: "#15803d",
  },
  purple: {
    label: "Purple",
    primary: "#3b0764",
    primaryLight: "#6b21a8",
    headerBg: "#3b0764",
    headerBgLight: "#7e22ce",
    banner: "#d8b4fe",
    bannerText: "#3b0764",
    resultBox: "#faf5ff",
    rollBg: "#fef08a",
    accent: "#ede9fe",
    tableFoot: "#3b0764",
    tableFootLight: "#6b21a8",
    infoLabel: "#3b0764",
    gradeText: "#b91c1c",
    resultText: "#15803d",
  },
  orange: {
    label: "Orange",
    primary: "#7c2d12",
    primaryLight: "#c2410c",
    headerBg: "#7c2d12",
    headerBgLight: "#ea580c",
    banner: "#fdba74",
    bannerText: "#7c2d12",
    resultBox: "#fff7ed",
    rollBg: "#fef08a",
    accent: "#ffedd5",
    tableFoot: "#7c2d12",
    tableFootLight: "#c2410c",
    infoLabel: "#7c2d12",
    gradeText: "#1d4ed8",
    resultText: "#15803d",
  },
};

const THEME_STORAGE_KEY = "marksheet_theme";

export default function MarksSheet() {
  const { studentId, session } = useParams();
  const [loading, setLoading] = useState(true);
  const [classResults, setClassResults] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [activeTheme, setActiveTheme] = useState(
    () => localStorage.getItem(THEME_STORAGE_KEY) || "blue"
  );

  const theme = THEMES[activeTheme] || THEMES.blue;

  const handleThemeChange = (key) => {
    setActiveTheme(key);
    localStorage.setItem(THEME_STORAGE_KEY, key);
  };

  const [schoolInfo, setSchoolInfo] = useState({
    name: "Dr. A. P. J. Abdul Kalam Memorial Kid's Academy",
    address: "Barhni (opp. Cold Storage), Post- Kathawtiya Alam, Dumariyaganj, Siddharth Nagar - 272189",
    mobile: "9918488912",
    website: "https://drapjacademy.in",
    logoUrl: "",
    signatureUrl: "",
  });

  const TABLE_ROWS_COUNT = 8;
  const normalize = (str = "") => str.toLowerCase().replace(/[^a-z]/g, "");

  const calculateGrade = (per) => {
    if (per >= 90) return "A1";
    if (per >= 80) return "A2";
    if (per >= 70) return "B1";
    if (per >= 60) return "B2";
    if (per >= 50) return "C1";
    if (per >= 40) return "C2";
    if (per >= 33) return "D";
    return "E";
  };

  const getRow = (exam, subject) => {
    if (!exam || !exam.rows) return { total: 0, marks: 0 };
    const found = exam.rows.find(
      (r) => normalize(r.subject) === normalize(subject)
    );
    return found || { total: 0, marks: 0 };
  };

  const getBase64FromUrl = async (url) => {
    if (!url) return "";
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result);
      });
    } catch (e) {
      console.error("Asset fetch error:", e);
      return url;
    }
  };

  const handlePrint = async () => {
    const logoBase64 = schoolInfo.logoUrl ? await getBase64FromUrl(schoolInfo.logoUrl) : "";
    const sigBase64 = schoolInfo.signatureUrl ? await getBase64FromUrl(schoolInfo.signatureUrl) : "";

    const content = document.getElementById("marksheet-content").innerHTML;
    const t = theme;

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
            body { margin: 0; padding: 0; background: #fff; font-family: 'Roboto', sans-serif; overflow: hidden; }
            .print-page { width: 210mm; height: 297mm; padding: 5mm; margin: 0 auto; background: white; page-break-after: always; display: flex; flex-direction: column; }
            .main-border { border: 4px double ${t.primary}; height: 100%; width: 100%; padding: 4mm; display: flex; flex-direction: column; border-radius: 4px; }
            table { border-collapse: collapse; width: 100%; margin-top: 5px; }
            table td, table th { border: 1.5px solid ${t.primary} !important; padding: 3px 5px !important; font-size: 12px; font-weight: 900; }
            .info-line { display: flex; border-bottom: 1px dashed ${t.primary}; padding-bottom: 1px; margin-bottom: 4px; align-items: center; }
            .info-label { width: 120px; font-size: 11px; color: ${t.primary}; font-weight: 900; text-transform: uppercase; }
            .info-value { font-size: 13px; color: #000; font-weight: 900; text-transform: uppercase; flex: 1; }
            .header-school-name { color: #800000; font-size: 24px; font-weight: 900; text-transform: uppercase; line-height: 1; }
            .header-subtext { color: ${t.primaryLight}; font-size: 11px; font-weight: 700; }
            .banner-strip { background-color: ${t.banner}; color: ${t.bannerText}; text-align: center; font-weight: 900; font-size: 17px; padding: 4px 0; margin: 8px 0; text-transform: uppercase; -webkit-print-color-adjust: exact; border: 1.5px solid ${t.primary}; }
            .result-box { border: 1.5px solid ${t.primary}; background: ${t.resultBox} !important; -webkit-print-color-adjust: exact; }
            .sig-container { position: relative; width: 150px; text-align: center; bottom: 20px; }
            .principal-sig-img { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); height: 45px; width: auto; mix-blend-mode: multiply; }
          </style>
        </head>
        <body>
          <div class="print-container">${content}</div>
          <script>
            const logo = document.querySelectorAll('.school-logo-img');
            logo.forEach(img => img.src = "${logoBase64}");
            const sigs = document.querySelectorAll('.principal-sig-img');
            sigs.forEach(img => img.src = "${sigBase64}");
            window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 800); };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ─── Helper: check if student is NOT deleted ─────────────────────────────
  // Database mein field name "delete_at" hai (Firestore Timestamp ya null)
  const isNotDeleted = (data) => {
    return data.delete_at === null || data.delete_at === undefined;
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
          setSubjects(mapping[sName] || mapping["Class " + sName] || []);
        }
        const stuSnap = await getDocs(query(collection(db, "students"), where("className", "==", sName)));

        // ✅ deletedAt null/undefined wale hi lo
        const students = stuSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(s => isNotDeleted(s));

        const all = [];
        for (const stu of students) {
          const rSnap = await getDocs(query(collection(db, "examResults"), where("studentId", "==", stu.id), where("session", "==", session)));
          // ✅ examResults mein bhi delete_at null/undefined wale hi lo
          const resDocs = rSnap.docs
            .map(d => d.data())
            .filter(r => r.delete_at === null || r.delete_at === undefined);
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

          // ✅ Agar deletedAt set hai (null nahi) to kuch mat dikha
          if (!isNotDeleted(stu)) {
            setClassResults([]);
            setLoading(false);
            return;
          }

          const mSnap = await getDoc(doc(db, "school_config", "master_data"));
          if (mSnap.exists()) setSubjects(mSnap.data().mapping[stu.className] || []);
          const rSnap = await getDocs(query(collection(db, "examResults"), where("studentId", "==", studentId), where("session", "==", session)));
          // ✅ examResults mein bhi delete_at null/undefined wale hi lo
          const resDocs = rSnap.docs
            .map(d => d.data())
            .filter(r => r.delete_at === null || r.delete_at === undefined);
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

  const formatClassName = (name = "") => {
    const lowerName = name.toLowerCase();
    if (["nursery", "lkg", "ukg"].some(c => lowerName.includes(c))) return name.toUpperCase();
    const match = name.match(/\d+/);
    if (!match) return name;
    const num = parseInt(match[0]);
    let suffix = "th";
    if (num % 100 < 11 || num % 100 > 13) {
      if (num % 10 === 1) suffix = "st";
      else if (num % 10 === 2) suffix = "nd";
      else if (num % 10 === 3) suffix = "rd";
    }
    return `${num}${suffix}`;
  };

  useEffect(() => { loadData(); }, [studentId, session]);

  if (loading) return (
    <div className="p-20 text-center font-black text-indigo-600 text-xl">LOADING MARKSHEETS...</div>
  );

  return (
    <div className="bg-slate-900 min-h-screen p-4 md:p-10 print:p-0 text-slate-900">
      {/* ── Theme Picker Bar ── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap print:hidden justify-center">
        <span className="text-white font-bold text-sm tracking-widest uppercase">Theme:</span>
        {Object.entries(THEMES).map(([key, t]) => (
          <button
            key={key}
            onClick={() => handleThemeChange(key)}
            title={t.label}
            style={{
              background: t.headerBg,
              border: activeTheme === key ? "3px solid #fff" : "3px solid transparent",
              boxShadow: activeTheme === key ? "0 0 0 2px " + t.headerBg : "none",
              outline: "none",
            }}
            className="w-9 h-9 rounded-full transition-transform hover:scale-110 font-black text-white text-xs"
          >
            {activeTheme === key ? "✓" : t.label[0]}
          </button>
        ))}
        <span className="text-white/60 text-xs ml-1">
          ({THEMES[activeTheme]?.label} — auto-saved)
        </span>
      </div>

      <div id="marksheet-content" className="flex flex-col items-center">
        {classResults.map((item) => {
          const { student, half, annual, srNo } = item;
          const dob = annual?.dob || half?.dob || student?.dob || "---";
          const roll = annual?.examRollNo || half?.examRollNo || student?.examRollNo || "---";

          const getMarks = (sub) => {
            const h = getRow(half, sub);
            const a = getRow(annual, sub);
            return { hMax: Number(h.total) || 50, hObt: Number(h.marks) || 0, aMax: Number(a.total) || 50, aObt: Number(a.marks) || 0 };
          };

          const tHMax = subjects.reduce((s, sub) => s + getMarks(sub).hMax, 0);
          const tHObt = subjects.reduce((s, sub) => s + getMarks(sub).hObt, 0);
          const tAMax = subjects.reduce((s, sub) => s + getMarks(sub).aMax, 0);
          const tAObt = subjects.reduce((s, sub) => s + getMarks(sub).aObt, 0);
          const gMax = tHMax + tAMax;
          const gObt = tHObt + tAObt;

          const finalPercentage = gMax > 0 ? ((gObt / gMax) * 100).toFixed(2) : 0;
          const finalGrade = calculateGrade(finalPercentage);
          const resultStatus = finalPercentage >= 33 ? "PASSED" : "FAILED";

          return (
            <div
              key={student.id}
              className="print-page shadow-2xl mb-10 bg-white"
              style={{ width: "210mm", minHeight: "297mm", padding: "5mm", margin: "0 auto 40px" }}
            >
              <div
                className="main-border"
                style={{
                  border: `4px double ${theme.primary}`,
                  height: "100%",
                  width: "100%",
                  padding: "4mm",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "4px",
                }}
              >
                {/* Header */}
                <div className="flex items-center w-full gap-2">
                  {schoolInfo.logoUrl && (
                    <img src={schoolInfo.logoUrl} className="school-logo-img w-16 h-16 object-contain" alt="logo" />
                  )}
                  <div className="flex-1 text-center">
                    <h1 style={{ color: "#800000", fontSize: "24px", fontWeight: 900, textTransform: "uppercase", lineHeight: 1 }}>
                      {schoolInfo.name}
                    </h1>
                    <p style={{ color: theme.primaryLight, fontSize: "13px", fontWeight: 700, textTransform: "uppercase" }}>{schoolInfo.address}</p>
                    <p style={{ color: theme.primaryLight, fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Mob: {schoolInfo.contact}</p>
                    <p style={{ color: theme.primaryLight, fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Website: {schoolInfo.website}</p>
                  </div>
                </div>

                {/* Banner */}
                <div style={{
                  backgroundColor: theme.banner,
                  color: theme.bannerText,
                  textAlign: "center",
                  fontWeight: 900,
                  fontSize: "17px",
                  padding: "4px 0",
                  margin: "8px 0",
                  textTransform: "uppercase",
                  border: `1.5px solid ${theme.primary}`,
                }}>
                  Annual Report Card - Session : {session}
                </div>

                <div className="flex justify-between items-center mb-2 px-1">
                  <div style={{ fontSize: "20px", fontWeight: 900, color: theme.primary }}>SR. NO.: {srNo}</div>
                  <div style={{
                    fontSize: "20px", fontWeight: 900, color: theme.primary,
                    padding: "0 12px", background: "#fcd34d", border: `1px solid ${theme.primary}`
                  }}>ROLL NO.: {roll}</div>
                </div>

                {/* Personal Info */}
                <div className="flex gap-2 mb-2">
                  <div className="flex-1">
                    {[
                      ["Name:", student.name, theme.primary],
                      ["Father's Name:", student.fatherName, "#000"],
                      ["Mother's Name:", student.motherName || "---", "#000"],
                    ].map(([label, value, color]) => (
                      <div key={label} style={{ display: "flex", borderBottom: `1px dashed ${theme.primary}`, paddingBottom: "1px", marginBottom: "4px", alignItems: "center" }}>
                        <span style={{ width: "120px", fontSize: "11px", color: theme.infoLabel, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
                        <span style={{ fontSize: "13px", color, fontWeight: 900, textTransform: "uppercase", flex: 1 }}>{value}</span>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      {[["Class:", formatClassName(student.className)], ["D.O.B:", dob]].map(([label, value]) => (
                        <div key={label} style={{ display: "flex", borderBottom: `1px dashed ${theme.primary}`, paddingBottom: "1px", marginBottom: "4px", alignItems: "center", flex: 1 }}>
                          <span style={{ width: "60px", fontSize: "11px", color: theme.infoLabel, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
                          <span style={{ fontSize: "13px", color: "#000", fontWeight: 900, textTransform: "uppercase", flex: 1 }}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", borderBottom: `1px dashed ${theme.primary}`, paddingBottom: "1px", marginBottom: "4px", alignItems: "center" }}>
                      <span style={{ width: "120px", fontSize: "11px", color: theme.infoLabel, fontWeight: 900, textTransform: "uppercase" }}>Address:</span>
                      <span style={{ fontSize: "13px", color: "#000", fontWeight: 900, textTransform: "uppercase", flex: 1 }}>{student.address || "---"}</span>
                    </div>
                  </div>
                  <div style={{ width: "80px", height: "96px", border: `2px solid ${theme.primary}`, padding: "2px", background: "white" }}>
                    <img src={student.photoURL || student.photo || "/placeholder-student.png"} className="w-full h-full object-cover" alt="student" />
                  </div>
                </div>

                {/* Table */}
                <div className="flex-grow">
                  <table style={{ borderCollapse: "collapse", width: "100%", marginTop: "5px", textAlign: "center" }}>
                    <thead>
                      <tr style={{ background: theme.headerBg, color: "white" }}>
                        <th rowSpan="2" style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 5px", fontSize: "13px", width: "24px" }}>SN</th>
                        <th rowSpan="2" style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 8px", fontSize: "13px", textAlign: "left" }}>SUBJECTS</th>
                        <th colSpan="2" style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 5px", fontSize: "13px", textTransform: "uppercase" }}>Half Yearly</th>
                        <th colSpan="2" style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 5px", fontSize: "13px", textTransform: "uppercase" }}>Annual Exam</th>
                        <th rowSpan="2" style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 5px", fontSize: "13px", background: theme.headerBgLight, textTransform: "uppercase" }}>Grand Total</th>
                      </tr>
                      <tr style={{ background: theme.headerBgLight, color: "white", fontSize: "11px" }}>
                        {["MAX", "OBT", "MAX", "OBT"].map((h, i) => (
                          <th key={i} style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 5px", width: "48px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody style={{ textTransform: "uppercase", fontWeight: 900, color: theme.primary }}>
                      {subjects.map((sub, i) => {
                        const m = getMarks(sub);
                        return (
                          <tr key={i} style={{ height: "28px" }}>
                            <td style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 5px", fontSize: "12px", background: "#f8fafc" }}>{i + 1}</td>
                            <td style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 8px", fontSize: "12px", textAlign: "left" }}>{sub}</td>
                            <td style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 5px", fontSize: "12px", color: "#9ca3af" }}>{m.hMax}</td>
                            <td style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 5px", fontSize: "12px", color: "#000" }}>{m.hObt}</td>
                            <td style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 5px", fontSize: "12px", color: "#9ca3af" }}>{m.aMax}</td>
                            <td style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 5px", fontSize: "12px", color: "#000" }}>{m.aObt}</td>
                            <td style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 5px", fontSize: "12px", background: theme.accent }}>{m.hObt + m.aObt}</td>
                          </tr>
                        );
                      })}
                      {Array.from({ length: Math.max(0, TABLE_ROWS_COUNT - subjects.length) }).map((_, i) => (
                        <tr key={i} style={{ height: "28px" }}>
                          {[...Array(7)].map((__, j) => (
                            <td key={j} style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 5px" }}></td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ height: "32px", background: theme.tableFoot, color: "white", fontWeight: 900 }}>
                        <td colSpan="2" style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 16px", fontSize: "12px", textAlign: "right" }}>TOTAL</td>
                        <td style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 5px", fontSize: "12px" }}>{tHMax}</td>
                        <td style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 5px", fontSize: "12px" }}>{tHObt}</td>
                        <td style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 5px", fontSize: "12px" }}>{tAMax}</td>
                        <td style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 5px", fontSize: "12px" }}>{tAObt}</td>
                        <td style={{ border: `1.5px solid ${theme.primary}`, padding: "3px 5px", fontSize: "13px", background: "#fcd34d", color: theme.primary }}>{gObt} / {gMax}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Summary Bar */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                    {[
                      { label: "PERCENTAGE", value: `${finalPercentage}%`, color: theme.primary },
                      { label: "GRADE", value: finalGrade, color: theme.gradeText },
                      { label: "RESULT", value: resultStatus, color: theme.resultText },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ flex: 1, border: `1.5px solid ${theme.primary}`, background: theme.resultBox, padding: "6px", textAlign: "center", borderRadius: "4px" }}>
                        <div style={{ fontSize: "10px", fontWeight: 900, color: theme.primary }}>{label}</div>
                        <div style={{ fontSize: "16px", fontWeight: 900, color }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Co-Scholastic & Grading */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "12px" }}>
                    <div style={{ border: `1px solid ${theme.primary}`, overflow: "hidden", borderRadius: "4px" }}>
                      <div style={{ background: theme.headerBg, color: "white", fontSize: "10px", fontWeight: 900, padding: "2px 8px", textTransform: "uppercase" }}>Co-Scholastic</div>
                      <table style={{ borderCollapse: "collapse", width: "100%", margin: 0 }}>
                        <tbody>
                          {["Work Education", "Health & Physical", "Discipline"].map((item, idx) => (
                            <tr key={item} style={{ borderBottom: idx < 2 ? `1px solid ${theme.primary}` : "none" }}>
                              <td style={{ textAlign: "left", padding: "4px 8px", fontSize: "12px", border: "none" }}>{item}</td>
                              <td style={{ width: "40px", textAlign: "center", fontWeight: 900, fontSize: "12px", border: "none", background: theme.accent }}>A</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ border: `1px solid ${theme.primary}`, overflow: "hidden", borderRadius: "4px" }}>
                      <div style={{ background: theme.headerBg, color: "white", fontSize: "10px", fontWeight: 900, padding: "2px 8px", textTransform: "uppercase" }}>Grading Scale</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", fontSize: "12px", fontWeight: 900, padding: "8px", gap: "2px 8px", background: "#f8fafc" }}>
                        {[["90%+= A1", "80%+= A2"], ["70%+= B1", "60%+= B2"], ["50%+= C1", "40%+= C2"], ["33%+= D", "0%+= E"]].flat().map(g => (
                          <div key={g}>{g}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "8px", paddingTop: "16px", paddingLeft: "8px", paddingRight: "8px", paddingBottom: "8px" }}>
                  <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <div style={{ width: "128px", borderTop: `1px solid ${theme.primary}`, marginBottom: "4px" }}></div>
                    <p style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: theme.primary }}>Class Teacher</p>
                  </div>
                  <div style={{ width: "64px", height: "64px", border: `1px dashed ${theme.primary}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.2 }}>
                    <span style={{ fontSize: "9px", fontWeight: "bold", color: theme.primary }}>SEAL</span>
                  </div>
                  <div className="sig-container" style={{ position: "relative", width: "150px", textAlign: "center", bottom: "20px" }}>
                    {schoolInfo.signatureUrl && (
                      <img src={schoolInfo.signatureUrl} className="principal-sig-img" alt="Principal Signature"
                        style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", height: "45px", width: "auto", mixBlendMode: "multiply" }}
                      />
                    )}
                    <div style={{ width: "160px", borderTop: `1px solid ${theme.primary}`, marginBottom: "4px", marginLeft: "auto", marginRight: "auto" }}></div>
                    <p style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: theme.primary }}>
                      Signature <br /> Principal/HeadMaster
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-10 right-10 flex gap-4 print:hidden">
        <button
          onClick={() => window.location.reload()}
          style={{ border: `2px solid ${theme.primary}`, color: theme.primary }}
          className="bg-white font-black px-8 py-2 rounded-full shadow-lg"
        >
          REFRESH
        </button>
        <button
          onClick={handlePrint}
          style={{ background: theme.primary }}
          className="text-white font-black px-12 py-3 rounded-full shadow-2xl hover:scale-105 transition-transform"
        >
          PRINT FULL A4 CARDS
        </button>
      </div>
    </div>
  );
}
