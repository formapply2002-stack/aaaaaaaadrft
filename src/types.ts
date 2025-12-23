
export interface Student {
  fullName: string | null;
  fatherName: string | null;
  address: string | null;
  mobileNumber: string;
  admissionDate: string; // YYYY-MM-DD
  userName: string | null;
  password: string | null;
}

export interface WowRecord {
  mobile: string;
  seatNo: string;
  batchString: string;
  shifts: number;
  payment: number;
  customRate: number;
  fixedTotalPayment: number;
}

export interface Booking {
  seat: number;
  shift: number;
  name: string;
  address: string | null;
  mobile: string;
}

export interface PaymentRecord {
  mobile: string;
  year: number;
  month: number;
  paidAmount: number;
  requiredAmount: number;
  timestamp?: string;
}

export interface AttendanceRecord {
  mobile: string;
  date: string; // YYYY-MM-DD
  times: { in: string; out: string | null }[];
}

export interface LibraryLocation {
  lat: number;
  lng: number;
  range: number;
  set: boolean;
  qrCodeString: string;
}

export type ViewState = 
  | 'LOGIN' 
  | 'DASHBOARD' 
  | 'STUDENT_VIEW' 
  | 'WOW_VIEW' 
  | 'SEAT_GRAPH' 
  | 'PAY_DETAILS' 
  | 'PAY_ACTIONS'
  | 'P_DETAILS'
  | 'ATTENDANCE_VIEW'
  | 'SETTINGS'
  | 'STUDENT_DASHBOARD'
  | 'STUDENT_PAYMENT'
  | 'STUDENT_HISTORY';
