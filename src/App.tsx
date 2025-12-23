import React from 'react';
import { AppProvider, useApp } from './context';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import StudentView from './components/StudentView';
import WowView from './components/WowView';
import SeatGraph from './components/SeatGraph';
import PayDetails from './components/PayDetails';
import AttendanceView from './components/AttendanceView';
import Settings from './components/Settings';
import StudentDashboard from './components/StudentDashboard';
import PDetails from './components/PDetails';

const MainApp = () => {
  const { view, setView } = useApp();

  // Simple Router based on view state
  switch (view) {
    case 'LOGIN':
      return <Login />;
    case 'DASHBOARD':
      return <Dashboard />;
    case 'STUDENT_VIEW':
      return <StudentView onBack={() => setView('DASHBOARD')} />;
    case 'WOW_VIEW':
      return <WowView onBack={() => setView('DASHBOARD')} />;
    case 'SEAT_GRAPH':
      return <SeatGraph onBack={() => setView('DASHBOARD')} />;
    case 'PAY_DETAILS':
      return <PayDetails onBack={() => setView('DASHBOARD')} />;
    case 'PAY_ACTIONS':
      return (
        <div className="main-panel w-full max-w-[800px] bg-[rgba(17,18,23,0.9)] p-4 md:p-10 rounded-[20px] border-2 border-[#00bcd4]">
            <div className="welcome-header text-center mb-8"><h2 className="text-[2rem] text-[#dc3545] font-black">Payment Actions</h2></div>
            <div className="grid grid-cols-2 gap-4 md:flex md:justify-center md:gap-8">
                <button onClick={() => setView('P_DETAILS')} className="dashboard-btn w-full md:w-[250px] p-4 md:p-8 rounded-xl bg-gradient-to-br from-[#ff9800] to-[#ffc107] text-white font-bold flex flex-col items-center hover:scale-[1.03]"><i className="fas fa-file-invoice text-2xl md:text-3xl mb-3"></i> P Details</button>
                <button onClick={() => alert("P Print selected")} className="dashboard-btn w-full md:w-[250px] p-4 md:p-8 rounded-xl bg-gradient-to-br from-[#ff9800] to-[#ffc107] text-white font-bold flex flex-col items-center hover:scale-[1.03]"><i className="fas fa-print text-2xl md:text-3xl mb-3"></i> P Print</button>
            </div>
            <button onClick={() => setView('DASHBOARD')} className="back-btn mt-10 p-2 border-2 border-[#00bcd4] text-[#00bcd4] rounded font-bold hover:bg-[#00bcd4] hover:text-black"><i className="fas fa-arrow-left"></i> Back</button>
        </div>
      );
    case 'P_DETAILS':
        return <PDetails onBack={() => setView('PAY_ACTIONS')} />;
    case 'ATTENDANCE_VIEW':
      return <AttendanceView onBack={() => setView('DASHBOARD')} />;
    case 'SETTINGS':
      return <Settings onBack={() => setView('DASHBOARD')} />;
    case 'STUDENT_DASHBOARD':
      return <StudentDashboard />;
    default:
      return <Login />;
  }
};

const App = () => {
  return (
    <AppProvider>
      <div className="flex justify-center items-center min-h-screen w-full p-4">
        <MainApp />
      </div>
    </AppProvider>
  );
};

export default App;