import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context';
import { Html5Qrcode } from 'html5-qrcode';

const StudentDashboard: React.FC = () => {
  const { loggedInMobile, students, wowRecords, libraryLocation, setView, getRequiredAmount, payments, attendance, setAttendance } = useApp();
  const [panel, setPanel] = useState<'HOME' | 'PAYMENT' | 'HISTORY'>('HOME');
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState('');
  
  // Ref to hold the scanner instance to manage cleanup properly
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const student = students.find(s => s.mobileNumber === loggedInMobile);
  const wow = wowRecords.find(w => w.mobile === loggedInMobile);
  
  if (!student) return <div>Error: Student not found.</div>;

  // Helper to get local date string YYYY-MM-DD
  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleLogout = () => {
    setView('LOGIN');
  };

  // Initialize Scanner when showScanner becomes true
  useEffect(() => {
    if (showScanner) {
        // Small timeout to ensure the "reader" div is rendered
        const timer = setTimeout(() => {
            // If a scanner instance already exists, do nothing or clear it
            if (scannerRef.current) {
                return;
            }

            const html5QrCode = new Html5Qrcode("reader");
            scannerRef.current = html5QrCode;

            const config = { fps: 10, qrbox: { width: 250, height: 250 } };
            
            // Directly start the camera (preferring environment/back camera)
            html5QrCode.start(
                { facingMode: "environment" }, 
                config,
                (decodedText) => {
                    // Success callback
                    handleScanSuccess(decodedText);
                    // Stop scanning immediately after success
                    stopScanner();
                },
                (errorMessage) => {
                    // Error callback (scanning in progress, no code found yet)
                    // console.log(errorMessage);
                }
            ).catch((err) => {
                console.error("Error starting camera:", err);
                setScanError("Unable to access camera. Please ensure permissions are granted.");
            });
        }, 100);

        return () => clearTimeout(timer);
    } else {
        // If showScanner is false, ensure cleanup
        stopScanner();
    }
  }, [showScanner]);

  // Cleanup on unmount
  useEffect(() => {
      return () => {
          stopScanner();
      };
  }, []);

  const stopScanner = () => {
      if (scannerRef.current) {
          scannerRef.current.stop().then(() => {
              scannerRef.current?.clear();
              scannerRef.current = null;
          }).catch(err => {
              console.error("Failed to stop scanner", err);
              scannerRef.current = null;
          });
      }
  };

  const handleMarkAttendance = () => {
    if (!libraryLocation.set) {
        alert("Library location not set by Admin yet.");
        return;
    }

    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    // Check Permissions first (Optional but good for debugging)
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
             alert("GPS Permission Denied. Please enable location access for this site in browser settings.");
             return;
        }
    });

    // 1. Check GPS Range
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            const R = 6371000; // Earth radius in meters
            const toRad = (x: number) => x * Math.PI / 180;
            const dLat = toRad(lat - libraryLocation.lat);
            const dLon = toRad(lng - libraryLocation.lng);
            const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(libraryLocation.lat))*Math.cos(toRad(lat))*Math.sin(dLon/2)*Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;

            // Debugging info (can be removed later)
            console.log(`User Loc: ${lat}, ${lng} | Lib Loc: ${libraryLocation.lat}, ${libraryLocation.lng} | Dist: ${distance}m`);

            if (distance > libraryLocation.range) {
                alert(`Too far! You are ${distance.toFixed(1)}m away. Range allowed: ${libraryLocation.range}m.`);
                return;
            }

            // 2. Open Camera Scanner if within range
            setScanError('');
            setShowScanner(true);
        },
        (error) => {
            let msg = "Unknown Error";
            if (error.code === error.PERMISSION_DENIED) msg = "User denied Geolocation.";
            if (error.code === error.POSITION_UNAVAILABLE) msg = "Position unavailable.";
            if (error.code === error.TIMEOUT) msg = "GPS Timeout.";
            alert(`GPS Error: ${msg}. Please ensure GPS is ON and permissions are allowed.`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleScanSuccess = (decodedText: string) => {
      // Verify QR Code
      if (decodedText !== libraryLocation.qrCodeString) {
          alert("Invalid QR Code or Old QR Code scanned.");
          setShowScanner(false);
          return;
      }

      // Use local date to avoid timezone shifts
      const todayStr = formatDateKey(new Date());
      const nowTime = new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', hour12: true});

      setAttendance(prev => {
          const newAttendance = [...prev];
          const recordIndex = newAttendance.findIndex(a => a.mobile === loggedInMobile && a.date === todayStr);

          if (recordIndex === -1) {
              // First scan of the day -> IN
              newAttendance.unshift({
                  mobile: loggedInMobile!,
                  date: todayStr,
                  times: [{ in: nowTime, out: null }]
              });
              alert(`✅ Successful! \n\nAttendance Marked: IN at ${nowTime}`);
          } else {
              const record = newAttendance[recordIndex];
              const sessions = [...record.times];
              const lastSession = sessions[sessions.length - 1];

              if (!lastSession.out) {
                  // Clock OUT
                  lastSession.out = nowTime;
                  alert(`✅ Successful! \n\nAttendance Marked: OUT at ${nowTime}`);
              } else {
                  // Clock IN (New Session)
                  sessions.push({ in: nowTime, out: null });
                  alert(`✅ Successful! \n\nAttendance Marked: IN at ${nowTime}`);
              }
              record.times = sessions;
              newAttendance[recordIndex] = record;
          }
          return newAttendance;
      });
      
      setShowScanner(false);
  };

  // Payment Panel Logic
  const renderPaymentPanel = () => {
    const today = new Date();
    const admissionDate = new Date(student.admissionDate);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let tempDate = new Date(admissionDate);
    let dueList = [];
    let totalDue = 0;

    while (tempDate <= today) {
        const y = tempDate.getFullYear();
        const m = tempDate.getMonth() + 1;
        const paid = payments.find(p => p.mobile === loggedInMobile && p.year === y && p.month === m);
        if (!paid || paid.paidAmount < paid.requiredAmount) { 
            if (!payments.some(p => p.mobile === loggedInMobile && p.year === y && p.month === m)) {
                const amt = getRequiredAmount(loggedInMobile!);
                dueList.push({ name: `${monthNames[m-1]} ${y}`, amount: amt });
            }
        }
        tempDate.setMonth(tempDate.getMonth() + 1);
    }
    
    return (
        <div className="main-panel-content w-full">
            <div className="welcome-header text-center mb-8"><h2 className="text-[2rem] text-[#dc3545] font-black">Your Due Payments</h2></div>
            <div className="bg-[rgba(0,0,0,0.2)] p-5 rounded-xl max-h-[40vh] overflow-y-auto mb-5 text-white">
                {dueList.length === 0 ? <p>You have no due payments. Good job!</p> : dueList.map((d, i) => (
                    <div key={i} className="p-3 border-b border-[rgba(255,255,255,0.1)] text-lg">
                        <input type="checkbox" onChange={(e) => { 
                             const btn = document.getElementById('proceedPayBtn');
                             if(btn) {
                                 let curr = parseInt(btn.dataset.total || '0');
                                 curr = e.target.checked ? curr + d.amount : curr - d.amount;
                                 btn.dataset.total = curr.toString();
                                 btn.textContent = `Proceed to Pay (Total: ₹${curr})`;
                             }
                        }}/> <label className="ml-3">{d.name} - ₹{d.amount}</label>
                    </div>
                ))}
            </div>
            {dueList.length > 0 && <button id="proceedPayBtn" data-total="0" onClick={() => alert("Payment API integration is pending.")} className="login-btn-final w-full p-4 rounded-xl bg-gradient-to-tr from-[#663399] to-[#00bcd4] text-white font-bold text-lg mb-5">Proceed to Pay (Total: ₹0)</button>}
            <button onClick={() => setPanel('HOME')} className="back-btn p-2 border-2 border-[#00bcd4] text-[#00bcd4] rounded font-bold hover:bg-[#00bcd4] hover:text-black"><i className="fas fa-arrow-left"></i> Back</button>
        </div>
    );
  };

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
    const today = new Date();
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

  const renderHistoryPanel = () => {
    const today = new Date();
    const monthName = today.toLocaleString('default', { month: 'long' });
    const year = today.getFullYear();
    const daysInMonth = new Date(year, today.getMonth() + 1, 0).getDate();
    const startDay = new Date(year, today.getMonth(), 1).getDay();
    const stats = getMonthlyStats(loggedInMobile!);

    // Collect daily details for list view below calendar
    const monthDetails = [];
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, today.getMonth(), d);
        const dateStr = formatDateKey(date);
        const status = getAttendanceStatus(loggedInMobile!, dateStr);
        if (status) {
            monthDetails.push({ date: d, status });
        }
    }

    return (
        <div className="main-panel-content w-full">
            <div className="text-center p-4 mb-5 bg-[#1e1e2d] border-2 border-[#ff2a6d] rounded-[10px]">
                <div className="text-[1.5rem] font-black text-[#00bcd4] mb-2">{student.fullName}</div>
                <div className="flex justify-around items-center border-t border-[rgba(255,255,255,0.2)] pt-2 text-white">
                    <div className="text-[1.1rem] font-bold text-[#ff2a6d]">Absent: {stats.absent}</div>
                    <div className="text-[1.1rem] font-bold text-[#4caf50]">Present: {stats.present}</div>
                </div>
            </div>
            
            <div className="p-4 bg-white rounded-lg mb-5 text-black">
                <h4 className="text-[#00bcd4] text-center mb-2 font-bold">{monthName} {year} Attendance</h4>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 p-2 border border-gray-200 rounded mb-4">
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-center font-bold text-[#00bcd4] text-sm">{d}</div>)}
                    {Array.from({length: startDay}).map((_, i) => <div key={`pad-${i}`} className="bg-[#e0e0e0] rounded min-h-[50px]"></div>)}
                    {Array.from({length: daysInMonth}, (_, i) => {
                        const d = i + 1;
                        const date = new Date(year, today.getMonth(), d);
                        const dateStr = formatDateKey(date);
                        const status = getAttendanceStatus(loggedInMobile!, dateStr);
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
                            <div key={d} className={`rounded p-1 flex flex-col items-center justify-start text-xs border border-gray-300 shadow-sm min-h-[50px] ${bgClass}`}>
                                <div className="font-black text-black text-sm">{d}</div>
                                <div className="leading-tight text-center break-words w-full text-[0.65rem] md:text-xs">
                                    {content}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Mobile List View for Better Timestamp Visibility */}
                <div className="md:hidden mt-4 border-t border-gray-300 pt-3">
                    <h5 className="text-[#663399] font-bold mb-2">Detailed Log (This Month)</h5>
                    {monthDetails.length > 0 ? (
                        <ul className="list-none p-0">
                            {monthDetails.map((item, idx) => (
                                <li key={idx} className="flex justify-between items-center bg-[#f0f0f0] p-2 mb-2 rounded border border-gray-200 text-sm">
                                    <span className="font-bold text-black w-10">{item.date}th</span>
                                    <span className="text-[#155724] font-semibold text-right flex-1">{item.status}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 italic">No attendance marked yet.</p>
                    )}
                </div>
            </div>
            
            <button onClick={() => setPanel('HOME')} className="back-btn w-full p-3 border-2 border-[#00bcd4] text-[#00bcd4] rounded-[10px] font-bold hover:bg-[#00bcd4] hover:text-[#0b0c10]"><i className="fas fa-arrow-left"></i> Back</button>
        </div>
    );
  };

  if (panel === 'PAYMENT') return <div className="main-panel w-[95%] max-w-[800px] bg-[rgba(17,18,23,0.9)] p-4 md:p-10 rounded-[20px] border-2 border-[#00bcd4]">{renderPaymentPanel()}</div>;
  if (panel === 'HISTORY') return <div className="main-panel w-[95%] max-w-[800px] bg-[rgba(17,18,23,0.9)] p-4 md:p-10 rounded-[20px] border-2 border-[#00bcd4]">{renderHistoryPanel()}</div>;

  return (
    <div className="main-panel w-[95%] max-w-[800px] bg-[rgba(17,18,23,0.9)] p-4 md:p-10 rounded-[20px] border-2 border-[#00bcd4]">
      <div className="student-welcome-card bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] border-l-4 border-l-[#ff2a6d] rounded-xl p-5 text-center mb-8 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="text-[#aaa] text-sm tracking-widest uppercase mb-1">Welcome Back</div>
        <div className="text-[2rem] font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-[#e0e0e0] mb-4 drop-shadow-md">{student.fullName}</div>
        <div className="inline-flex items-center gap-2 bg-[rgba(0,188,212,0.15)] text-[#00bcd4] p-[8px_16px] rounded-full text-sm font-bold border border-[rgba(0,188,212,0.3)] shadow-[0_0_15px_rgba(0,188,212,0.1)]">
            <i className="fas fa-chair"></i>
            {wow && wow.seatNo && wow.shifts > 0 ? `Seat No: ${wow.seatNo} | Shift: ${wow.batchString}` : "Seat: Not Allotted | Shift: N/A"}
        </div>
      </div>

      {!showScanner ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
            <button onClick={handleMarkAttendance} className="dashboard-btn p-[20px_10px] md:p-[30px] rounded-[15px] bg-gradient-to-br from-[#17a2b8] to-[#00bcd4] text-white font-bold text-[0.9rem] md:text-lg flex flex-col items-center shadow-lg hover:scale-[1.03]">
                <i className="fas fa-camera text-[1.2rem] md:text-2xl mb-2"></i> Mark Attendance
            </button>
            <button onClick={() => setPanel('PAYMENT')} className="dashboard-btn p-[20px_10px] md:p-[30px] rounded-[15px] bg-gradient-to-br from-[#4caf50] to-[#28a745] text-white font-bold text-[0.9rem] md:text-lg flex flex-col items-center shadow-lg hover:scale-[1.03]">
                <i className="fas fa-wallet text-[1.2rem] md:text-2xl mb-2"></i> Online Payment
            </button>
            <button onClick={() => setPanel('HISTORY')} className="dashboard-btn p-[20px_10px] md:p-[30px] rounded-[15px] bg-gradient-to-br from-[#ff9800] to-[#ffc107] text-white font-bold text-[0.9rem] md:text-lg flex flex-col items-center shadow-lg hover:scale-[1.03]">
                <i className="fas fa-history text-[1.2rem] md:text-2xl mb-2"></i> Attendance History
            </button>
          </div>
      ) : (
          <div className="text-center bg-black/50 p-4 rounded-lg">
              <h3 className="text-white text-xl mb-4 font-bold">Scan Library QR Code</h3>
              {/* Ensure ID matches the one in useEffect */}
              <div id="reader" className="w-full max-w-[300px] mx-auto bg-black border-2 border-[#ff2a6d] rounded overflow-hidden"></div>
              {scanError && <p className="text-red-500 mt-2 font-bold">{scanError}</p>}
              <button 
                onClick={() => { setShowScanner(false); }} 
                className="mt-4 p-2 bg-[#dc3545] text-white rounded font-bold"
              >
                  Cancel Scan
              </button>
          </div>
      )}

      <button onClick={handleLogout} className="w-full mt-8 p-3 bg-transparent border-2 border-[#ff2a6d] text-[#ff2a6d] font-bold rounded-lg hover:bg-[#ff2a6d] hover:text-[#0b0c10] transition-colors">LOGOUT</button>
    </div>
  );
};

export default StudentDashboard;