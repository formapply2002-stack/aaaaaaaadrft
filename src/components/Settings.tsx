import React, { useState } from 'react';
import { useApp } from '../context';
import { OWNER_PASSWORD } from '../constants';

const Settings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { libraryLocation, setLibraryLocation } = useApp();
  const [rangeInput, setRangeInput] = useState(libraryLocation.range.toString());
  const [adminPass, setAdminPass] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const generateNewQRString = (lat: number, lng: number) => {
    // Generate a unique QR string based on location and timestamp to ensure it changes
    // This prevents students from saving an old QR image
    return `LIB_AUTO_${lat.toFixed(5)}_${lng.toFixed(5)}_${Date.now()}`;
  };

  const handleSetLocationAuto = () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    // Request high accuracy for better precision (essential for 20m range)
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const range = parseInt(rangeInput) || 20;

            const newQR = generateNewQRString(lat, lng);
            
            setLibraryLocation({ 
                lat, 
                lng, 
                range, 
                set: true,
                qrCodeString: newQR
            });
            alert(`✅ GPS Location Set Successfully!\n\nLatitude: ${lat}\nLongitude: ${lng}\nRange: ${range}m\n\nA new QR Code has been generated.`);
        },
        (error) => {
            let msg = "Unknown error";
            switch(error.code) {
                case error.PERMISSION_DENIED: msg = "User denied the request for Geolocation."; break;
                case error.POSITION_UNAVAILABLE: msg = "Location information is unavailable."; break;
                case error.TIMEOUT: msg = "The request to get user location timed out."; break;
            }
            alert(`❌ Error getting location: ${msg}\n\nPlease ensure GPS is ON and Permissions are allowed.`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleManualLocation = () => {
    const link = prompt("Enter coordinates manually (Lat, Lng):", `${libraryLocation.lat}, ${libraryLocation.lng}`); 
    if (link) {
        const match = link.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
        if (match && match[1] && match[2]) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            const range = parseInt(rangeInput) || 20;
            const newQR = generateNewQRString(lat, lng);

            setLibraryLocation({ lat, lng, range, set: true, qrCodeString: newQR });
            alert(`Location Set Successfully!\nLat: ${lat}\nLng: ${lng}\nRange: ${range}m\nNew QR Code Generated.`);
        } else {
            alert("Could not parse coordinates. Please use format: 25.1234, 85.5678");
        }
    }
  };

  const initiateLocationChange = (action: () => void) => {
    if (libraryLocation.set) {
        setPendingAction(() => action);
        setShowPasswordModal(true);
    } else {
        action();
    }
  };

  const confirmPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === OWNER_PASSWORD) {
        if (pendingAction) pendingAction();
        setShowPasswordModal(false);
        setAdminPass('');
        setPendingAction(null);
    } else {
        alert("Incorrect Admin Password");
    }
  };

  const handleDownloadQR = () => {
    const element = document.getElementById('qr-printable-area');
    if (!element) return;
    
    // Temporarily make background white for PDF
    element.classList.add('bg-white', 'text-black');
    element.classList.remove('bg-white/10');

    const opt = {
      margin: 1,
      filename: 'Library_QR_Code.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // @ts-ignore
    window.html2pdf().set(opt).from(element).save().then(() => {
         element.classList.remove('bg-white', 'text-black');
         element.classList.add('bg-white/10');
    });
  };

  return (
    <div className="main-panel-content w-full max-w-[800px] mx-auto bg-[rgba(17,18,23,0.9)] p-10 rounded-[20px] border border-[#663399]">
      <div className="welcome-header text-center mb-8">
        <h2 className="text-[2rem] text-[#dc3545] font-black">QR/GPS Settings</h2>
        <p className="text-gray-400">Configure Location & Attendance QR</p>
      </div>

      <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
        <label className="block text-[#00bcd4] font-bold mb-2">Attendance Range (meters):</label>
        <input 
            type="number" 
            value={rangeInput} 
            onChange={(e) => setRangeInput(e.target.value)} 
            className="w-full p-2 rounded bg-black/30 border border-[#00bcd4] text-white focus:outline-none"
        />
        <p className="text-xs text-gray-400 mt-1">Recommended: 20m - 50m. Smaller range requires better GPS signal.</p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5 mb-8">
        <button onClick={() => initiateLocationChange(handleSetLocationAuto)} className="dashboard-btn p-6 rounded-xl bg-gradient-to-br from-[#009688] to-[#4caf50] text-white font-bold flex flex-col items-center hover:scale-[1.02] shadow-lg">
            <i className="fas fa-crosshairs text-3xl mb-3"></i> Auto Detect GPS Location
        </button>
        <button onClick={() => initiateLocationChange(handleManualLocation)} className="dashboard-btn p-6 rounded-xl bg-gradient-to-br from-[#607d8b] to-[#455a64] text-white font-bold flex flex-col items-center hover:scale-[1.02] shadow-lg">
            <i className="fas fa-edit text-3xl mb-3"></i> Manual Coordinates
        </button>
      </div>

      {libraryLocation.set && (
          <div className="flex flex-col items-center p-6 bg-white/10 rounded-xl border border-[#ff2a6d]" id="qr-printable-area">
              <h3 className="text-xl font-bold text-white mb-4">Library Attendance QR</h3>
              <div className="bg-white p-4 rounded-lg">
                  {/* Using a public API to generate QR Code image based on string */}
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(libraryLocation.qrCodeString)}`} 
                    alt="Library QR Code" 
                    className="w-[250px] h-[250px]"
                  />
              </div>
              <div className="mt-4 text-center">
                  <p className="text-sm font-mono text-[#00bcd4]">{libraryLocation.lat.toFixed(5)}, {libraryLocation.lng.toFixed(5)}</p>
                  <p className="text-xs text-gray-400">Range: {libraryLocation.range}m</p>
              </div>
          </div>
      )}

      {libraryLocation.set && (
          <button onClick={handleDownloadQR} className="w-full mt-4 p-3 bg-[#663399] text-white font-bold rounded-lg hover:bg-[#582a86] transition-colors shadow-lg">
              <i className="fas fa-file-pdf mr-2"></i> Download QR PDF
          </button>
      )}

      <div className="mt-8">
        <button onClick={onBack} className="back-btn p-3 border-2 border-[#00bcd4] text-[#00bcd4] rounded-lg font-bold hover:bg-[#00bcd4] hover:text-[#0b0c10]"><i className="fas fa-arrow-left"></i> Back to Dashboard</button>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50">
            <div className="bg-[#1e1e2d] p-6 rounded-xl border border-[#ff2a6d] w-[90%] max-w-[350px]">
                <h3 className="text-[#ff2a6d] font-bold text-lg mb-4 text-center">Admin Access Required</h3>
                <p className="text-gray-300 text-sm mb-4 text-center">Changing location will generate a new QR code.</p>
                <form onSubmit={confirmPassword}>
                    <input 
                        type="password" 
                        placeholder="Enter Admin Password" 
                        value={adminPass} 
                        onChange={(e) => setAdminPass(e.target.value)} 
                        className="w-full p-2 mb-4 rounded bg-white/10 border border-[#00bcd4] text-white"
                        autoFocus
                    />
                    <button type="submit" className="w-full p-2 bg-[#ff2a6d] text-white font-bold rounded">Confirm</button>
                    <button type="button" onClick={() => setShowPasswordModal(false)} className="w-full mt-2 p-2 border border-[#00bcd4] text-[#00bcd4] rounded">Cancel</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Settings;