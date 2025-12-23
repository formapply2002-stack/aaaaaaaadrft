import React, { useState } from 'react';
import { useApp } from '../context';
import { OWNER_PASSWORD } from '../constants';
import { Student } from '../types';

const PDetails: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { students, payments, setPayments, getRequiredAmount, wowRecords } = useApp();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();

  // Modal State
  const [modal, setModal] = useState<{ 
    visible: boolean; 
    student: Student | null; 
    monthIndex: number;
    currentPaid: number;
    requiredTotal: number;
  }>({ 
    visible: false, student: null, monthIndex: -1, currentPaid: 0, requiredTotal: 0
  });

  const [paymentType, setPaymentType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [partialAmount, setPartialAmount] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-area');
    if (!element) return;
    element.classList.add('pdf-export');
    const opt = {
      margin: 5, // mm
      filename: 'Detailed_Payment_Marking.pdf',
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

  const handleCellDoubleClick = (student: Student, monthIndex: number) => {
    const year = currentYear;
    const admissionDate = new Date(student.admissionDate);
    
    // Check pre-admission logic
    const admMonth = admissionDate.getMonth();
    const admYear = admissionDate.getFullYear();
    let isPreAdmission = false;
    if (year < admYear) isPreAdmission = true;
    else if (year === admYear && monthIndex < admMonth) isPreAdmission = true;

    if (isPreAdmission) {
        alert("Cannot mark payment before admission date.");
        return;
    }

    const month = monthIndex + 1;
    const existingPayment = payments.find(p => p.mobile === student.mobileNumber && p.year === year && p.month === month);
    
    // LOGIC: If Fully Paid (Green Tick), do NOT show popup.
    if (existingPayment && existingPayment.paidAmount >= existingPayment.requiredAmount) {
        return;
    }

    const currentPaid = existingPayment ? existingPayment.paidAmount : 0;
    // Use existing requirement if saved, else calculate from WOW
    const requiredTotal = existingPayment ? existingPayment.requiredAmount : getRequiredAmount(student.mobileNumber);

    setModal({ 
        visible: true, 
        student, 
        monthIndex,
        currentPaid,
        requiredTotal
    });
    setPaymentType('FULL');
    setPartialAmount('');
    setAdminPass('');
  };

  const getFormattedTimestamp = () => {
    const d = new Date();
    // Format: 12/12/25 2:10pm
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    const time = d.toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit', hour12: true}).toLowerCase();
    return `${day}/${month}/${year} ${time}`;
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal.student) return;

    if (adminPass !== OWNER_PASSWORD) {
        alert("Incorrect Admin Password!");
        return;
    }

    const year = currentYear;
    const month = modal.monthIndex + 1;
    
    let finalAmount = 0;
    const outstanding = modal.requiredTotal - modal.currentPaid;

    if (paymentType === 'FULL') {
        // Full Payment: Pay the outstanding amount to reach total
        finalAmount = modal.requiredTotal; 
    } else {
        const inputAmount = parseInt(partialAmount);
        if (isNaN(inputAmount) || inputAmount < 0) {
            alert("Invalid amount entered.");
            return;
        }
        // Partial Payment: Add input to current
        finalAmount = modal.currentPaid + inputAmount;
    }

    const timestamp = getFormattedTimestamp();

    setPayments(prev => {
        const others = prev.filter(p => !(p.mobile === modal.student!.mobileNumber && p.year === year && p.month === month));
        return [...others, {
            mobile: modal.student!.mobileNumber,
            year,
            month,
            paidAmount: finalAmount,
            requiredAmount: modal.requiredTotal,
            timestamp: timestamp // Save timestamp
        }];
    });

    setModal({ visible: false, student: null, monthIndex: -1, currentPaid: 0, requiredTotal: 0 });
  };

  // Calculate outstanding amount for the modal display
  const outstanding = modal.requiredTotal - modal.currentPaid;

  return (
    <div className="main-panel-content w-full max-w-[1200px] mx-auto bg-[rgba(17,18,23,0.9)] p-2 md:p-5 rounded-xl border border-[#00bcd4] shadow-2xl">
      <div id="printable-area">
        <h3 className="mt-0 text-[#f44336] font-bold text-xl print:text-black mb-4">Detailed Payment Marking ({currentYear})</h3>
        
        <div className="data-table-container overflow-x-auto max-h-[60vh] custom-scrollbar">
            <table className="w-full border-collapse min-w-[1000px] text-black print:text-black">
            <thead>
                <tr>
                    <th className="p-[12px_15px] border-b-[3px] bg-white text-black font-bold sticky top-0" style={{backgroundColor: '#F44336', color: 'white'}}>SI</th>
                    <th className="p-[12px_15px] border-b-[3px] bg-white text-black font-bold sticky top-0" style={{backgroundColor: '#663399', color: 'white'}}>Full Name</th>
                    <th className="p-[12px_15px] border-b-[3px] bg-white text-black font-bold sticky top-0" style={{backgroundColor: '#E91E63', color: 'white'}}>Address / Mobile</th>
                    <th colSpan={12} className="p-[12px_15px] border-b-[3px] bg-white text-black font-bold sticky top-0 print:border-black">Payment Status</th>
                </tr>
                <tr>
                    <th colSpan={3} className="bg-white"></th>
                    {monthNames.map(m => <th key={m} className="bg-[#e0e0e0] text-black text-[10px] p-1 border border-gray-400">{m}</th>)}
                </tr>
            </thead>
            <tbody>
                {students.map((student, index) => {
                    const admissionDate = new Date(student.admissionDate);
                    const admMonth = admissionDate.getMonth(); // 0-11
                    const admYear = admissionDate.getFullYear();

                    return (
                        <tr key={index} className="even:bg-[#f0f0f0] odd:bg-white text-black hover:bg-[#e6f7ff] transition-colors">
                            <td className="p-3 border border-gray-200 text-center">{index + 1}</td>
                            <td className="p-3 border border-gray-200">{student.fullName || '---'}</td>
                            <td className="p-3 border border-gray-200 text-sm">{student.address || '-'}<br/><span className="text-[#00bcd4]">{student.mobileNumber}</span></td>
                            {monthNames.map((_, mIdx) => {
                                let content: React.ReactNode = '';
                                let cellClass = 'p-1 border border-gray-200 text-center cursor-pointer select-none align-middle h-[60px] min-w-[80px]';
                                
                                // Calculate if this month is before admission
                                let isPreAdmission = false;
                                if (currentYear < admYear) {
                                    isPreAdmission = true;
                                } else if (currentYear === admYear && mIdx < admMonth) {
                                    isPreAdmission = true;
                                }

                                const payment = payments.find(p => p.mobile === student.mobileNumber && p.year === currentYear && p.month === mIdx + 1);

                                if (isPreAdmission) {
                                    content = '-';
                                    cellClass += ' text-gray-400 bg-gray-100 cursor-not-allowed';
                                } else {
                                    if (payment && payment.paidAmount >= payment.requiredAmount) {
                                        // Fully Paid
                                        content = (
                                            <div className="flex flex-col items-center justify-center w-full h-full">
                                                <span className="text-xl leading-none mb-1">✓</span>
                                                {payment.timestamp && (
                                                    <span className="text-[9px] font-normal leading-tight text-black opacity-80">
                                                        {payment.timestamp}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                        cellClass += ' text-green-600 font-bold bg-green-50';
                                    } else if (payment && payment.paidAmount > 0) {
                                        // Partially Paid
                                        content = (
                                            <div className="flex flex-col items-center justify-center w-full h-full">
                                                <span className="text-sm leading-none mb-1">{payment.paidAmount}</span>
                                                {payment.timestamp && (
                                                    <span className="text-[9px] font-normal leading-tight text-black opacity-80">
                                                        {payment.timestamp}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                        cellClass += ' text-orange-500 font-bold';
                                    }
                                }

                                return (
                                    <td 
                                        key={mIdx} 
                                        className={cellClass}
                                        onDoubleClick={() => handleCellDoubleClick(student, mIdx)}
                                        title={isPreAdmission ? "Pre-admission" : (payment && payment.paidAmount >= payment.requiredAmount ? "Fully Paid" : "Double click to edit payment")}
                                    >
                                        {content}
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
        <div className="text-white text-sm hidden md:block">* Double click on a cell to mark/edit payment</div>
        <button onClick={handleDownloadPDF} className="print-btn p-[10px_20px] bg-[#1976D2] text-white border-none rounded-[10px] font-bold hover:bg-[#1565C0]"><i className="fas fa-file-pdf"></i> Download PDF</button>
      </div>

      {/* Custom Payment Modal */}
      {modal.visible && modal.student && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[2000] backdrop-blur-sm">
            <div className="bg-[#1a1a2e] w-[90%] max-w-[400px] p-6 rounded-[20px] border-2 border-[#ff2a6d] shadow-[0_0_30px_#ff2a6d] text-white relative animate-fade-in">
                <button 
                    onClick={() => setModal({ visible: false, student: null, monthIndex: -1, currentPaid: 0, requiredTotal: 0 })}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <i className="fas fa-times text-xl"></i>
                </button>

                <h2 className="text-center text-[#00bcd4] font-black text-xl mb-6">
                    Payment for {monthNames[modal.monthIndex]} {currentYear}
                </h2>

                <div className="mb-6 space-y-2">
                    <p className="text-gray-300">
                        Student: <span className="font-bold text-white text-lg">{modal.student.fullName}</span>
                    </p>
                    
                    {/* Amount Display Box */}
                    <div className="bg-white/10 p-3 rounded-lg border border-white/20 mt-2">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Total Fee:</span>
                            <span className="text-white font-bold">₹{modal.requiredTotal}</span>
                        </div>
                        {modal.currentPaid > 0 && (
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Paid:</span>
                                <span className="text-green-400 font-bold">- ₹{modal.currentPaid}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg border-t border-white/20 pt-1 mt-1">
                            {/* "Required Payment me jo reminder amount hona chahiye" */}
                            <span className="text-[#ff2a6d] font-bold">Required (Remaining):</span>
                            <span className="text-[#ff2a6d] font-bold">₹{outstanding}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmitPayment}>
                    <div className="space-y-4 mb-6">
                        <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-transparent hover:bg-white/5 transition-colors">
                            <input 
                                type="radio" 
                                name="paymentType" 
                                checked={paymentType === 'FULL'} 
                                onChange={() => setPaymentType('FULL')}
                                className="w-5 h-5 accent-[#00bcd4]"
                            />
                            <span className="font-bold">
                                {modal.currentPaid > 0 ? `Full Payment (Clear Remaining ₹${outstanding})` : `Full Payment: ₹${modal.requiredTotal}`}
                            </span>
                        </label>

                        <div className="p-3 rounded-lg border border-transparent hover:bg-white/5 transition-colors">
                            <label className="flex items-center space-x-3 cursor-pointer mb-2">
                                <input 
                                    type="radio" 
                                    name="paymentType" 
                                    checked={paymentType === 'PARTIAL'} 
                                    onChange={() => setPaymentType('PARTIAL')}
                                    className="w-5 h-5 accent-[#00bcd4]"
                                />
                                <span className="font-bold">Fill Payment (Add Amount):</span>
                            </label>
                            {paymentType === 'PARTIAL' && (
                                <input 
                                    type="number" 
                                    placeholder="Enter Amount to ADD" 
                                    value={partialAmount}
                                    onChange={(e) => setPartialAmount(e.target.value)}
                                    className="w-full bg-[#0b0c10] border border-[#00bcd4] text-white p-2 rounded-lg focus:outline-none focus:shadow-[0_0_10px_#00bcd4]"
                                    autoFocus
                                />
                            )}
                        </div>
                    </div>

                    <div className="mb-6">
                        <input 
                            type="password" 
                            placeholder="Admin Password" 
                            value={adminPass}
                            onChange={(e) => setAdminPass(e.target.value)}
                            className="w-full bg-[#0b0c10] border border-[#00bcd4] text-white p-3 rounded-lg focus:outline-none focus:shadow-[0_0_10px_#00bcd4]"
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="w-full py-3 bg-gradient-to-r from-[#00bcd4] to-[#009688] text-black font-black text-lg rounded-lg shadow-[0_5px_15px_rgba(0,188,212,0.4)] hover:scale-[1.02] hover:shadow-[0_5px_25px_#00bcd4] transition-all"
                    >
                        SUBMIT PAYMENT
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default PDetails;