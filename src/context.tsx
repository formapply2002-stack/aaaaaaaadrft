import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student, WowRecord, Booking, PaymentRecord, AttendanceRecord, LibraryLocation, ViewState } from './types';
import { generateInitialStudents, generateInitialBookings, generateInitialPayments, generateInitialAttendance, DEFAULT_RATE_PER_SHIFT, SHIFT_INDEX_TO_TIME, SHIFTS, LIBRARY_QR_CODE } from './constants';

interface AppContextType {
  view: ViewState;
  setView: (view: ViewState) => void;
  loggedInMobile: string | null;
  setLoggedInMobile: (mobile: string | null) => void;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  wowRecords: WowRecord[];
  setWowRecords: React.Dispatch<React.SetStateAction<WowRecord[]>>;
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  payments: PaymentRecord[];
  setPayments: React.Dispatch<React.SetStateAction<PaymentRecord[]>>;
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  libraryLocation: LibraryLocation;
  setLibraryLocation: React.Dispatch<React.SetStateAction<LibraryLocation>>;
  totalSeats: number;
  setTotalSeats: (n: number) => void;
  updateWowDataFromGraph: (mobile: string) => void;
  getRequiredAmount: (mobile: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [loggedInMobile, setLoggedInMobile] = useState<string | null>(null);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [wowRecords, setWowRecords] = useState<WowRecord[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [libraryLocation, setLibraryLocation] = useState<LibraryLocation>({ 
      lat: 25.6127, 
      lng: 85.1589, 
      range: 20, 
      set: false,
      qrCodeString: LIBRARY_QR_CODE 
  });
  const [totalSeats, setTotalSeats] = useState(50);

  // Initialize Data
  useEffect(() => {
    const initStudents = generateInitialStudents();
    setStudents(initStudents);
    setBookings(generateInitialBookings(initStudents));
    setPayments(generateInitialPayments());
    setAttendance(generateInitialAttendance());
  }, []);

  // Sync Wow Records when students or bookings change
  useEffect(() => {
    // Ensure every student has a wow record
    setWowRecords(prev => {
      const newRecords = [...prev];
      students.forEach(s => {
        if (!newRecords.find(r => r.mobile === s.mobileNumber)) {
          newRecords.push({
            mobile: s.mobileNumber,
            seatNo: '',
            batchString: 'N/A',
            shifts: 0,
            payment: 0,
            customRate: 0,
            fixedTotalPayment: 0
          });
        }
      });
      // Initial override data from original code
      const avinash = newRecords.find(r => r.mobile === '6201530654');
      if (avinash && avinash.customRate === 0) avinash.customRate = 250;
      
      const pooja = newRecords.find(r => r.mobile === '9876543210');
      if (pooja && pooja.fixedTotalPayment === 0) pooja.fixedTotalPayment = 200;

      return newRecords;
    });
  }, [students]);

  // Function to calculate and update WOW data logic
  const updateWowDataFromGraph = (mobile: string) => {
    setWowRecords(prev => {
      return prev.map(record => {
        if (record.mobile !== mobile) return record;

        const studentBookings = bookings.filter(b => b.mobile === mobile).sort((a, b) => a.shift - b.shift);
        const shiftCount = studentBookings.length;
        
        let seatNo = '';
        if (shiftCount > 0) {
            // Original logic: if 4 shifts, just seat. If less, seat.shift of first
            seatNo = studentBookings[0].seat.toString();
        }

        let paymentAmount = 0;
        if (record.fixedTotalPayment > 0) {
            paymentAmount = record.fixedTotalPayment;
        } else if (record.customRate > 0) {
            paymentAmount = shiftCount * record.customRate;
        } else {
            paymentAmount = shiftCount * DEFAULT_RATE_PER_SHIFT;
        }

        let batchString = 'N/A';
        if (shiftCount > 0) {
            let batchParts: string[] = [];
            let currentStartShiftIndex: number | null = null;
            for(let i = 0; i < SHIFTS; i++) {
                const shiftIndex = i + 1;
                const isBooked = studentBookings.some(b => b.shift === shiftIndex);
                if (isBooked) {
                    if (currentStartShiftIndex === null) currentStartShiftIndex = shiftIndex;
                } else {
                    if (currentStartShiftIndex !== null) {
                        const startTime = SHIFT_INDEX_TO_TIME[currentStartShiftIndex].start;
                        const endTime = SHIFT_INDEX_TO_TIME[shiftIndex - 1].end;
                        batchParts.push(`${startTime}-${endTime}`);
                        currentStartShiftIndex = null;
                    }
                }
            }
            if (currentStartShiftIndex !== null) {
                const startTime = SHIFT_INDEX_TO_TIME[currentStartShiftIndex].start;
                const endTime = SHIFT_INDEX_TO_TIME[SHIFTS].end;
                batchParts.push(`${startTime}-${endTime}`);
            }
            batchString = batchParts.join(', ');
        }

        return {
          ...record,
          seatNo,
          shifts: shiftCount,
          payment: paymentAmount,
          batchString
        };
      });
    });
  };

  // Run updateWowDataFromGraph whenever bookings change for all affected students
  useEffect(() => {
    const affectedMobiles = Array.from(new Set(bookings.map(b => b.mobile)));
    setWowRecords(prev => {
        return prev.map(record => {
             const studentBookings = bookings.filter(b => b.mobile === record.mobile).sort((a, b) => a.shift - b.shift);
             const shiftCount = studentBookings.length;
             let seatNo = shiftCount > 0 ? studentBookings[0].seat.toString() : '';
             
             let paymentAmount = 0;
             if (record.fixedTotalPayment > 0) {
                 paymentAmount = record.fixedTotalPayment;
             } else if (record.customRate > 0) {
                 paymentAmount = shiftCount * record.customRate;
             } else {
                 paymentAmount = shiftCount * DEFAULT_RATE_PER_SHIFT;
             }
             
             let batchString = 'N/A';
             if (shiftCount > 0) {
                 let batchParts: string[] = [];
                 let currentStartShiftIndex: number | null = null;
                 for(let i = 0; i < SHIFTS; i++) {
                     const shiftIndex = i + 1;
                     const isBooked = studentBookings.some(b => b.shift === shiftIndex);
                     if (isBooked) {
                         if (currentStartShiftIndex === null) currentStartShiftIndex = shiftIndex;
                     } else {
                         if (currentStartShiftIndex !== null) {
                             const startTime = SHIFT_INDEX_TO_TIME[currentStartShiftIndex].start;
                             const endTime = SHIFT_INDEX_TO_TIME[shiftIndex - 1].end;
                             batchParts.push(`${startTime}-${endTime}`);
                             currentStartShiftIndex = null;
                         }
                     }
                 }
                 if (currentStartShiftIndex !== null) {
                     const startTime = SHIFT_INDEX_TO_TIME[currentStartShiftIndex].start;
                     const endTime = SHIFT_INDEX_TO_TIME[SHIFTS].end;
                     batchParts.push(`${startTime}-${endTime}`);
                 }
                 batchString = batchParts.join(', ');
             }
             return { ...record, seatNo, shifts: shiftCount, payment: paymentAmount, batchString };
        });
    });
  }, [bookings]);

  const getRequiredAmount = (mobile: string): number => {
    const record = wowRecords.find(r => r.mobile === mobile);
    if (!record || record.shifts === 0) return DEFAULT_RATE_PER_SHIFT;
    return record.payment;
  };

  return (
    <AppContext.Provider value={{
      view, setView, loggedInMobile, setLoggedInMobile,
      students, setStudents,
      wowRecords, setWowRecords,
      bookings, setBookings,
      payments, setPayments,
      attendance, setAttendance,
      libraryLocation, setLibraryLocation,
      totalSeats, setTotalSeats,
      updateWowDataFromGraph,
      getRequiredAmount
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};