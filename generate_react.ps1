$ErrorActionPreference = 'Stop'

$code = @{}

$code['hospitalms-frontend\src\pages\auth\Register.jsx'] = @'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';

export default function Register() {
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '', role: 'Patient'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await api.post('/api/auth/register', form);
      navigate('/login');
    } catch(err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f5f5'}}>
      <div style={{background:'white',padding:'32px',borderRadius:'8px',width:'400px',boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
        <h2 style={{marginBottom:'24px',textAlign:'center'}}>Register New User</h2>
        {error && <p style={{color:'red',marginBottom:'12px'}}>{error}</p>}
        <form onSubmit={handleRegister}>
          <input type='text' placeholder='Full Name' value={form.fullName}
            onChange={e=>setForm({...form, fullName: e.target.value})} required
            style={{width:'100%',padding:'10px',marginBottom:'12px',border:'1px solid #ddd',borderRadius:'4px',boxSizing:'border-box'}} />
            
          <input type='email' placeholder='Email' value={form.email}
            onChange={e=>setForm({...form, email: e.target.value})} required
            style={{width:'100%',padding:'10px',marginBottom:'12px',border:'1px solid #ddd',borderRadius:'4px',boxSizing:'border-box'}} />
            
          <input type='password' placeholder='Password' value={form.password}
            onChange={e=>setForm({...form, password: e.target.value})} required
            style={{width:'100%',padding:'10px',marginBottom:'12px',border:'1px solid #ddd',borderRadius:'4px',boxSizing:'border-box'}} />
            
          <input type='tel' placeholder='Phone' value={form.phone}
            onChange={e=>setForm({...form, phone: e.target.value})} required
            style={{width:'100%',padding:'10px',marginBottom:'12px',border:'1px solid #ddd',borderRadius:'4px',boxSizing:'border-box'}} />
            
          <select value={form.role} onChange={e=>setForm({...form, role: e.target.value})}
            style={{width:'100%',padding:'10px',marginBottom:'20px',border:'1px solid #ddd',borderRadius:'4px',boxSizing:'border-box'}}>
            <option value="Patient">Patient</option>
            <option value="Doctor">Doctor</option>
            <option value="Pharmacist">Pharmacist</option>
            <option value="LabTechnician">Lab Technician</option>
            <option value="Receptionist">Receptionist</option>
            <option value="Admin">Admin</option>
          </select>
          
          <button type='submit' disabled={loading}
            style={{width:'100%',padding:'11px',background:'#1976d2',color:'white',border:'none',borderRadius:'4px',cursor:'pointer'}}>
            {loading ? 'Registering...' : 'Register'}
          </button>
          
          <p style={{marginTop:'16px',textAlign:'center',fontSize:'14px'}}>
            Already have an account? <span onClick={() => navigate('/login')} style={{color:'#1976d2',cursor:'pointer'}}>Login here</span>
          </p>
        </form>
      </div>
    </div>
  );
}
'@

$code['hospitalms-frontend\src\pages\patient\PatientDashboard.jsx'] = @'
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { useSignalR } from '../../hooks/useSignalR';

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);
  const [activeTab, setActiveTab] = useState('appointments');
  const { connection } = useSignalR('http://localhost:5004/hubs/hospital');

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (!connection) return;
    connection.on('LabResultReady', (data) => {
      alert(`LAB RESULT READY: \nTest: ${data.testName}\nResult: ${data.resultValue}\nAbnormal: ${data.isAbnormal ? 'YES' : 'NO'}`);
    });
    return () => { connection.off('LabResultReady'); };
  }, [connection]);

  const loadData = async () => {
    if (!user) return;
    const [appRes, prescRes, billRes] = await Promise.all([
      api.get('/api/appointments/my'),
      api.get(`/api/prescriptions/patient/${user.id}`).catch(() => ({data: []})),
      api.get(`/api/bills/patient/${user.id}`).catch(() => ({data: []}))
    ]);
    setAppointments(appRes.data);
    setPrescriptions(prescRes.data);
    setBills(billRes.data);
  };

  const statusColor = (s) => {
    if(s === 'Scheduled' || s === 'Pending') return '#1976d2';
    if(s === 'Completed' || s === 'Dispensed' || s === 'Paid') return '#2e7d32';
    if(s === 'PartiallyPaid') return '#f57c00';
    return '#666';
  };

  const tabStyle = (tab) => ({
    padding: '12px 24px', cursor: 'pointer', borderBottom: activeTab === tab ? '3px solid #1976d2' : '3px solid transparent',
    fontWeight: activeTab === tab ? 'bold' : 'normal', color: activeTab === tab ? '#1976d2' : '#666'
  });

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#f5f5f5'}}>
      <div style={{background:'#1976d2',color:'white',padding:'16px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1 style={{margin:0}}>HealthBridge Patient Portal</h1>
        <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
          <span>Welcome, {user?.fullName}</span>
          <button onClick={logout} style={{padding:'6px 12px',background:'white',color:'#1976d2',border:'none',borderRadius:'4px',cursor:'pointer'}}>Logout</button>
        </div>
      </div>
      
      <div style={{maxWidth:'1000px',margin:'24px auto',background:'white',borderRadius:'8px',boxShadow:'0 2px 4px rgba(0,0,0,0.1)',overflow:'hidden'}}>
        <div style={{display:'flex',borderBottom:'1px solid #eee'}}>
          <div style={tabStyle('appointments')} onClick={()=>setActiveTab('appointments')}>Appointments ({appointments.length})</div>
          <div style={tabStyle('prescriptions')} onClick={()=>setActiveTab('prescriptions')}>Prescriptions ({prescriptions.length})</div>
          <div style={tabStyle('bills')} onClick={()=>setActiveTab('bills')}>Bills ({bills.length})</div>
        </div>

        <div style={{padding:'24px'}}>
          {activeTab === 'appointments' && (
            <div>
              {appointments.length === 0 ? <p style={{color:'#666'}}>No appointments booked.</p> : appointments.map(a => (
                <div key={a.id} style={{padding:'16px',border:'1px solid #eee',borderRadius:'8px',marginBottom:'12px',display:'flex',justifyContent:'space-between'}}>
                  <div>
                    <h4 style={{margin:'0 0 8px 0'}}>Dr. {a.doctorName} <span style={{fontSize:'14px',color:'#666'}}>({a.departmentName})</span></h4>
                    <p style={{margin:0,color:'#444'}}>{new Date(a.appointmentDate).toLocaleDateString()} at {a.appointmentTime} - Token #{a.tokenNumber}</p>
                    <p style={{margin:'4px 0 0 0',color:'#888',fontSize:'14px'}}>Complaint: {a.chiefComplaint}</p>
                  </div>
                  <span style={{padding:'4px 12px',borderRadius:'16px',background:`${statusColor(a.status)}22`,color:statusColor(a.status),fontWeight:'bold',height:'fit-content'}}>{a.status}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div>
              {prescriptions.length === 0 ? <p style={{color:'#666'}}>No prescriptions found.</p> : prescriptions.map(p => (
                <div key={p.id} style={{padding:'16px',border:'1px solid #eee',borderRadius:'8px',marginBottom:'12px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
                    <strong style={{color:'#444'}}>Prescribed on {new Date(p.prescribedAt).toLocaleDateString()}</strong>
                    <span style={{padding:'4px 12px',borderRadius:'16px',background:`${statusColor(p.status)}22`,color:statusColor(p.status),fontWeight:'bold'}}>{p.status}</span>
                  </div>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead><tr style={{background:'#f9f9f9',textAlign:'left'}}><th style={{padding:'8px'}}>Medicine</th><th style={{padding:'8px'}}>Dosage</th><th style={{padding:'8px'}}>Duration</th></tr></thead>
                    <tbody>
                      {p.items?.map(i => (
                        <tr key={i.id} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'8px'}}>{i.medicineName}</td><td style={{padding:'8px'}}>{i.dosage} {i.frequency}</td><td style={{padding:'8px'}}>{i.durationDays} days</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'bills' && (
            <div>
              {bills.length === 0 ? <p style={{color:'#666'}}>No bills found.</p> : bills.map(b => (
                <div key={b.id} style={{padding:'16px',border:'1px solid #eee',borderRadius:'8px',marginBottom:'12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <h4 style={{margin:'0 0 8px 0'}}>Invoice {b.billNumber}</h4>
                    <p style={{margin:0,color:'#444'}}>Total: ${b.totalAmount} | Paid: ${b.paidAmount}</p>
                  </div>
                  <span style={{padding:'4px 12px',borderRadius:'16px',background:`${statusColor(b.paymentStatus)}22`,color:statusColor(b.paymentStatus),fontWeight:'bold'}}>{b.paymentStatus}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
'@

$code['hospitalms-frontend\src\pages\doctor\DoctorDashboard.jsx'] = @'
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const [admissions, setAdmissions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('admissions');
  const [loading, setLoading] = useState(false);

  // Forms
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [admitForm, setAdmitForm] = useState({ patientId: '', wardType: 'General', admissionReason: '' });

  const [showPrescModal, setShowPrescModal] = useState(false);
  const [prescForm, setPrescForm] = useState({ patientId: '', notes: '', items: [] });
  const [newItem, setNewItem] = useState({ medicineId: '', dosage: '', frequency: '', durationDays: 1, quantityToDispense: 1 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [admRes, apptRes] = await Promise.all([
        api.get('/api/admissions'),
        api.get('/api/appointments').catch(() => ({data:[]}))
      ]);
      setAdmissions(admRes.data);
      setAppointments(apptRes.data);
    } catch(e) { console.error('Failed to load data', e); }
  };

  const admitPatient = async () => {
    setLoading(true);
    try {
      await api.post('/api/admissions', { ...admitForm, doctorId: user.id });
      setShowAdmitModal(false);
      loadData();
    } catch(e) { alert(e.response?.data?.message || 'Error admitting patient'); }
    finally { setLoading(false); }
  };

  const dischargePatient = async (id) => {
    try {
      await api.put(`/api/admissions/${id}/discharge`, { dischargeSummary: 'Discharged by doctor', dischargeCondition: 'Stable' });
      loadData();
    } catch(e) { alert(e.response?.data?.message || 'Error discharging'); }
  };

  const createPrescription = async () => {
    setLoading(true);
    try {
      await api.post('/api/prescriptions', { ...prescForm, doctorId: user.id });
      setShowPrescModal(false);
      setPrescForm({ patientId: '', notes: '', items: [] });
      alert("Prescription created successfully!");
    } catch(e) { alert(e.response?.data?.message || 'Error creating prescription'); }
    finally { setLoading(false); }
  };

  const tabStyle = (tab) => ({
    padding: '12px 24px', cursor: 'pointer', borderBottom: activeTab === tab ? '3px solid #1976d2' : '3px solid transparent',
    fontWeight: activeTab === tab ? 'bold' : 'normal', color: activeTab === tab ? '#1976d2' : '#666'
  });

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#f5f5f5'}}>
      <div style={{background:'#1976d2',color:'white',padding:'16px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1 style={{margin:0}}>Doctor Dashboard</h1>
        <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
          <span>Dr. {user?.fullName}</span>
          <button onClick={logout} style={{padding:'6px 12px',background:'white',color:'#1976d2',border:'none',borderRadius:'4px',cursor:'pointer'}}>Logout</button>
        </div>
      </div>

      <div style={{maxWidth:'1200px',margin:'24px auto'}}>
        <div style={{display:'flex',gap:'12px',marginBottom:'24px'}}>
          <button onClick={() => setShowAdmitModal(true)} style={{padding:'10px 20px',background:'#388e3c',color:'white',border:'none',borderRadius:'4px',cursor:'pointer'}}>+ Admit Patient</button>
          <button onClick={() => setShowPrescModal(true)} style={{padding:'10px 20px',background:'#1976d2',color:'white',border:'none',borderRadius:'4px',cursor:'pointer'}}>+ Write Prescription</button>
        </div>

        <div style={{background:'white',borderRadius:'8px',boxShadow:'0 2px 4px rgba(0,0,0,0.1)',overflow:'hidden'}}>
          <div style={{display:'flex',borderBottom:'1px solid #eee'}}>
            <div style={tabStyle('admissions')} onClick={()=>setActiveTab('admissions')}>Active IPD Admissions ({admissions.length})</div>
            <div style={tabStyle('appointments')} onClick={()=>setActiveTab('appointments')}>Appointments ({appointments.length})</div>
          </div>

          <div style={{padding:'24px'}}>
            {activeTab === 'admissions' && (
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:'#f9f9f9',textAlign:'left'}}><th style={{padding:'12px'}}>Patient ID</th><th style={{padding:'12px'}}>Bed</th><th style={{padding:'12px'}}>Admitted On</th><th style={{padding:'12px'}}>Status</th><th style={{padding:'12px'}}>Action</th></tr></thead>
                <tbody>
                  {admissions.length === 0 ? <tr><td colSpan="5" style={{padding:'12px',textAlign:'center'}}>No active admissions.</td></tr> : admissions.map(a => (
                    <tr key={a.id} style={{borderBottom:'1px solid #eee'}}>
                      <td style={{padding:'12px'}}>{a.patientId}</td>
                      <td style={{padding:'12px'}}>{a.bedNumber} ({a.wardType})</td>
                      <td style={{padding:'12px'}}>{new Date(a.admissionDate).toLocaleDateString()}</td>
                      <td style={{padding:'12px'}}><span style={{background:'#e8f5e9',color:'#2e7d32',padding:'4px 8px',borderRadius:'16px',fontSize:'12px',fontWeight:'bold'}}>{a.status}</span></td>
                      <td style={{padding:'12px'}}>
                        <button onClick={() => dischargePatient(a.id)} style={{padding:'6px 12px',background:'#d32f2f',color:'white',border:'none',borderRadius:'4px',cursor:'pointer'}}>Discharge</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'appointments' && (
              <div style={{display:'grid',gap:'12px'}}>
                {appointments.map(a => (
                  <div key={a.id} style={{padding:'16px',border:'1px solid #eee',borderRadius:'8px',display:'flex',justifyContent:'space-between'}}>
                    <div>
                      <strong>Patient: {a.patientName}</strong>
                      <p style={{margin:'4px 0 0 0',color:'#666'}}>{new Date(a.appointmentDate).toLocaleDateString()} - Token {a.tokenNumber}</p>
                    </div>
                    <span style={{color:'#1976d2',fontWeight:'bold'}}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAdmitModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'white',padding:'24px',borderRadius:'8px',width:'400px'}}>
            <h3 style={{marginTop:0}}>Admit Patient to IPD</h3>
            <input type="number" placeholder="Patient ID" value={admitForm.patientId} onChange={e=>setAdmitForm({...admitForm, patientId: parseInt(e.target.value)||''})} style={{width:'100%',padding:'8px',marginBottom:'12px',boxSizing:'border-box'}}/>
            <select value={admitForm.wardType} onChange={e=>setAdmitForm({...admitForm, wardType: e.target.value})} style={{width:'100%',padding:'8px',marginBottom:'12px',boxSizing:'border-box'}}>
              <option value="General">General</option>
              <option value="Private">Private</option>
              <option value="ICU">ICU</option>
              <option value="Maternity">Maternity</option>
            </select>
            <input type="text" placeholder="Reason for Admission" value={admitForm.admissionReason} onChange={e=>setAdmitForm({...admitForm, admissionReason: e.target.value})} style={{width:'100%',padding:'8px',marginBottom:'20px',boxSizing:'border-box'}}/>
            <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
              <button onClick={()=>setShowAdmitModal(false)} style={{padding:'8px 16px',border:'1px solid #ddd',background:'white',cursor:'pointer',borderRadius:'4px'}}>Cancel</button>
              <button onClick={admitPatient} disabled={loading} style={{padding:'8px 16px',background:'#1976d2',color:'white',border:'none',cursor:'pointer',borderRadius:'4px'}}>Admit</button>
            </div>
          </div>
        </div>
      )}

      {showPrescModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'white',padding:'24px',borderRadius:'8px',width:'600px',maxHeight:'80vh',overflowY:'auto'}}>
            <h3 style={{marginTop:0}}>Write Prescription</h3>
            <input type="number" placeholder="Patient ID" value={prescForm.patientId} onChange={e=>setPrescForm({...prescForm, patientId: parseInt(e.target.value)||''})} style={{width:'100%',padding:'8px',marginBottom:'12px',boxSizing:'border-box'}}/>
            <textarea placeholder="Clinical Notes" value={prescForm.notes} onChange={e=>setPrescForm({...prescForm, notes: e.target.value})} style={{width:'100%',padding:'8px',marginBottom:'16px',boxSizing:'border-box',resize:'vertical'}}/>
            
            <h4 style={{borderBottom:'1px solid #eee',paddingBottom:'8px',marginBottom:'12px'}}>Add Medicine</h4>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
              <input type="number" placeholder="Medicine ID" value={newItem.medicineId} onChange={e=>setNewItem({...newItem, medicineId: parseInt(e.target.value)||''})} style={{padding:'8px'}}/>
              <input type="text" placeholder="Dosage (e.g. 500mg)" value={newItem.dosage} onChange={e=>setNewItem({...newItem, dosage: e.target.value})} style={{padding:'8px'}}/>
              <input type="text" placeholder="Frequency (e.g. 1-0-1)" value={newItem.frequency} onChange={e=>setNewItem({...newItem, frequency: e.target.value})} style={{padding:'8px'}}/>
              <input type="number" placeholder="Duration (Days)" value={newItem.durationDays} onChange={e=>setNewItem({...newItem, durationDays: parseInt(e.target.value)||1})} style={{padding:'8px'}}/>
              <input type="number" placeholder="Total Qty to Dispense" value={newItem.quantityToDispense} onChange={e=>setNewItem({...newItem, quantityToDispense: parseInt(e.target.value)||1})} style={{padding:'8px'}}/>
            </div>
            <button onClick={() => { setPrescForm({...prescForm, items: [...prescForm.items, newItem]}); setNewItem({ medicineId: '', dosage: '', frequency: '', durationDays: 1, quantityToDispense: 1 }); }} style={{padding:'8px 16px',background:'#e0e0e0',border:'none',borderRadius:'4px',cursor:'pointer',width:'100%',marginBottom:'20px'}}>Add to List</button>

            {prescForm.items.length > 0 && (
              <ul style={{background:'#f9f9f9',padding:'16px',borderRadius:'4px',listStyle:'none',margin:'0 0 20px 0'}}>
                {prescForm.items.map((it, idx) => <li key={idx} style={{marginBottom:'8px'}}>Med ID: {it.medicineId} | {it.dosage} | {it.frequency} | {it.quantityToDispense} Qty</li>)}
              </ul>
            )}

            <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
              <button onClick={()=>setShowPrescModal(false)} style={{padding:'8px 16px',border:'1px solid #ddd',background:'white',cursor:'pointer',borderRadius:'4px'}}>Cancel</button>
              <button onClick={createPrescription} disabled={loading || prescForm.items.length===0} style={{padding:'8px 16px',background:'#1976d2',color:'white',border:'none',cursor:'pointer',borderRadius:'4px'}}>Save Prescription</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'@

$code['hospitalms-frontend\src\pages\admin\AdminDashboard.jsx'] = @'
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { useSignalR } from '../../hooks/useSignalR';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const { connection } = useSignalR('http://localhost:5004/hubs/hospital');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, admRes] = await Promise.all([
          api.get('/api/auth/users'),
          api.get('/api/admissions')
        ]);
        setUsers(usersRes.data);
        setAdmissions(admRes.data);
      } catch(e) { console.error("Failed to load admin data", e); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!connection) return;
    connection.on('LowStockAlert', (data) => {
      setAlerts(prev => [{id: Date.now(), msg: `LOW STOCK ALERT: ${data.name} has only ${data.currentStock} units left!`, type:'error'}, ...prev]);
    });
    connection.on('BedStatusChanged', (data) => {
      setAlerts(prev => [{id: Date.now(), msg: `Bed ${data.bedNumber || data.bedId} status changed to ${data.newStatus}`, type:'info'}, ...prev]);
    });
    return () => { connection.off('LowStockAlert'); connection.off('BedStatusChanged'); };
  }, [connection]);

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#f5f5f5'}}>
      <div style={{background:'#212121',color:'white',padding:'16px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1 style={{margin:0}}>System Administrator Dashboard</h1>
        <button onClick={logout} style={{padding:'6px 12px',background:'white',color:'#212121',border:'none',borderRadius:'4px',cursor:'pointer'}}>Logout</button>
      </div>

      <div style={{maxWidth:'1200px',margin:'24px auto',display:'grid',gridTemplateColumns:'2fr 1fr',gap:'24px'}}>
        <div>
          <div style={{background:'white',padding:'24px',borderRadius:'8px',boxShadow:'0 2px 4px rgba(0,0,0,0.1)',marginBottom:'24px'}}>
            <h2 style={{margin:'0 0 16px 0'}}>Staff & Users ({users.length})</h2>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#f9f9f9',textAlign:'left'}}><th style={{padding:'12px'}}>ID</th><th style={{padding:'12px'}}>Name</th><th style={{padding:'12px'}}>Email</th><th style={{padding:'12px'}}>Role</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{borderBottom:'1px solid #eee'}}>
                    <td style={{padding:'12px'}}>{u.id}</td>
                    <td style={{padding:'12px'}}>{u.fullName}</td>
                    <td style={{padding:'12px'}}>{u.email}</td>
                    <td style={{padding:'12px'}}><span style={{background:'#e3f2fd',color:'#2e7d32',padding:'4px 8px',borderRadius:'4px',fontSize:'12px'}}>{u.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{background:'white',padding:'24px',borderRadius:'8px',boxShadow:'0 2px 4px rgba(0,0,0,0.1)'}}>
            <h2 style={{margin:'0 0 16px 0'}}>Active IPD Admissions ({admissions.length})</h2>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#f9f9f9',textAlign:'left'}}><th style={{padding:'12px'}}>Patient ID</th><th style={{padding:'12px'}}>Bed</th><th style={{padding:'12px'}}>Ward</th><th style={{padding:'12px'}}>Admitted</th></tr></thead>
              <tbody>
                {admissions.map(a => (
                  <tr key={a.id} style={{borderBottom:'1px solid #eee'}}>
                    <td style={{padding:'12px'}}>{a.patientId}</td>
                    <td style={{padding:'12px'}}>{a.bedNumber}</td>
                    <td style={{padding:'12px'}}>{a.wardType}</td>
                    <td style={{padding:'12px'}}>{new Date(a.admissionDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div style={{background:'white',padding:'24px',borderRadius:'8px',boxShadow:'0 2px 4px rgba(0,0,0,0.1)',position:'sticky',top:'24px'}}>
            <h2 style={{margin:'0 0 16px 0',display:'flex',alignItems:'center',gap:'8px'}}>Live System Alerts <span style={{background:'#d32f2f',color:'white',padding:'2px 8px',borderRadius:'16px',fontSize:'14px'}}>{alerts.length}</span></h2>
            <div style={{maxHeight:'600px',overflowY:'auto',display:'flex',flexDirection:'column',gap:'12px'}}>
              {alerts.length === 0 ? <p style={{color:'#666'}}>No active alerts.</p> : alerts.map(alert => (
                <div key={alert.id} style={{padding:'12px',borderRadius:'4px',background:alert.type==='error'?'#ffebee':'#e3f2fd',borderLeft:`4px solid ${alert.type==='error'?'#d32f2f':'#1976d2'}`}}>
                  <p style={{margin:0,fontSize:'14px',color:alert.type==='error'?'#c62828':'#1565c0',fontWeight:'bold'}}>{alert.msg}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'@

$code['hospitalms-frontend\src\pages\lab\LabDashboard.jsx'] = @'
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';

export default function LabDashboard() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resultForm, setResultForm] = useState({ orderId: null, resultValue: '', notes: '', isAbnormal: false });

  useEffect(() => { loadPending(); }, []);

  const loadPending = async () => {
    try {
      const res = await api.get('/api/lab/pending');
      setOrders(res.data);
    } catch(e) { console.error('Failed to load lab orders', e); }
  };

  const uploadResult = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.patch(`/api/lab/${resultForm.orderId}/result`, {
        resultValue: resultForm.resultValue,
        notes: resultForm.notes,
        isAbnormal: resultForm.isAbnormal
      });
      setResultForm({ orderId: null, resultValue: '', notes: '', isAbnormal: false });
      alert("Result uploaded successfully!");
      loadPending();
    } catch(e) { alert(e.response?.data?.message || 'Error uploading result'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#f5f5f5'}}>
      <div style={{background:'#673ab7',color:'white',padding:'16px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1 style={{margin:0}}>Laboratory Dashboard</h1>
        <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
          <span>Tech: {user?.fullName}</span>
          <button onClick={logout} style={{padding:'6px 12px',background:'white',color:'#673ab7',border:'none',borderRadius:'4px',cursor:'pointer'}}>Logout</button>
        </div>
      </div>

      <div style={{maxWidth:'1000px',margin:'24px auto',background:'white',padding:'24px',borderRadius:'8px',boxShadow:'0 2px 4px rgba(0,0,0,0.1)'}}>
        <h2 style={{margin:'0 0 20px 0'}}>Pending Lab Orders ({orders.length})</h2>
        <div style={{display:'grid',gap:'16px'}}>
          {orders.length === 0 ? <p style={{color:'#666'}}>No pending orders.</p> : orders.map(o => (
            <div key={o.id} style={{padding:'16px',border:'1px solid #ddd',borderRadius:'8px',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#fafafa'}}>
              <div>
                <h4 style={{margin:'0 0 8px 0',color:'#333'}}>Order #{o.id} | Patient ID: {o.patientId}</h4>
                <p style={{margin:0,color:'#666'}}>Test: <strong>{o.testName}</strong></p>
                <p style={{margin:'4px 0 0 0',color:'#888',fontSize:'14px'}}>Ordered at: {new Date(o.orderedAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setResultForm({...resultForm, orderId: o.id})} style={{padding:'10px 20px',background:'#673ab7',color:'white',border:'none',borderRadius:'4px',cursor:'pointer',fontWeight:'bold'}}>Upload Result</button>
            </div>
          ))}
        </div>
      </div>

      {resultForm.orderId && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'white',padding:'24px',borderRadius:'8px',width:'400px'}}>
            <h3 style={{marginTop:0}}>Upload Result for Order #{resultForm.orderId}</h3>
            <form onSubmit={uploadResult}>
              <textarea placeholder="Result Value (e.g. 'Hb: 12.5 g/dL')" value={resultForm.resultValue} onChange={e=>setResultForm({...resultForm, resultValue: e.target.value})} required style={{width:'100%',padding:'8px',marginBottom:'12px',boxSizing:'border-box',minHeight:'80px',resize:'vertical'}}/>
              <input type="text" placeholder="Additional Notes" value={resultForm.notes} onChange={e=>setResultForm({...resultForm, notes: e.target.value})} style={{width:'100%',padding:'8px',marginBottom:'16px',boxSizing:'border-box'}}/>
              <label style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'20px',cursor:'pointer',fontWeight:'bold',color:'#d32f2f'}}>
                <input type="checkbox" checked={resultForm.isAbnormal} onChange={e=>setResultForm({...resultForm, isAbnormal: e.target.checked})} style={{transform:'scale(1.2)'}}/>
                Mark as Abnormal
              </label>
              <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>setResultForm({ orderId: null, resultValue: '', notes: '', isAbnormal: false })} style={{padding:'8px 16px',border:'1px solid #ddd',background:'white',cursor:'pointer',borderRadius:'4px'}}>Cancel</button>
                <button type="submit" disabled={loading} style={{padding:'8px 16px',background:'#673ab7',color:'white',border:'none',cursor:'pointer',borderRadius:'4px'}}>Save Result</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
'@

foreach ($path in $code.Keys) {
    $dir = Split-Path $path -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    Set-Content -Path $path -Value $code[$path]
}
