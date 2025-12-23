import React, { useState } from 'react';
import { useApp } from '../context';
import { generatePassword, OWNER_PASSWORD } from '../constants';
import { Student } from '../types';

interface StudentViewProps {
  onBack: () => void;
}

const StudentView: React.FC<StudentViewProps> = ({ onBack }) => {
  const { students, setStudents, setWowRecords, bookings, setBookings, setPayments, setAttendance, updateWowDataFromGraph } = useApp();
  const [showForm, setShowForm] = useState(false);
  
  // New student state
  const [newStudent, setNewStudent] = useState({
    fullName: '', fatherName: '', address: '', mobileNumber: '', admissionDate: ''
  });

  // Action Modal State
  const [actionModal, setActionModal] = useState<{ visible: boolean; student: Student | null; index: number | -1 }>({ visible: false, student: null, index: -1 });
  const [replaceMode, setReplaceMode] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);
  const [replaceData, setReplaceData] = useState<Student | null>(null);
  const [adminPass, setAdminPass] = useState('');

  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-area');
    if (!element) return;
    
    // Add PDF export class to trigger the A4 styles from index.html
    element.classList.add('pdf-export');

    const opt = {
      margin: 5, // mm
      filename: 'Registered_Students.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: 'avoid-all' }
    };

    // @ts-ignore
    window.html2pdf().set(opt).from(element).save().then(() => {
        // Remove class after PDF is generated to return to Dark Mode
        element.classList.remove('pdf-export');
    });
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudent.mobileNumber.length !== 10 || isNaN(Number(newStudent.mobileNumber))) {
      alert("Please enter a valid 10-digit mobile number."); return;
    }
    if (students.some(r => r.mobileNumber === newStudent.mobileNumber)) {
      alert("Error: Mobile number already registered!"); return;
    }
    
    const password = generatePassword(newStudent.fullName, newStudent.mobileNumber);
    const addedStudent: Student = { ...newStudent, userName: newStudent.mobileNumber, password };
    
    setStudents(prev => [...prev, addedStudent]);
    // WOW record update is handled by effect in context
    
    alert(`Student added! Password: ${password}`);
    setNewStudent({ fullName: '', fatherName: '', address: '', mobileNumber: '', admissionDate: '' });
    setShowForm(false);
  };

  const handleRowDoubleClick = (student: Student, index: number) => {
    setActionModal({ visible: true, student, index });
    setReplaceMode(false);
    setRemoveMode(false);
    setReplaceData(null);
    setAdminPass('');
    
    // If removed, jump straight to replace mode
    if (!student.fullName) {
        setReplaceMode(true);
        setReplaceData({ ...student, fullName: '', fatherName: '', address: '', admissionDate: student.admissionDate, mobileNumber: student.mobileNumber });
    }
  };

  const handleConfirmRemove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.student) return;
    
    if (adminPass !== OWNER_PASSWORD) {
        alert("Incorrect Admin Password! Removal cancelled."); 
        return;
    }
    
    const index = actionModal.index;
    const mobile = actionModal.student.mobileNumber;

    setStudents(prev => {
        const newArr = [...prev];
        newArr[index] = { 
            ...newArr[index], 
            fullName: null, 
            fatherName: null, 
            address: null, 
            userName: null, 
            password: null,
            mobileNumber: '', // Clear mobile number
            admissionDate: '' // Clear admission date
        };
        return newArr;
    });
    
    // Clear bookings
    setBookings(prev => prev.filter(b => b.mobile !== mobile));
    
    // Remove wow record completely to prevent duplicates on re-add
    setWowRecords(prev => prev.filter(r => r.mobile !== mobile));

    alert(`Student ${mobile} removed (Index kept).`);
    setActionModal({ visible: false, student: null, index: -1 });
    setRemoveMode(false);
    setAdminPass('');
  };

  const handleReplaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceData || !actionModal.student) return;
    
    if (adminPass !== OWNER_PASSWORD) {
        alert("Incorrect Admin Password! Update cancelled.");
        setAdminPass(''); return;
    }

    if (replaceData.mobileNumber.length !== 10 || isNaN(Number(replaceData.mobileNumber))) {
        alert("Please enter a valid 10-digit mobile number."); return;
    }

    const originalMobile = actionModal.student.mobileNumber;
    const newMobile = replaceData.mobileNumber;
    
    // Conflict check
    if (originalMobile !== newMobile && students.some(r => r.mobileNumber === newMobile && r.mobileNumber !== originalMobile)) {
        alert("Error: New mobile number already registered!"); return;
    }

    const isReAdding = !actionModal.student.fullName;
    const newPassword = generatePassword(replaceData.fullName!, newMobile);

    const updatedStudent: Student = { 
        ...replaceData, 
        userName: newMobile, 
        password: newPassword 
    };

    const index = actionModal.index;
    setStudents(prev => {
        const newArr = [...prev];
        newArr[index] = updatedStudent;
        return newArr;
    });

    if (originalMobile !== newMobile) {
        // Cascade updates
        setBookings(prev => prev.map(b => b.mobile === originalMobile ? { ...b, mobile: newMobile, name: replaceData.fullName! } : b));
        setPayments(prev => prev.map(p => p.mobile === originalMobile ? { ...p, mobile: newMobile } : p));
        setAttendance(prev => prev.map(a => a.mobile === originalMobile ? { ...a, mobile: newMobile } : a));
        setWowRecords(prev => prev.map(w => w.mobile === originalMobile ? { ...w, mobile: newMobile } : w));
        
        // Wait for state to settle then update calculations
        setTimeout(() => updateWowDataFromGraph(newMobile), 100);
    }

    alert(`${isReAdding ? 'Student Re-Added' : 'Student Data Updated'}! ${originalMobile !== newMobile ? `(Mobile changed to ${newMobile})` : ''} Password: ${newPassword}`);
    setActionModal({ visible: false, student: null, index: -1 });
  };

  const headerColors = ['#663399', '#ff2a6d', '#ffc107', '#17a2b8', '#00bcd4', '#3366ff', '#4caf50', '#f44336'];

  return (
    <div className="main-panel-content w-full max-w-[1200px] mx-auto bg-[rgba(17,18,23,0.9)] p-8 rounded-xl border border-[#00bcd4] shadow-2xl">
      <div id="printable-area">
        <h3 className="text-[#ff2a6d] text-[1.2rem] mt-0 mb-4 font-bold print:text-black print:text-center print:text-2xl print:mb-5">Registered Students</h3>
        
        <div className="data-table-container overflow-x-auto max-h-[50vh]">
          <table id="studentTable" className="w-full border-collapse min-w-[1000px] text-white print:text-black">
            <thead>
              <tr>
                {['S.No.', 'Full Name', 'Father Name', 'Address', 'Mobile No.', 'Admission Date', 'User Name', 'Password'].map((h, i) => (
                  <th key={h} className="p-[12px_15px] text-left border-b-[3px] bg-white text-black font-bold sticky top-0 shadow-md whitespace-nowrap" style={{ borderColor: headerColors[i] }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={index} onDoubleClick={() => handleRowDoubleClick(student, index)} className="even:bg-[#f0f0f0] odd:bg-white text-black hover:bg-[#e6f7ff] cursor-pointer print:odd:bg-[#f9f9f9]">
                  <td className="p-3 border-b border-[rgba(0,0,0,0.1)]">{index + 1}</td>
                  <td className="p-3 border-b border-[rgba(0,0,0,0.1)]">{student.fullName || '-'}</td>
                  <td className="p-3 border-b border-[rgba(0,0,0,0.1)]">{student.fatherName || '-'}</td>
                  <td className="p-3 border-b border-[rgba(0,0,0,0.1)]">{student.address || '-'}</td>
                  <td className="p-3 border-b border-[rgba(0,0,0,0.1)]">{student.fullName ? student.mobileNumber : '-'}</td>
                  <td className="p-3 border-b border-[rgba(0,0,0,0.1)]">{student.fullName ? student.admissionDate : '-'}</td>
                  <td className="p-3 border-b border-[rgba(0,0,0,0.1)]">{student.userName || '---'}</td>
                  <td className="p-3 border-b border-[rgba(0,0,0,0.1)]">{student.password || '---'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inline Form */}
      {showForm && (
        <form onSubmit={handleAddStudent} className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5 mt-5 mb-8 p-5 border border-[#663399] rounded-[10px] bg-[#1a1a2e]">
            <input className="p-2 rounded-lg border border-[#00bcd4] bg-[rgba(255,255,255,0.05)] text-white" placeholder="Full Name" required value={newStudent.fullName} onChange={e => setNewStudent({...newStudent, fullName: e.target.value})} />
            <input className="p-2 rounded-lg border border-[#00bcd4] bg-[rgba(255,255,255,0.05)] text-white" placeholder="Father Name" required value={newStudent.fatherName} onChange={e => setNewStudent({...newStudent, fatherName: e.target.value})} />
            <input className="p-2 rounded-lg border border-[#00bcd4] bg-[rgba(255,255,255,0.05)] text-white" placeholder="Address" required value={newStudent.address} onChange={e => setNewStudent({...newStudent, address: e.target.value})} />
            <input className="p-2 rounded-lg border border-[#00bcd4] bg-[rgba(255,255,255,0.05)] text-white" placeholder="Mobile (10 digits)" required maxLength={10} minLength={10} value={newStudent.mobileNumber} onChange={e => setNewStudent({...newStudent, mobileNumber: e.target.value})} />
            <input type="date" className="p-2 rounded-lg border border-[#00bcd4] bg-[rgba(255,255,255,0.05)] text-white" required value={newStudent.admissionDate} onChange={e => setNewStudent({...newStudent, admissionDate: e.target.value})} />
            <button type="submit" className="p-2 rounded-lg bg-gradient-to-tr from-[#663399] to-[#00bcd4] text-white font-bold hover:opacity-90">ADD NEW STUDENT</button>
        </form>
      )}

      <div className="action-buttons-footer flex justify-between items-center mt-5 no-print">
        <button onClick={onBack} className="back-btn p-[10px_20px] bg-transparent border-2 border-[#00bcd4] text-[#00bcd4] rounded-[10px] font-bold hover:bg-[#00bcd4] hover:text-[#0b0c10]"><i className="fas fa-arrow-left"></i> Back</button>
        <button onClick={() => setShowForm(!showForm)} className="p-[10px_20px] bg-transparent border-2 border-[#00bcd4] text-[#00bcd4] rounded-[10px] font-bold hover:opacity-90"><i className={`fas fa-${showForm ? 'minus' : 'plus'}`}></i> {showForm ? 'Hide' : 'Add New'}</button>
        <button onClick={handleDownloadPDF} className="print-btn p-[10px_20px] bg-[#1976D2] text-white border-none rounded-[10px] font-bold hover:bg-[#1565C0]"><i className="fas fa-file-pdf"></i> Download PDF</button>
      </div>

      {/* Action Modal */}
      {actionModal.visible && (
        <div className="modal-overlay fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.8)] flex justify-center items-center z-[1000]">
            <div className="modal-content bg-[#1e1e2d] p-8 rounded-[15px] max-w-[500px] w-[90%] border-2 border-[#ff2a6d] shadow-[0_0_30px_#ff2a6d]">
                <div className="modal-header text-[1.5rem] font-black text-[#00bcd4] mb-5 text-center">
                    {replaceMode ? 'Replace / Edit Student' : removeMode ? 'Confirm Removal' : 'Student Actions'}
                </div>
                <p className="text-center mb-8 text-[1.5rem] font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-[#e0e0e0]">{actionModal.student?.fullName || `Index ${actionModal.index + 1} (REMOVED)`}</p>
                
                {!replaceMode && !removeMode ? (
                    <div className="flex flex-col gap-4">
                        <button onClick={() => { setRemoveMode(true); setAdminPass(''); }} className="p-3 bg-gradient-to-br from-[#dc3545] to-[#f44336] text-white font-bold rounded-[10px] shadow-lg"><i className="fas fa-trash"></i> Student Name Remove (Keep Index)</button>
                        <button onClick={() => {
                            setReplaceMode(true);
                            setReplaceData(actionModal.student);
                            setAdminPass('');
                        }} className="p-3 bg-gradient-to-br from-[#28a745] to-[#4caf50] text-white font-bold rounded-[10px] shadow-lg"><i className="fas fa-edit"></i> Replace / Edit Name</button>
                    </div>
                ) : removeMode ? (
                    <form onSubmit={handleConfirmRemove} className="flex flex-col gap-3">
                        <p className="text-center text-[#ff2a6d] font-bold">Are you sure you want to remove this student? (Index will be kept)</p>
                        <input type="password" className="modal-input w-full p-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[#00bcd4] text-white" placeholder="Admin Password" required value={adminPass} onChange={e => setAdminPass(e.target.value)} />
                        <button type="submit" className="p-3 mt-4 bg-gradient-to-br from-[#dc3545] to-[#f44336] text-white font-bold rounded-[10px] shadow-lg">CONFIRM REMOVE</button>
                        <button type="button" onClick={() => setRemoveMode(false)} className="w-full p-2 mt-2 bg-transparent border-2 border-[#00bcd4] text-[#00bcd4] rounded-[10px] font-bold hover:bg-[#00bcd4] hover:text-black">Cancel</button>
                    </form>
                ) : (
                    <form onSubmit={handleReplaceSubmit} className="flex flex-col gap-3">
                         <input className="modal-input w-full p-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[#00bcd4] text-white" placeholder="Full Name" required value={replaceData?.fullName || ''} onChange={e => setReplaceData(prev => ({...prev!, fullName: e.target.value}))} />
                         <input className="modal-input w-full p-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[#00bcd4] text-white" placeholder="Father Name" required value={replaceData?.fatherName || ''} onChange={e => setReplaceData(prev => ({...prev!, fatherName: e.target.value}))} />
                         <input className="modal-input w-full p-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[#00bcd4] text-white" placeholder="Address" required value={replaceData?.address || ''} onChange={e => setReplaceData(prev => ({...prev!, address: e.target.value}))} />
                         <input className="modal-input w-full p-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[#00bcd4] text-white" placeholder="Mobile" required maxLength={10} minLength={10} value={replaceData?.mobileNumber || ''} onChange={e => setReplaceData(prev => ({...prev!, mobileNumber: e.target.value}))} />
                         <input type="date" className="modal-input w-full p-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[#00bcd4] text-white" required value={replaceData?.admissionDate || ''} onChange={e => setReplaceData(prev => ({...prev!, admissionDate: e.target.value}))} />
                         <input type="password" className="modal-input w-full p-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[#00bcd4] text-white mt-4" placeholder="Admin Password" required value={adminPass} onChange={e => setAdminPass(e.target.value)} />
                         <button type="submit" className="p-3 mt-4 bg-gradient-to-tr from-[#4CAF50] to-[#00bcd4] text-black font-bold rounded-[10px]">SAVE CHANGES</button>
                         <button type="button" onClick={() => setReplaceMode(false)} className="w-full p-2 mt-2 bg-transparent border-2 border-[#00bcd4] text-[#00bcd4] rounded-[10px] font-bold hover:bg-[#00bcd4] hover:text-black">Cancel</button>
                    </form>
                )}
                
                {!replaceMode && !removeMode && (
                    <div className="mt-5 flex justify-center">
                        <button onClick={() => setActionModal({visible: false, student: null, index: -1})} className="w-full p-2 bg-transparent border-2 border-[#00bcd4] text-[#00bcd4] rounded-[10px] font-bold hover:bg-[#00bcd4] hover:text-black">Close</button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default StudentView;