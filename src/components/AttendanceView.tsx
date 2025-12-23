import React, { useState } from 'react';
import { useApp } from '../context';

const AttendanceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { students, attendance, wowRecords } = useApp();
  const [detailMode, setDetailMode] = useState<{ active: boolean; mobile: string }>({ active: false, mobile: '' });

  // Helper to get local date string YYYY-MM-DD
  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const dateHeaders = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - i);
    return d;
  });

  const getAttendanceStatus = (mobile: string, dateStr: string) => {
    const record = attendance.find(a => a.mobile === mobile && a.date === dateStr);
    if (record && record.times.length > 0) {
        return record.times.map(t => {
            if (t.out) return `${t.in} - ${t.out}`;
            return `${t.in} In`;
        }).join(' / ');
    }
    return null;
  };

  const getMonthlyStats = (mobile: string) => {
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    let present = 0, absent = 0;
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(today.getFullYear(), today.getMonth(), d);
        if (date > today) continue;
        const dateStr = formatDateKey(date);
        const rec = attendance.find(a => a.mobile === mobile && a.date === dateStr);
        if (rec && rec.times.length > 0) present++;
        else absent++;
    }
    return { present, absent };
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-area');
    if (!element) return;
    element.classList.add('pdf-export');
    const opt = {
      margin: 5, // mm
      filename: 'Attendance_Log.pdf',
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

  if (detailMode.active) {
    const student = students.find(s => s.mobileNumber === detailMode.mobile);
    const stats = getMonthlyStats(detailMode.mobile);
    const monthName = today.toLocaleString('default', { month: 'long' });
    const year = today.getFullYear();
    const daysInMonth = new Date(year, today.getMonth() + 1, 0).getDate();
    const startDay = new Date(year, today.getMonth(), 1).getDay();

    const handleDetailPDF = () => {
        const element = document.getElementById('detail-print-area');
        if (!element) return;
        element.classList.add('pdf-export');
        const opt = {
          margin: 5,
          filename: `Attendance_${student?.fullName}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: 'avoid-all' }
        };
        // @ts-ignore
        window.html2pdf().set(opt).from(element).save().then(() => {
            element.classList.remove('pdf-export');
        });
    };

    return (
        <div className="main-panel-content w-full max-w-[900px] mx-auto bg-[rgba(17,18,23,0.95)] p-0 rounded-xl border-none">
            <div id="detail-print-area">
                <div className="text-center p-5 mb-5 bg-[#1e1e2d] border-2 border-[#ff2a6d] rounded-[10px]">
                    <div className="text-[1.5rem] font-black text-[#00bcd4] mb-2">{student?.fullName}</div>
                    <div className="flex justify-around items-center border-t border-[rgba(255,255,255,0.2)] pt-2">
                        <div className="text-[1.1rem] font-bold text-[#ff2a6d]">Absent Days: {stats.absent}</div>
                        <div className="text-[1.1rem] font-bold text-[#663399]">Present Days: {stats.present}</div>
                    </div>
                </div>
                
                <div className="p-4 bg-white rounded-lg">
                    <h4 className="text-[#00bcd4] text-center mb-2 font-bold">{monthName} {year} Attendance</h4>
                    <div className="grid grid-cols-7 gap-1 p-2 border border-gray-200 rounded">
                        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-center font-bold text-[#00bcd4] text-sm">{d}</div>)}
                        {Array.from({length: startDay}).map((_, i) => <div key={`pad-${i}`} className="aspect-[1/1.5] bg-[#e0e0e0] rounded"></div>)}
                        {Array.from({length: daysInMonth}, (_, i) => {
                            const d = i + 1;
                            const date = new Date(year, today.getMonth(), d);
                            const dateStr = formatDateKey(date);
                            const status = getAttendanceStatus(detailMode.mobile, dateStr);
                            let bgClass = 'bg-[#f8d7da] text-[#721c24]'; // Absent
                            let content = 'ABSENT';
                            
                            if (date > today) {
                                bgClass = 'bg-[#e0e0e0] text-[#666]';
                                content = '---';
                            } else if (status) {
                                bgClass = 'bg-[#d4edda] text-[#155724]';
                                content = status;
                            }

                            return (
                                <div key={d} className={`aspect-[1/1.5] rounded p-1 flex flex-col items-center justify-start text-xs border border-gray-300 shadow-sm ${bgClass}`}>
                                    <div className="font-black text-black text-base">{d}</div>
                                    <div className="leading-tight text-center break-words w-full h-full text-[0.55rem] flex items-center justify-center overflow-hidden px-1">{content}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            <div className="action-buttons-footer flex justify-between items-center mt-5 p-4 no-print">
                <button onClick={() => setDetailMode({active: false, mobile: ''})} className="back-btn p-[10px_20px] bg-transparent border-2 border-[#00bcd4] text-[#00bcd4] rounded-[10px] font-bold hover:bg-[#00bcd4] hover:text-[#0b0c10]"><i className="fas fa-arrow-left"></i> Back to Log</button>
                <div className="text-[1.2rem] font-bold text-[#00bcd4]">Monthly Details</div>
                <button onClick={handleDetailPDF} className="print-btn p-[10px_20px] bg-[#1976D2] text-white border-none rounded-[10px] font-bold hover:bg-[#1565C0]"><i className="fas fa-file-pdf"></i> Download PDF</button>
            </div>
        </div>
    );
  }

  return (
    <div className="main-panel-content w-full max-w-[1200px] mx-auto bg-[rgba(17,18,23,0.9)] p-5 rounded-xl border border-[#00bcd4] shadow-2xl">
      <div id="printable-area">
        <h3 className="mt-0 text-[#17a2b8] font-bold text-xl print:text-black">Student Attendance Details</h3>
        
        <div className="data-table-container overflow-x-auto max-h-[60vh]">
            <table id="attendanceTable" className="w-full border-collapse min-w-[1000px] text-white print:text-black">
            <thead>
                <tr>
                <th colSpan={2} className="text-center p-2 bg-white text-black font-bold border-b border-black">Log</th>
                <th colSpan={6} className="text-center p-2 bg-white text-black font-bold border-b border-black">Last 6 Days (Newest to Oldest)</th>
                </tr>
                <tr>
                <th className="p-2 bg-[#f0f0f0] text-black border border-gray-300 w-[5%] border-b-[3px] border-b-[#f44336] sticky top-0">Absent No.</th>
                <th className="p-2 bg-[#f0f0f0] text-black border border-gray-300 w-[20%] border-b-[3px] border-b-[#663399] sticky top-0">Full Name</th>
                {dateHeaders.map((d, i) => (
                    <th key={i} className="p-2 bg-[#e0e0e0] text-black border border-gray-300 border-b-[3px] border-b-[#ff2a6d] sticky top-0">{d.getDate()} ({d.toDateString().slice(0,3)})</th>
                ))}
                </tr>
            </thead>
            <tbody>
                {students.map((student, index) => {
                    const { absent } = getMonthlyStats(student.mobileNumber);
                    const wow = wowRecords.find(w => w.mobile === student.mobileNumber);
                    const hasWow = wow && wow.seatNo && wow.shifts > 0;

                    return (
                        <tr key={index} onDoubleClick={() => setDetailMode({active: true, mobile: student.mobileNumber})} className="even:bg-[#f0f0f0] odd:bg-white text-black hover:bg-[#e6f7ff] cursor-pointer print:odd:bg-[#f9f9f9]">
                            <td className="p-3 border border-gray-200 text-center font-black text-[#dc3545] text-lg">{absent}</td>
                            <td className="p-3 border border-gray-200">
                                {index + 1}. {student.fullName || '--- REMOVED ---'}
                                {hasWow && <div className="text-xs text-gray-500 mt-1">Seat: <b className="text-blue-600">{wow.seatNo}</b> - Shift(s): <b className="text-red-600">{wow.shifts}</b></div>}
                            </td>
                            {dateHeaders.map((d, i) => {
                                const dateStr = formatDateKey(d);
                                const status = getAttendanceStatus(student.mobileNumber, dateStr);
                                const isToday = d.toDateString() === today.toDateString();
                                return (
                                    <td key={i} className={`p-3 border border-gray-200 text-center text-sm ${status ? 'text-green-800 bg-green-100 font-bold' : 'text-red-800 bg-red-50 font-bold'}`}>
                                        {status ? status : (isToday ? 'Pending' : 'A')}
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
        <button onClick={onBack} className="back-btn p-[10px_20px] bg-transparent border-2 border-[#00bcd4] text-[#00bcd4] rounded-[10px] font-bold hover:bg-[#00bcd4] hover:text-[#0b0c10]"><i className="fas fa-arrow-left"></i> Back to Dashboard</button>
        <div className="text-[1.2rem] font-bold text-[#00bcd4]">In Room</div>
        <button onClick={handleDownloadPDF} className="print-btn p-[10px_20px] bg-[#1976D2] text-white border-none rounded-[10px] font-bold hover:bg-[#1565C0]"><i className="fas fa-file-pdf"></i> Download PDF</button>
      </div>
    </div>
  );
};

export default AttendanceView;