import React, { useState } from 'react';
import { useApp } from '../context';
import { WowRecord } from '../types';
import { OWNER_PASSWORD } from '../constants';

const WowView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { students, wowRecords, bookings, setBookings, updateWowDataFromGraph, setWowRecords } = useApp();
  
  // Override Modal State
  const [overrideModal, setOverrideModal] = useState<{ visible: boolean; mobile: string }>({ visible: false, mobile: '' });
  const [newRate, setNewRate] = useState('');
  const [fixedTotal, setFixedTotal] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-area');
    if (!element) return;
    element.classList.add('pdf-export');
    const opt = {
      margin: 5, // mm
      filename: 'Wow_Allocation.pdf',
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

  const handleSeatInputChange = (mobile: string, value: string) => {
    const trimmedValue = value.trim();
    const student = students.find(s => s.mobileNumber === mobile);
    if (!student) return;

    const originalBookings = bookings.filter(b => b.mobile === mobile);
    const originalSeatNo = originalBookings.length > 0 ? originalBookings[0].seat : '';

    if (!trimmedValue) {
        // Clear bookings
        setBookings(prev => prev.filter(b => b.mobile !== mobile));
        updateWowDataFromGraph(mobile);
        return;
    }

    let seatNo = 0, shiftNo = 0, isSingle = false;
    if (trimmedValue.includes('.')) {
        isSingle = true;
        const parts = trimmedValue.split('.');
        seatNo = parseInt(parts[0]);
        shiftNo = parseInt(parts[1]);
        if (isNaN(seatNo) || seatNo <= 0 || isNaN(shiftNo) || ![1, 2, 3, 4].includes(shiftNo)) {
            alert("अमान्य प्रारूप। 'Seat.Shift' का उपयोग करें (जैसे, 5.1)।"); return;
        }
    } else {
        seatNo = parseInt(trimmedValue);
        if (isNaN(seatNo) || seatNo <= 0) { alert("अमान्य सीट संख्या।"); return; }
    }

    if (isSingle) {
        // Validation logic from original
        if (originalBookings.length > 0 && originalBookings.some(b => b.seat !== seatNo)) {
             alert(`यह छात्र सीट ${originalSeatNo} पर है। कृपया पिछली बुकिंग साफ़ करें।`); return;
        }
        if (originalBookings.some(b => b.seat === seatNo && b.shift === shiftNo)) {
             alert(`छात्र के पास पहले से ही सीट ${seatNo}, शिफ्ट ${shiftNo} बुक है।`); return;
        }
        const isTaken = bookings.some(b => b.seat === seatNo && b.shift === shiftNo && b.mobile !== mobile);
        if (isTaken) { alert(`त्रुटि: सीट ${seatNo}, शिफ्ट ${shiftNo} occupied.`); return; }

        setBookings(prev => [...prev, { seat: seatNo, shift: shiftNo, mobile, name: student.fullName!, address: student.address }]);
        alert(`सीट ${seatNo}, शिफ्ट ${shiftNo} के लिए बुकिंग जोड़ दी गई है।`);
    } else {
        // Full day allocation
        const conflicts = bookings.filter(b => b.seat === seatNo && b.mobile !== mobile);
        if (conflicts.length > 0) {
            alert(`त्रुटि: सीट ${seatNo} occupied on shifts: ${conflicts.map(c => c.shift).join(',')}.`); return;
        }
        
        // Remove existing, add 4 shifts
        setBookings(prev => {
            const filtered = prev.filter(b => b.mobile !== mobile);
            const newBookings = [1, 2, 3, 4].map(s => ({ seat: seatNo, shift: s, mobile, name: student.fullName!, address: student.address }));
            return [...filtered, ...newBookings];
        });
        alert(`${student.fullName} को सीट ${seatNo} के लिए पूरा दिन आवंटित किया गया।`);
    }
  };

  const handlePaymentDoubleClick = (mobile: string) => {
    const record = wowRecords.find(r => r.mobile === mobile);
    if (!record || record.shifts === 0) { alert("पहले सीट/शिफ्ट आवंटित करें।"); return; }
    
    setOverrideModal({ visible: true, mobile });
    setNewRate(record.customRate ? record.customRate.toString() : '');
    setFixedTotal(record.fixedTotalPayment ? record.fixedTotalPayment.toString() : '');
    setAdminPass('');
  };

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass !== OWNER_PASSWORD) { alert("Incorrect Admin Password!"); return; }
    
    const { mobile } = overrideModal;
    setWowRecords(prev => prev.map(r => r.mobile === mobile ? { 
        ...r, 
        customRate: parseInt(newRate) || 0, 
        fixedTotalPayment: parseInt(fixedTotal) || 0 
    } : r));
    
    setTimeout(() => updateWowDataFromGraph(mobile), 0);
    setOverrideModal({ visible: false, mobile: '' });
    alert("Payment Overrides Saved!");
  };

  const handleClearOverride = () => {
    const pwd = prompt("Overrides हटाने के लिए Admin Password दर्ज करें:");
    if (pwd !== OWNER_PASSWORD) { alert("Incorrect Admin Password!"); return; }
    
    const { mobile } = overrideModal;
    setWowRecords(prev => prev.map(r => r.mobile === mobile ? { ...r, customRate: 0, fixedTotalPayment: 0 } : r));
    setTimeout(() => updateWowDataFromGraph(mobile), 0);
    setOverrideModal({ visible: false, mobile: '' });
    alert("Overrides cleared.");
  };

  return (
    <div className="main-panel-content w-full max-w-[1200px] mx-auto bg-[rgba(17,18,23,0.9)] p-5 rounded-xl border border-[#00bcd4] shadow-2xl">
      <div id="printable-area">
        <h3 className="mt-0 text-[#ff2a6d] font-bold text-xl print:text-black">WOW Seat Allocation & Booking</h3>
        
        <div className="data-table-container overflow-x-auto max-h-[50vh]">
            <table id="wowTable" className="w-full border-collapse min-w-[1000px] text-white print:text-black">
            <thead>
                <tr>
                {['Seat No', 'Full Name', 'Father Name', 'Address', 'Mobile No.', 'Batch Time (Shifts)', 'Shifts', 'Payment'].map((h, i) => (
                    <th key={h} className="p-[12px_15px] text-left border-b-[3px] bg-white text-black font-bold sticky top-0 shadow-md whitespace-nowrap print:border-black" style={{ borderColor: ['#663399', '#ff2a6d', '#17a2b8', '#ffc107', '#00bcd4', '#FF5722', '#009688', '#FFC107'][i] }}>{h}</th>
                ))}
                </tr>
            </thead>
            <tbody>
                {students.map((student, index) => {
                    const wow = wowRecords.find(r => r.mobile === student.mobileNumber);
                    const isAssigned = wow && wow.seatNo;
                    const bookingsForStudent = bookings.filter(b => b.mobile === student.mobileNumber).sort((a,b) => a.shift - b.shift);
                    
                    let displaySeat = '';
                    if (bookingsForStudent.length === 4) displaySeat = wow?.seatNo || '';
                    else if (bookingsForStudent.length > 0) displaySeat = `${wow?.seatNo}.${bookingsForStudent[0].shift}`;

                    return (
                        <tr key={index} className={`even:bg-[#f0f0f0] odd:bg-white text-black hover:bg-[#fff1c8] print:odd:bg-[#f9f9f9] ${isAssigned ? '!bg-[#d1e5f0]' : ''}`}>
                            <td className="p-3 border-b border-[rgba(0,0,0,0.1)]">
                                <input 
                                    className="bg-[#f8f8f8] border border-[#ccc] text-black p-[5px] w-[90%] rounded text-center" 
                                    placeholder="Seat or S.Shift" 
                                    defaultValue={displaySeat} 
                                    onBlur={(e) => handleSeatInputChange(student.mobileNumber, e.target.value)}
                                    onKeyDown={(e) => { if(e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                />
                            </td>
                            <td className="p-3 border-b border-[rgba(0,0,0,0.1)]">{student.fullName || '--- REMOVED ---'}</td>
                            <td className="p-3 border-b border-[rgba(0,0,0,0.1)]">{student.fatherName || '--- REMOVED ---'}</td>
                            <td className="p-3 border-b border-[rgba(0,0,0,0.1)]">{student.address || '--- REMOVED ---'}</td>
                            <td className="p-3 border-b border-[rgba(0,0,0,0.1)]">{student.mobileNumber}</td>
                            <td className="p-3 border-b border-[rgba(0,0,0,0.1)]">
                                <textarea readOnly className="bg-[#f8f8f8] border border-[#ccc] text-black text-center w-full block mb-[5px] p-[5px] rounded h-auto resize-none" value={wow?.batchString || 'N/A'} />
                            </td>
                            <td className="p-3 border-b border-[rgba(0,0,0,0.1)]">{wow?.shifts || 0} Shifts</td>
                            <td 
                                className="p-3 border-b border-[rgba(0,0,0,0.1)] cursor-pointer font-bold relative group"
                                onDoubleClick={() => { if(wow && wow.shifts > 0) handlePaymentDoubleClick(student.mobileNumber); }}
                            >
                                ₹{wow?.payment || 0}
                                {wow?.fixedTotalPayment! > 0 && <span className="block text-[0.7em] text-[#f44336]">(Fixed Total)</span>}
                                {wow?.customRate! > 0 && <span className="block text-[0.7em] text-[#009688]">(Rate: ₹{wow?.customRate})</span>}
                                <span className="invisible group-hover:visible absolute bg-black text-white text-xs rounded p-1 top-full left-0 z-10 no-print">Double click to override</span>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
            </table>
        </div>
      </div>

      <div className="action-buttons-footer flex justify-between items-center mt-5 no-print">
        <button onClick={onBack} className="back-btn p-[10px_20px] bg-transparent border-2 border-[#00bcd4] text-[#00bcd4] rounded-[10px] font-bold hover:bg-[#00bcd4] hover:text-[#0b0c10]"><i className="fas fa-arrow-left"></i> Back</button>
        <button onClick={handleDownloadPDF} className="print-btn p-[10px_20px] bg-[#1976D2] text-white border-none rounded-[10px] font-bold hover:bg-[#1565C0]"><i className="fas fa-file-pdf"></i> Download PDF</button>
      </div>

      {overrideModal.visible && (
        <div className="modal-overlay fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.8)] flex justify-center items-center z-[1000]">
            <div className="modal-content bg-[#1e1e2d] p-8 rounded-[15px] max-w-[450px] w-[90%] border-2 border-[#ff2a6d] text-white">
                <div className="modal-header text-center text-[#00bcd4] text-xl font-black mb-5">Payment Override</div>
                <p className="text-center mb-5">Student: {students.find(s => s.mobileNumber === overrideModal.mobile)?.fullName}</p>
                <form onSubmit={handleOverrideSubmit}>
                    <div className="border-t border-[rgba(255,255,255,0.2)] py-2 mt-2">
                        <h4 className="text-[#00bcd4] m-0">1. Per-Shift Rate Override</h4>
                        <input type="number" placeholder="New Rate (e.g. 250)" value={newRate} onChange={e => setNewRate(e.target.value)} className="modal-input w-full p-2 mt-2 rounded bg-[rgba(255,255,255,0.05)] border border-[#00bcd4] text-white"/>
                    </div>
                    <div className="border-t border-[rgba(255,255,255,0.2)] py-2 mt-2">
                        <h4 className="text-[#00bcd4] m-0">2. Fixed Total Payment</h4>
                        <input type="number" placeholder="Fixed Total (e.g. 500)" value={fixedTotal} onChange={e => setFixedTotal(e.target.value)} className="modal-input w-full p-2 mt-2 rounded bg-[rgba(255,255,255,0.05)] border border-[#00bcd4] text-white"/>
                    </div>
                    <input type="password" placeholder="Admin Password" required value={adminPass} onChange={e => setAdminPass(e.target.value)} className="modal-input w-full p-2 mt-5 rounded bg-[rgba(255,255,255,0.05)] border border-[#00bcd4] text-white"/>
                    <button type="submit" className="modal-submit-btn w-full p-3 mt-4 rounded bg-gradient-to-tr from-[#4CAF50] to-[#00bcd4] text-black font-bold">SAVE OVERRIDE</button>
                    <button type="button" onClick={handleClearOverride} className="modal-submit-btn w-full p-3 mt-2 rounded bg-[#dc3545] text-white font-bold">CLEAR ALL OVERRIDES</button>
                    <button type="button" onClick={() => setOverrideModal({visible: false, mobile: ''})} className="w-full p-2 mt-2 border border-[#00bcd4] text-[#00bcd4] rounded font-bold hover:bg-[#00bcd4] hover:text-black">Cancel</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default WowView;