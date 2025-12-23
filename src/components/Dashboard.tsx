import React from 'react';
import { useApp } from '../context';

const Dashboard: React.FC = () => {
  const { setView } = useApp();

  return (
    <div className="main-panel w-full max-w-[800px] bg-[rgba(17,18,23,0.9)] p-4 md:p-10 rounded-[20px] shadow-[0_0_40px_rgba(0,0,0,0.5)] border-2 border-[#00bcd4]">
      <div className="welcome-header mb-6 md:mb-10 text-center">
        <h2 className="text-[2rem] md:text-[2.5rem] text-[#dc3545] tracking-[5px] font-black m-0">Welcome</h2>
        <p className="text-[#bbb] mt-[10px] text-[1rem]">Library Work Automate Dashboard</p>
      </div>

      <div className="button-grid grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
        <button onClick={() => setView('STUDENT_VIEW')} className="dashboard-btn p-[20px_10px] md:p-[30px_15px] border-none rounded-[15px] text-[0.9rem] md:text-[1.1rem] font-bold text-center cursor-pointer text-white bg-gradient-to-br from-[#007bff] to-[#00bcd4] shadow-[0_5px_20px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center hover:-translate-y-[5px] hover:scale-[1.03] hover:shadow-[0_10px_30px_#ff2a6d]">
          <i className="fas fa-users mb-[10px] text-[1.2rem] md:text-[1.5rem]"></i>
          Students Data
        </button>
        <button onClick={() => setView('WOW_VIEW')} className="dashboard-btn p-[20px_10px] md:p-[30px_15px] border-none rounded-[15px] text-[0.9rem] md:text-[1.1rem] font-bold text-center cursor-pointer text-white bg-gradient-to-br from-[#663399] to-[#ff2a6d] shadow-[0_5px_20px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center hover:-translate-y-[5px] hover:scale-[1.03] hover:shadow-[0_10px_30px_#ff2a6d]">
          <i className="fas fa-magic mb-[10px] text-[1.2rem] md:text-[1.5rem]"></i>
          WOW
        </button>
        <button onClick={() => setView('SEAT_GRAPH')} className="dashboard-btn p-[20px_10px] md:p-[30px_15px] border-none rounded-[15px] text-[0.9rem] md:text-[1.1rem] font-bold text-center cursor-pointer text-white bg-gradient-to-br from-[#ff9800] to-[#ffc107] shadow-[0_5px_20px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center hover:-translate-y-[5px] hover:scale-[1.03] hover:shadow-[0_10px_30px_#ff2a6d]">
          <i className="fas fa-chart-bar mb-[10px] text-[1.2rem] md:text-[1.5rem]"></i>
          Graph
        </button>
        <button onClick={() => setView('PAY_DETAILS')} className="dashboard-btn p-[20px_10px] md:p-[30px_15px] border-none rounded-[15px] text-[0.9rem] md:text-[1.1rem] font-bold text-center cursor-pointer text-white bg-gradient-to-br from-[#dc3545] to-[#ff2a6d] shadow-[0_5px_20px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center hover:-translate-y-[5px] hover:scale-[1.03] hover:shadow-[0_10px_30px_#ff2a6d]">
          <i className="fas fa-wallet mb-[10px] text-[1.2rem] md:text-[1.5rem]"></i>
          Pay Details
        </button>
        <button onClick={() => setView('SETTINGS')} className="dashboard-btn p-[20px_10px] md:p-[30px_15px] border-none rounded-[15px] text-[0.9rem] md:text-[1.1rem] font-bold text-center cursor-pointer text-white bg-gradient-to-br from-[#009688] to-[#00bcd4] shadow-[0_5px_20px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center hover:-translate-y-[5px] hover:scale-[1.03] hover:shadow-[0_10px_30px_#ff2a6d]">
          <i className="fas fa-map-marked-alt mb-[10px] text-[1.2rem] md:text-[1.5rem]"></i>
          QR & LOCATION
        </button>
        <button onClick={() => setView('ATTENDANCE_VIEW')} className="dashboard-btn p-[20px_10px] md:p-[30px_15px] border-none rounded-[15px] text-[0.9rem] md:text-[1.1rem] font-bold text-center cursor-pointer text-white bg-gradient-to-br from-[#663399] to-[#3366ff] shadow-[0_5px_20px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center hover:-translate-y-[5px] hover:scale-[1.03] hover:shadow-[0_10px_30px_#ff2a6d]">
          <i className="fas fa-calendar-check mb-[10px] text-[1.2rem] md:text-[1.5rem]"></i>
          Attendance Log
        </button>
        <button onClick={() => setView('PAY_ACTIONS')} className="dashboard-btn p-[20px_10px] md:p-[30px_15px] border-none rounded-[15px] text-[0.9rem] md:text-[1.1rem] font-bold text-center cursor-pointer text-white bg-gradient-to-br from-[#4caf50] to-[#28a745] shadow-[0_5px_20px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center hover:-translate-y-[5px] hover:scale-[1.03] hover:shadow-[0_10px_30px_#ff2a6d]">
          <i className="fas fa-wallet mb-[10px] text-[1.2rem] md:text-[1.5rem]"></i>
          Make Payment
        </button>
      </div>

      <button onClick={() => setView('LOGIN')} className="w-full p-[12px] mt-[20px] md:mt-[30px] font-bold cursor-pointer rounded-[10px] transition-all duration-300 bg-transparent border-2 border-[#ff2a6d] text-[#ff2a6d] hover:bg-[#ff2a6d] hover:text-[#0b0c10]">LOGOUT</button>
    </div>
  );
};

export default Dashboard;