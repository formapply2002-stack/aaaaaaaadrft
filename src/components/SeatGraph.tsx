import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { MAX_SEATS } from '../constants';

const SeatGraph: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { totalSeats, setTotalSeats, bookings, setBookings, students } = useApp();
  const [clickCount, setClickCount] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [inputSeats, setInputSeats] = useState(totalSeats);

  useEffect(() => {
    if (clickCount >= 6) {
        setShowAdmin(true);
        setClickCount(0);
        alert('एडमिन कंट्रोल पैनल सक्रिय हो गया है। अब आप सीटें सेट कर सकते हैं।');
    }
    const timer = setTimeout(() => setClickCount(0), 400); // MAX_CLICK_DELAY
    return () => clearTimeout(timer);
  }, [clickCount]);

  const handleSeatClick = () => {
    setClickCount(prev => prev + 1);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-area');
    if (!element) return;
    
    // Add PDF export class
    element.classList.add('pdf-export');

    const opt = {
      margin: 5, // mm
      filename: 'Seat_Allocation_Graph.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: 'avoid-all' }
    };

    // @ts-ignore
    window.html2pdf().set(opt).from(element).save().then(() => {
        // Remove class after PDF is generated
        element.classList.remove('pdf-export');
    });
  };

  const handleBooking = (seat: number, shift: number) => {
    const existingIndex = bookings.findIndex(b => b.seat === seat && b.shift === shift);
    const shiftTimes: Record<number, string> = { 1: "6AM-10AM", 2: "10AM-2PM", 3: "2PM-6PM", 4: "6PM-10PM" };
    
    if (existingIndex !== -1) {
        // Remove existing booking IMMEDIATELY without confirmation
        setBookings(prev => prev.filter((_, i) => i !== existingIndex));
        // Context will automatically update WOW records and decrease shift count
    } else {
        // Add new booking
        const mobile = prompt(`सीट ${seat}, शिफ्ट ${shift} (${shiftTimes[shift]}) बुक करने के लिए छात्र का 10 अंकों का मोबाइल नंबर भरें:`);
        if (mobile === null) return;
        if (mobile.length !== 10 || isNaN(Number(mobile))) {
            alert("अमान्य मोबाइल नंबर। बुकिंग रद्द की गई।"); return;
        }
        
        const student = students.find(s => s.mobileNumber === mobile);
        if (!student || !student.fullName) {
             alert("छात्र रिकॉर्ड नहीं मिला या हटाया गया है। पहले 'Students Data' में छात्र को जोड़ें/रिप्लेस करें।"); return;
        }

        setBookings(prev => [...prev, { seat, shift, mobile, name: student.fullName!, address: student.address }]);
        // Context useEffect will automatically update WOW records and increase shift count
        alert(`${student.fullName} के लिए सीट ${seat}, शिफ्ट ${shift} बुक कर दी गई है!`);
    }
  };

  const handleSetSeats = () => {
    if (inputSeats >= 1 && inputSeats <= MAX_SEATS) {
        setTotalSeats(inputSeats);
        setBookings(prev => prev.filter(b => b.seat <= inputSeats));
        setShowAdmin(false);
        alert(`कुल सीटें अब ${inputSeats} पर सेट हो गई हैं।`);
    } else {
        alert(`कृपया 1 और ${MAX_SEATS} के बीच एक वैध सीट संख्या दर्ज करें।`);
    }
  };

  return (
    <div className="main-panel-content w-full max-w-[1200px] mx-auto bg-[rgba(17,18,23,0.9)] p-5 rounded-xl border border-[#00bcd4] shadow-2xl">
      <div id="printable-area">
        <div className="py-2">
            <h3 className="mt-0 text-[#663399] font-bold text-xl print:text-black">लाइब्रेरी सीट बुकिंग डैशबोर्ड (Graph)</h3>
        </div>

        {showAdmin && (
            <div className="controls flex items-center gap-4 mb-5 p-4 bg-[#1a1a2e] border border-[#663399] rounded-lg text-white no-print">
                <label>कुल सीटें सेट करें (1-500):</label>
                <input type="number" min="1" max="500" value={inputSeats} onChange={(e) => setInputSeats(parseInt(e.target.value))} className="p-2 border border-[#00bcd4] rounded w-20 text-center bg-[rgba(255,255,255,0.05)] text-white" />
                <button onClick={handleSetSeats} className="p-2 px-4 bg-[#663399] text-white rounded hover:bg-[#582a86]">लागू करें (Apply)</button>
            </div>
        )}

        <div className="data-table-container overflow-x-auto max-h-[60vh] custom-scrollbar">
            <table className="booking-table w-full border-collapse bg-[#1a1a2e] text-white text-center print:bg-white print:text-black">
                <thead>
                    <tr>
                        <th className="sticky top-0 z-10 bg-[#663399] text-white font-bold p-3 border border-[rgba(255,255,255,0.1)] w-[10%] print:border-black print:text-black">सीट नं.</th>
                        <th className="sticky top-0 z-10 bg-[#00bcd4] text-black font-bold p-3 border border-[rgba(255,255,255,0.1)] w-[22.5%] print:border-black">शिफ्ट 1 (6-10 AM)</th>
                        <th className="sticky top-0 z-10 bg-[#00bcd4] text-black font-bold p-3 border border-[rgba(255,255,255,0.1)] w-[22.5%] print:border-black">शिफ्ट 2 (10-2 PM)</th>
                        <th className="sticky top-0 z-10 bg-[#00bcd4] text-black font-bold p-3 border border-[rgba(255,255,255,0.1)] w-[22.5%] print:border-black">शिफ्ट 3 (2-6 PM)</th>
                        <th className="sticky top-0 z-10 bg-[#00bcd4] text-black font-bold p-3 border border-[rgba(255,255,255,0.1)] w-[22.5%] print:border-black">शिफ्ट 4 (6-10 PM)</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: totalSeats }, (_, i) => i + 1).map(seat => (
                        <tr key={seat} className="even:bg-[rgba(255,255,255,0.02)] print:even:bg-[#f9f9f9]">
                            <td onClick={handleSeatClick} className="p-3 border border-[rgba(255,255,255,0.1)] font-bold cursor-pointer select-none bg-[rgba(255,255,255,0.05)] print:border-black">{seat}</td>
                            {[1, 2, 3, 4].map(shift => {
                                const booking = bookings.find(b => b.seat === seat && b.shift === shift);
                                return (
                                    <td key={shift} className="p-0 border border-[rgba(255,255,255,0.1)] h-[50px] print:border-black">
                                        <div 
                                            onDoubleClick={() => handleBooking(seat, shift)}
                                            className={`w-full h-full flex items-center justify-center font-bold cursor-pointer select-none p-2 text-[0.8rem] leading-none transition-transform duration-100 hover:scale-[1.02] ${booking ? 'bg-[#f8d7da] text-[#721c24]' : 'bg-[#d4edda] text-[#155724] hover:bg-[#c3e6cb]'}`}
                                        >
                                            {booking ? (
                                                <>
                                                    {booking.name || booking.mobile.slice(-4)}<br />({booking.mobile.slice(-4)})
                                                </>
                                            ) : 'Available'}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      <div className="action-buttons-footer flex justify-between items-center mt-5 no-print">
        <button onClick={onBack} className="back-btn p-[10px_20px] bg-transparent border-2 border-[#00bcd4] text-[#00bcd4] rounded-[10px] font-bold hover:bg-[#00bcd4] hover:text-[#0b0c10]"><i className="fas fa-arrow-left"></i> Back</button>
        <button onClick={handleDownloadPDF} className="print-btn p-[10px_20px] bg-[#1976D2] text-white border-none rounded-[10px] font-bold hover:bg-[#1565C0]"><i className="fas fa-file-pdf"></i> Download PDF</button>
      </div>
    </div>
  );
};

export default SeatGraph;