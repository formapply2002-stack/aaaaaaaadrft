import { Student, AttendanceRecord, Booking, WowRecord, PaymentRecord } from './types';

export const OWNER_MOBILE = '6201530654';
export const OWNER_PASSWORD = 'Avinash';
export const LIBRARY_QR_CODE = "LibraryWorkAutomate_StaticQR_v1";
export const DEFAULT_RATE_PER_SHIFT = 300;
export const TOTAL_SEATS_DEFAULT = 50;
export const MAX_SEATS = 500;
export const SHIFTS = 4;
export const SHIFT_TIMES: Record<number, string> = { 1: "6AM-10AM", 2: "10AM-2PM", 3: "2PM-6PM", 4: "6PM-10PM" };
export const SHIFT_INDEX_TO_TIME: Record<number, {start: string, end: string}> = { 
    1: {start: '6AM', end: '10AM'}, 
    2: {start: '10AM', end: '2PM'}, 
    3: {start: '2PM', end: '6PM'}, 
    4: {start: '6PM', end: '10PM'} 
};

export const generatePassword = (fullName: string, mobile: string) => {
    const namePart = fullName.trim().toUpperCase().replace(/[^A-Z\s]/g, '').slice(0, 4);
    const mobilePart = mobile.slice(-4);
    return namePart.replace(/\s/g, '') + mobilePart;
};

export const generateInitialStudents = (): Student[] => {
    const firstNames = ["Rahul", "Priya", "Amit", "Sneha", "Vikas", "Anjali", "Suresh", "Kirti", "Raj", "Neha"];
    const lastNames = ["Kumar", "Singh", "Sharma", "Verma", "Yadav", "Gupta", "Jha", "Mehta", "Rai", "Mishra"];
    const cities = ["Patna", "Delhi", "Mumbai", "Kolkata", "Bengaluru", "Pune", "Lucknow"];
    const newRecords: Student[] = [];
    
    for (let i = 0; i < 28; i++) {
        const fullName = firstNames[Math.floor(Math.random() * firstNames.length)] + " " + lastNames[Math.floor(Math.random() * lastNames.length)];
        const fatherName = firstNames[Math.floor(Math.random() * firstNames.length)] + " " + lastNames[Math.floor(Math.random() * lastNames.length)];
        const mobileNumber = '9' + Math.random().toString().slice(2, 11);
        const address = cities[Math.floor(Math.random() * cities.length)];
        const date = new Date(Date.now() - Math.random() * 1.577e+10);
        const admissionDate = date.toISOString().split('T')[0];
        const password = generatePassword(fullName, mobileNumber);
        newRecords.push({ fullName, fatherName, address, mobileNumber, admissionDate, userName: mobileNumber, password });
    }
    
    // Specific hardcoded students from original code
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth(); 
    const year = today.getFullYear();
    
    const pastDate = new Date(year - 1, 7, day).toISOString().split('T')[0]; 
    const dueTodayDate = new Date(year, month - 1, day).toISOString().split('T')[0]; 
    const veryFutureDate = new Date(year, month, day + 8).toISOString().split('T')[0]; 
    const futureDate = new Date(year, month, day + 3).toISOString().split('T')[0];

    newRecords.push({fullName: "Avinash Kumar", fatherName: "Shankar Kumar", address: "Patna", mobileNumber: "6201530654", admissionDate: futureDate, userName: "6201530654", password: "AVIN0654"});
    newRecords.push({fullName: "Pooja Devi", fatherName: "Rajesh Sharma", address: "Delhi", mobileNumber: "9876543210", admissionDate: veryFutureDate, userName: "9876543210", password: "POOJ3210"});
    newRecords.push({fullName: "Ravi Sharma", fatherName: "Mohan Sharma", address: "Mumbai", mobileNumber: "9988776655", admissionDate: dueTodayDate, userName: "9988776655", password: "RAVI6655"});
    newRecords.push({fullName: "Sunita Verma", fatherName: "Anil Verma", address: "Pune", mobileNumber: "9988776644", admissionDate: pastDate, userName: "9988776644", password: "SUNI6644"});

    return newRecords;
};

export const generateInitialBookings = (students: Student[]): Booking[] => {
    // Basic hardcoded bookings to match original
    return [
        { seat: 1, shift: 3, name: 'Avinash Kumar', mobile: '6201530654', address: 'Patna' },
        { seat: 2, shift: 1, name: 'Pooja Devi', mobile: '9876543210', address: 'Delhi' },
        { seat: 5, shift: 4, name: 'Ravi Sharma', mobile: '9988776655', address: 'Mumbai' }
    ];
};

export const generateInitialAttendance = (): AttendanceRecord[] => {
    return [
        { mobile: '6201530654', date: '2025-10-11', times: [{ in: '9:00a', out: '1:00p' }] },
        { mobile: '6201530654', date: '2025-10-10', times: [{ in: '8:00a', out: '12:00p' }, { in: '2:10p', out: '5:15p' }] },
        { mobile: '6201530654', date: '2025-10-09', times: [] }, 
        { mobile: '6201530654', date: '2025-10-08', times: [{ in: '2:05p', out: '6:00p' }] },
        // ... more dummy data can be added or we just rely on these for demo
    ];
};

export const generateInitialPayments = (): PaymentRecord[] => {
    return [
        { mobile: '6201530654', year: 2025, month: 9, paidAmount: 900, requiredAmount: 900 }, 
        { mobile: '9876543210', year: 2025, month: 8, paidAmount: 300, requiredAmount: 300 }, 
        { mobile: '9876543210', year: 2025, month: 9, paidAmount: 200, requiredAmount: 300 }, 
        { mobile: '9988776655', year: 2025, month: 8, paidAmount: 1200, requiredAmount: 1200 }, 
    ];
};
