import React, { useState } from 'react';
import { useApp } from '../context';
import { OWNER_MOBILE, OWNER_PASSWORD } from '../constants';

const Login: React.FC = () => {
  const { setView, setLoggedInMobile, students } = useApp();
  const [tab, setTab] = useState<'owner' | 'student'>('owner');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'owner') {
      if (mobile === OWNER_MOBILE && password === OWNER_PASSWORD) {
        setLoggedInMobile(null);
        setView('DASHBOARD');
      } else {
        setError('LOGIN FAILED! Invalid credentials for OWNER.');
      }
    } else {
      const student = students.find(s => s.userName === mobile && s.password === password && s.fullName);
      if (student) {
        setLoggedInMobile(student.mobileNumber);
        setView('STUDENT_DASHBOARD');
      } else {
        setError('LOGIN FAILED! Invalid credentials for STUDENT.');
      }
    }
  };

  return (
    <div className="login-container w-[95%] max-w-[420px] p-5 md:p-10 rounded-[20px] bg-[#1a1a2e] border-[3px] border-[#4CAF50] shadow-[0_0_50px_rgba(76,175,80,0.5),0_0_20px_#00bcd4] text-white tilt-animation">
      <div className="text-center mb-9 font-black text-shadow-glow">
        <h2 className="m-0 text-[1.6rem] text-white opacity-80 tracking-widest">Library Work</h2>
        <h1 className="m-0 text-[3rem] tracking-[4px] bg-clip-text text-transparent bg-gradient-to-tr from-[#ff2a6d] to-[#00bcd4] color-shift-animation">Automate</h1>
      </div>

      <div className="flex justify-between mb-8 rounded-[10px] p-[5px] bg-[rgba(255,255,255,0.05)]">
        <button 
          type="button"
          onClick={() => { setTab('owner'); setError(''); }}
          className={`flex-grow p-3 border-none rounded-lg bg-transparent text-[1rem] font-bold cursor-pointer transition-all duration-300 ${tab === 'owner' ? 'active bg-gradient-to-tr from-[#4CAF50] to-[#00bcd4] text-white shadow-[0_4px_15px_rgba(76,175,80,0.4)]' : 'text-[rgba(255,255,255,0.6)]'}`}
        >
          Owner Login
        </button>
        <button 
          type="button"
          onClick={() => { setTab('student'); setError(''); }}
          className={`flex-grow p-3 border-none rounded-lg bg-transparent text-[1rem] font-bold cursor-pointer transition-all duration-300 ${tab === 'student' ? 'active bg-gradient-to-tr from-[#4CAF50] to-[#00bcd4] text-white shadow-[0_4px_15px_rgba(76,175,80,0.4)]' : 'text-[rgba(255,255,255,0.6)]'}`}
        >
          Student Login
        </button>
      </div>

      <form onSubmit={handleLogin}>
        <div className="mb-6 relative">
          <i className="fas fa-mobile-alt absolute left-4 top-1/2 -translate-y-1/2 text-[#ff2a6d] text-[1.1rem]"></i>
          <input 
            type="text" 
            placeholder="Mobile Number" 
            required 
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full p-[15px_10px_15px_45px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-[10px] text-white text-[1rem] focus:outline-none focus:border-[#00bcd4] focus:shadow-[0_0_10px_#00bcd4] transition-all duration-300"
          />
        </div>
        <div className="mb-6 relative">
          <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-[#ff2a6d] text-[1.1rem]"></i>
          <input 
            type="password" 
            placeholder="Password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-[15px_10px_15px_45px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-[10px] text-white text-[1rem] focus:outline-none focus:border-[#00bcd4] focus:shadow-[0_0_10px_#00bcd4] transition-all duration-300"
          />
        </div>
        <button 
          type="submit" 
          className="w-full p-[15px] border-none rounded-[10px] bg-gradient-to-tr from-[#4CAF50] to-[#00bcd4] text-white text-[1.2rem] font-bold cursor-pointer transition-all duration-300 shadow-[0_5px_20px_rgba(0,188,212,0.4)] hover:opacity-90 hover:scale-[1.02] hover:shadow-[0_5px_25px_#00bcd4]"
        >
          {tab === 'owner' ? 'OWNER LOGIN' : 'STUDENT LOGIN'}
        </button>
        {error && <p className="text-[#ff2a6d] text-center mt-5 font-bold text-shadow-glow">{error}</p>}
      </form>
    </div>
  );
};

export default Login;