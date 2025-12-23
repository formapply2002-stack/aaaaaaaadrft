import React from 'react';
import { useApp } from '../context';

const PayDetails: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { students, payments, wowRecords } = useApp();
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Generate headers for last 3 months
  const monthHeaders = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(currentYear, currentMonth - i, 1);
    monthHeaders.push({ name: monthNames[d.getMonth()], month: d.getMonth() + 1, year: d.getFullYear() });
  }

  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-area');
    if (!element) return;
    element.classList.add('pdf-export');
    const opt = {
      margin: 5, // mm
      filename: 'Payment_Due_Details.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: 'avoid-all' }
    };
    // @ts-ignore
    window.html2pdf().set(opt).from(element).save().then(() => {
        element.classList.remove('pdf-export');
    });
  };

  return (
    <div className="main-panel-content w-full max-w-[1200px] mx-auto bg-[rgba(17,18,23,0.9)] p-5 rounded-xl border border-[#00bcd4] shadow-2xl">
      <div id="printable-area">
        <h3 className="mt-0 text-[#f44336] font-bold text-xl print:text-black">Payment Due Details</h3>
        
        <div className="data-table-container overflow-x-auto max-h-[50vh]">
            <table id="payDetailsTable" className="w-full border-collapse min-w-[1000px] text-white print:text-black">
            <thead>
                <tr>
                <th className="border-b-[3px] border-[#f44336] bg-white text-black font-bold p-[12px_15px] sticky top-0 print:border-black">RM</th>
                <th className="border-b-[3px] border-[#663399] bg-white text-black font-bold p-[12px_15px] sticky top-0 print:border-black">MD</th>
                <th className="border-b-[3px] border-[#ff2a6d] bg-white text-black font-bold p-[12px_15px] sticky top-0 print:border-black">SI</th>
                <th className="border-b-[3px] border-[#17a2b8] bg-white text-black font-bold p-[12px_15px] sticky top-0 print:border-black">Full Name</th>
                <th className="border-b-[3px] border-[#ffc107] bg-white text-black font-bold p-[12px_15px] sticky top-0 print:border-black">Address / Mobile</th>
                <th className="border-b-[3px] border-[#00bcd4] bg-white text-black font-bold p-[12px_15px] sticky top-0 print:border-black">Admission Due</th>
                <th colSpan={3} className="border-b-[3px] border-black bg-white text-black font-bold p-[12px_15px] sticky top-0 print:border-black">Payment Status (Last 3 Months)</th>
                </tr>
                <tr>
                <th colSpan={6} className="bg-white"></th>
                {monthHeaders.map((h, i) => (
                    <th key={i} className="bg-[#e0e0e0] text-black font-normal text-sm p-2 border border-gray-300 print:border-black">{h.name} {String(h.year).slice(-2)}</th>
                ))}
                </tr>
            </thead>
            <tbody>
                {students.map((student, index) => {
                    const admissionDate = new Date(student.admissionDate);
                    let monthsSince = (today.getFullYear() - admissionDate.getFullYear()) * 12 + (today.getMonth() - admissionDate.getMonth());
                    if (today.getDate() < admissionDate.getDate()) monthsSince--;
                    const paidCount = payments.filter(p => p.mobile === student.mobileNumber).length;
                    const md = Math.max(0, monthsSince - paidCount);

                    // Due status
                    const dueDay = new Date(today.getFullYear(), today.getMonth(), admissionDate.getDate());
                    const dayDiff = Math.floor((dueDay.getTime() - today.getTime()) / (1000 * 3600 * 24));
                    let statusEl;
                    if (dayDiff > 0) statusEl = <span className="text-[#28a745] font-bold">{dayDiff} days after</span>;
                    else if (dayDiff === 0) statusEl = <span className="text-[#fd7e14] font-bold">Due Today</span>;
                    else statusEl = <span className="text-[#dc3545] font-bold">{Math.abs(dayDiff)} days late</span>;

                    // RM (Reminder) Calculation
                    const partials = payments.filter(p => p.mobile === student.mobileNumber && p.requiredAmount > p.paidAmount);
                    // Sort partials chronologically
                    partials.sort((a, b) => {
                        if (a.year !== b.year) return a.year - b.year;
                        return a.month - b.month;
                    });

                    let rmDisplay = <span className="text-gray-400">-</span>;
                    
                    if (partials.length > 0) {
                        const amounts = partials.map(p => (p.requiredAmount - p.paidAmount));
                        const months = partials.map(p => monthNames[p.month - 1]);

                        if (partials.length === 1) {
                            rmDisplay = <span className="text-[#ffc107] font-bold text-sm">{amounts[0]}({months[0]})</span>;
                        } else {
                            rmDisplay = (
                                <div className="flex flex-col items-center justify-center leading-tight">
                                    <span className="text-[#ffc107] font-bold text-sm whitespace-nowrap">{amounts.join('+')}</span>
                                    <span className="text-[#ffc107] font-bold text-[0.7rem] whitespace-nowrap">({months.join(',')})</span>
                                </div>
                            );
                        }
                    }
                    
                    // Name display with WOW info
                    const wow = wowRecords.find(w => w.mobile === student.mobileNumber);
                    const hasWow = wow && wow.seatNo && wow.shifts > 0;

                    return (
                        <tr key={index} className="even:bg-[#f0f0f0] odd:bg-white text-black hover:bg-[#e6f7ff] print:odd:bg-[#f9f9f9]">
                            <td className="p-3 border border-gray-200 text-center align-middle">{rmDisplay}</td>
                            <td className="p-3 border border-gray-200">{md}</td>
                            <td className="p-3 border border-gray-200">{index + 1}</td>
                            <td className="p-3 border border-gray-200">
                                {student.fullName || '--- REMOVED ---'}
                                {hasWow && (
                                    <span className="ml-1">
                                        (<span className="text-blue-600 font-bold">{wow.seatNo}</span>-<span className="text-red-600 font-bold">{wow.shifts}</span>)
                                        {(wow.fixedTotalPayment > 0 || wow.customRate > 0) && <span className="text-[#009688] font-bold">*</span>}
                                    </span>
                                )}
                            </td>
                            <td className="p-3 border border-gray-200 text-sm leading-tight">{student.address || '---'}<br/>{student.mobileNumber}</td>
                            <td className="p-3 border border-gray-200">{statusEl}</td>
                            {monthHeaders.map((h, i) => {
                                const p = payments.find(pay => pay.mobile === student.mobileNumber && pay.year === h.year && pay.month === h.month);
                                return (
                                    <td key={i} className="p-3 border border-gray-200 text-center font-bold text-lg text-[#4caf50]">
                                        {p ? '✓' : ''}
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
            </tbody>
            </table>
        </div>
      </div>

      <div className="action-buttons-footer flex justify-between items-center mt-5 no-print">
        <button onClick={onBack} className="back-btn p-[10px_20px] bg-transparent border-2 border-[#00bcd4] text-[#00bcd4] rounded-[10px] font-bold hover:bg-[#00bcd4] hover:text-[#0b0c10]"><i className="fas fa-arrow-left"></i> Back</button>
        <div className="text-[1.2rem] font-bold text-[#00bcd4]">Due Details</div>
        <button onClick={handleDownloadPDF} className="print-btn p-[10px_20px] bg-[#1976D2] text-white border-none rounded-[10px] font-bold hover:bg-[#1565C0]"><i className="fas fa-file-pdf"></i> Download PDF</button>
      </div>
    </div>
  );
};

export default PayDetails;