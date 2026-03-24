import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import QRCode from "react-qr-code";
import { Loader2, Printer, X } from "lucide-react";

// Helper function to convert number to words (Simple version)
const numberToWords = (num) => {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if ((num = num.toString()).length > 9) return 'Overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim() + " Only";
};

export default function FeesReceipt({
  studentId, name = "", studentClass = "", allCharges = [], 
  studentWiseBreakdown = [], extraCharges = [], payMonth = "", 
  paidAt, oldBalance = 0, currentTotal = 0, netPayable = 0, 
  received = 0, discount = 0, balance = 0, onClose,
}) {
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState({
    name: "Dr. A.P.J. Abdul Kalam Memorial Kid's Academy",
    address: "Barhni, Dumariyaganj, Siddharth Nagar",
    phone: "9918488912",
    website: "https://drapjacademy.in",
    logoUrl: "https://drapjacademy.in/logo.png"
  });

  const [studentDetails, setStudentDetails] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const schSnap = await getDoc(doc(db, "settings", "schoolDetails"));
        if (schSnap.exists()) setSchool(prev => ({ ...prev, ...schSnap.data() }));

        if (studentId) {
          const stuSnap = await getDoc(doc(db, "students", studentId));
          if (stuSnap.exists()) setStudentDetails(stuSnap.data());
        }
      } catch (err) {
        console.error("Receipt Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [studentId]);

  const getSession = () => {
    const today = paidAt ? new Date(paidAt) : new Date();
    const year = today.getFullYear();
    return today.getMonth() >= 3 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
  };

  if (loading) return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[2000] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  const date = paidAt ? new Date(paidAt).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-GB");
  const displayData = studentWiseBreakdown.length > 0 ? studentWiseBreakdown : [{ studentName: name || studentDetails?.name, items: allCharges }];
  const isFamily = displayData.length > 1;

  return (
    <div className="fixed inset-0 bg-slate-800/40 z-[1000] overflow-y-auto p-4 font-sans print:p-0 print:bg-white">
      {/* TOOLBAR */}
      <div className="no-print max-w-[105mm] mx-auto mb-4 flex justify-between gap-4">
        <button onClick={onClose} className="flex-1 bg-white text-red-600 font-bold py-2 rounded-lg shadow-sm border border-red-100 flex items-center justify-center gap-2 uppercase text-xs hover:bg-red-50 transition-colors">
          <X size={16}/> Close
        </button>
        <button onClick={() => window.print()} className="flex-[2] bg-blue-600 text-white font-bold py-2 rounded-lg shadow-blue-200 shadow-lg flex items-center justify-center gap-2 uppercase text-xs hover:bg-blue-700 transition-colors">
          <Printer size={16}/> Print Receipt (A6)
        </button>
      </div>

      {/* RECEIPT WRAPPER */}
      <div id="print-area" className="w-[105mm] h-[148mm] mx-auto bg-white p-[4mm] box-border relative border shadow-2xl print:shadow-none print:border-0 overflow-hidden">
        <div className=" border-[1.5px] border-black flex flex-col p-1">
          
          {/* HEADER */}
          <div className="flex items-start border-b-[1.5px] border-black pb-1 mb-1">
            <img src={school.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
            <div className="flex-1 text-center">
              <h1 className="text-[11px] font-black text-red-600 uppercase leading-tight leading-none">{school.name}</h1>
              <p className="text-[6.5px] font-bold text-gray-800 leading-tight px-2">{school.address}</p>
              <p className="text-[7px] font-black text-blue-800 mt-0.5 tracking-tight">📞 {school.phone} {school.website && `| ${school.website}`}</p>
            </div>
          </div>

          {/* STUDENT INFO */}
          <div className="grid grid-cols-2 text-[8px] border-b border-black mb-1 bg-gray-50 p-1">
            <div className="space-y-0.5">
              <p className="truncate"><b>{isFamily ? "Family" : "Student"}:</b> <span className="font-black uppercase">{isFamily ? "Multiple Students" : (name || studentDetails?.name)}</span></p>
              <p><b>Father:</b> {studentDetails?.fatherName || "---"}</p>
              <p><b>Class:</b> {isFamily ? "Multi" : (studentClass || studentDetails?.className)}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p><b>Receipt No:</b> {Date.now().toString().slice(-6)}</p>
              <p><b>Date:</b> {date}</p>
              <p><b>Session:</b> {getSession()}</p>
            </div>
          </div>

          {/* FEES TABLE */}
          <div className="flex-grow ">
            <table className="w-full border-collapse text-[8px]">
              <thead className="bg-black text-white uppercase text-[7px]">
                <tr>
                  <th className="border border-black px-1 py-0.5 text-left">Particulars</th>
                  <th className="border border-black px-1 py-0.5 text-right w-16">Amount</th>
                </tr>
              </thead>
              <tbody>
                {displayData.map((group, idx) => (
                  <React.Fragment key={idx}>
                    {isFamily && (
                      <tr className="bg-gray-200 font-black italic">
                        <td colSpan="2" className="px-1 border border-black uppercase text-[7px]">{group.studentName}</td>
                      </tr>
                    )}
                    {group.items?.map((item, iIdx) => (
                      <tr key={iIdx}>
                        <td className="border border-black px-1 py-0.5 uppercase truncate max-w-[60mm]">
                          {item.name} {item.count > 1 ? `(${item.count}m)` : ""}
                        </td>
                        <td className="border border-black px-1 py-0.5 text-right font-bold">{Number(item.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                {extraCharges?.map((ex, exIdx) => (
                  <tr key={exIdx} className="italic text-gray-600">
                    <td className="border border-black px-1 py-0.5">{ex.name} (Other)</td>
                    <td className="border border-black px-1 py-0.5 text-right font-bold">{Number(ex.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

  <div className="mt-[20px] border-[1.5px] border-black flex flex-col">
            <div className="flex">
               <div className="w-[65%] p-1 border-r border-black">
                  <p className="text-[6px] font-black uppercase text-green-700">In Words:</p>
                  <p className="text-[7.5px] font-black italic leading-tight text-blue-900 leading-none">
                    {numberToWords(received)}
                  </p>
                  <div className="flex items-end justify-between mt-2">
                    <QRCode value={`STU:${studentId}|AMT:${received}|DATE:${date}`} size={35} bordered={false} />
                    <div className="text-center">
                      <div className="w-20 border-t border-black text-[6px] font-black uppercase pt-0.5">Authorized Sign</div>
                    </div>
                  </div>
               </div>
               
               <div className="w-[35%] font-bold text-[8px]">
                  <div className="flex justify-between px-1 py-0.5 border-b border-gray-300 italic"><span>Monthly Fee</span> <span>{Number(currentTotal).toFixed(2)}</span></div>
                  <div className="flex justify-between px-1 py-0.5 border-b border-gray-300 text-red-600"><span>Prev. Dues</span> <span>{Number(oldBalance).toFixed(2)}</span></div>
                  {discount > 0 && <div className="flex justify-between px-1 py-0.5 border-b border-gray-300 text-green-600"><span>Discount</span> <span>-{Number(discount).toFixed(2)}</span></div>}
                  <div className="flex justify-between px-1 py-1 bg-blue-50 border-b border-black font-black text-blue-800"><span>TOTAL PAID</span> <span>₹{Number(received).toFixed(2)}</span></div>
                  <div className="flex justify-between px-1 py-1 bg-yellow-300 font-black"><span>BALANCE</span> <span>₹{Number(balance).toFixed(2)}</span></div>
               </div>
            </div>
          </div>


          </div>

          {/* SUMMARY SECTION */}
        
          <div className="text-center mt-1 text-[5px] font-black opacity-30 tracking-widest uppercase italic">
            Powered by vtech250 ERP Solutions
          </div>

        </div>
      </div>

      <style>{`
        @media print {
          @page { size: 105mm 148mm; margin: 0; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          #print-area { 
            width: 105mm !important; 
            height: 148mm !important;
            padding: 4mm !important;
            margin: 0 !important;
            border: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
