import React, { useEffect, useState, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Stethoscope, Calendar, Shield, Activity, ArrowRight,
  Users, Heart, HeartPulse, LogIn, UserPlus, ArrowLeft,
  FlaskConical, Pill, Building2, TrendingUp, BedDouble,
  Phone, MapPin, Mail, Star, CheckCircle2, AlertCircle,
  X, LayoutDashboard, Microscope,
  ArrowUpRight, Loader2, ChevronRight,
  BellRing, Settings2, Clock
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE = 'http://localhost:5000';

async function apiFetch<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Department { id: number; name: string; description?: string; floorNumber?: number; }
interface Doctor { id: number; fullName: string; specialization: string; qualification?: string; consultationFee?: number; isAvailable?: boolean; departmentId?: number; profileImageUrl?: string; }
interface Bed { id: number; bedNumber: string; wardType: string; status: string; dailyCharge?: number; }
interface Stats { totalDoctors?: number; totalPatients?: number; totalAppointments?: number; totalDepartments?: number; availableBeds?: number; totalBeds?: number; }
interface TimeSlot { time: string; isAvailable: boolean; }

// ─── Dept icon map ────────────────────────────────────────────────────────────
const DEPT_META: Record<string, { icon: React.FC<any>; color: string; bg: string }> = {
  cardiology: { icon: Heart, color: '#dc2626', bg: '#fef2f2' },
  neurology: { icon: Activity, color: '#7c3aed', bg: '#f5f3ff' },
  orthopaedics: { icon: Activity, color: '#ea580c', bg: '#fff7ed' },
  ophthalmology: { icon: Activity, color: '#0891b2', bg: '#ecfeff' },
  paediatric: { icon: Activity, color: '#db2777', bg: '#fdf2f8' },
  laboratory: { icon: Microscope, color: '#059669', bg: '#ecfdf5' },
  pharmacy: { icon: Pill, color: '#2563eb', bg: '#eff6ff' },
  general: { icon: Stethoscope, color: '#0f766e', bg: '#f0fdfa' },
  default: { icon: Activity, color: '#4f46e5', bg: '#eef2ff' },
};

function getDeptMeta(name: string) {
  const key = name.toLowerCase().replace(/[^a-z]/g, '');
  for (const [k, v] of Object.entries(DEPT_META)) {
    if (key.includes(k)) return v;
  }
  return DEPT_META.default;
}

// ─────────────────────────────────────────────────────────────────────────────
//  BOOK APPOINTMENT MODAL
// ─────────────────────────────────────────────────────────────────────────────
interface BookModalProps {
  open: boolean;
  onClose: () => void;
  departments: Department[];
  token?: string;
  userId?: number;
  isAuthenticated: boolean;
  initialDeptId?: number | null;
  initialDocId?: number | null;
}

function BookModal({ open, onClose, departments, token, isAuthenticated, initialDeptId, initialDocId }: BookModalProps) {
  const { user } = useAuth() as any;
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedDept, setDept] = useState<number | null>(initialDeptId ?? null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorsLoading, setDL] = useState(false);
  const [selectedDoc, setDoc] = useState<number | null>(initialDocId ?? null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSL] = useState(false);
  const [date, setDate] = useState('');
  const [selectedTime, setTime] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [complaint, setComplaint] = useState('');

  // Auto-calculate age if DOB is available
  useEffect(() => {
    if (open && user?.dateOfBirth) {
      try {
        const dobStr = user.dateOfBirth.split(' ')[0].split('T')[0];
        let [year, month, day] = [0, 0, 0];
        const parts = dobStr.split(/[-/]/);
        
        if (parts[0].length === 4) {
          [year, month, day] = parts.map(Number);
        } else {
          [day, month, year] = parts.map(Number);
        }

        if (year && month && day) {
          const today = new Date();
          let age = today.getFullYear() - year;
          const m = today.getMonth() + 1;
          if (m < month || (m === month && today.getDate() < day)) {
            age--;
          }
          setPatientAge(age >= 0 ? age.toString() : '0');
        }
      } catch (err) {
        console.error("Age calculation error", err);
      }
    }
  }, [user, open]);
  const [submitting, setSub] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      if (user?.fullName) setPatientName(user.fullName);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [open, user]);

  useEffect(() => {
    if (!open) { 
      setStep(1); 
      setDept(null); 
      setDoc(null); 
      setDate(''); 
      setTime(''); 
      setPatientName(user?.fullName || ''); 
      setPatientAge(''); 
      setComplaint(''); 
      setSuccess(false); 
      setError(''); 
    } else {
      if (initialDeptId) setDept(initialDeptId);
      if (initialDocId) {
        setDoc(initialDocId);
        setStep(3); // Direct access to Name and Age
      }
    }
  }, [open, initialDeptId, initialDocId, user]);

  useEffect(() => {
    if (!selectedDept) return;
    setDL(true);
    // If we have an initialDocId and it belongs to this dept, we don't necessarily need to reset it, 
    // but the doctors list should be loaded.
    apiFetch<any>(`/api/doctors/department/${selectedDept}`, token)
      .then(r => setDoctors(Array.isArray(r) ? r : (r.data ?? [])))
      .catch(() => setDoctors([]))
      .finally(() => setDL(false));
  }, [selectedDept, token]);

  useEffect(() => {
    if (!selectedDoc || !date) return;
    setSL(true); setTime('');
    apiFetch<any>(`/api/appointments/slots/${selectedDoc}?date=${date}`, token)
      .then(r => {
        const data = Array.isArray(r) ? r : (r.data || r.availableSlots || []);
        setSlots(data.map((t: any) => typeof t === 'string' ? { time: t, isAvailable: true } : t));
      })
      .catch(() => setSlots([]))
      .finally(() => setSL(false));
  }, [selectedDoc, date, token]);

  const handleSubmit = async () => {
    if (!isAuthenticated) { onClose(); navigate('/login'); return; }
    if (!selectedDoc || !date || !selectedTime || !patientName || !patientAge) { setError('Please fill all required fields.'); return; }
    setSub(true); setError('');
    try {
      const res = await fetch(`${BASE}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          doctorId: selectedDoc,
          patientName,
          patientPhone: user?.phone || '',
          patientAge: parseInt(patientAge),
          appointmentDate: date,
          appointmentTime: selectedTime.includes(':') && selectedTime.split(':').length === 2 ? selectedTime + ':00' : selectedTime,
          chiefComplaint: complaint || 'General Checkup'
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Booking failed'); }
      setSuccess(true);
    } catch (e: any) { setError(e.message ?? 'Something went wrong'); }
    finally { setSub(false); }
  };

  if (!open) return null;

  const steps = ['Department', 'Specialist', 'Patient Info', 'Date & Time', 'Confirm'];

  return (
    <div className="fixed inset-0 z-[9999] bg-emerald-500/40 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 md:p-12 flex justify-center items-start animate-in fade-in duration-200" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#FDFDFD] border border-zinc-200 rounded-[24px] w-full max-w-[560px] shadow-[0_32px_80px_rgba(0,0,0,0.08)] overflow-hidden relative mt-8 sm:mt-12 animate-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 relative">
          <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-colors">
            <X strokeWidth={2} className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
              <Calendar strokeWidth={1.5} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold text-zinc-900 tracking-tight leading-none">Schedule an Appointment</h2>
              <p className="text-[13px] text-zinc-500 mt-1">GOMEDIC Clinical Interface</p>
            </div>
          </div>

          {/* Progress Indicator */}
          {!success && (
            <div className="flex gap-2 mb-2">
              {steps.map((s, i) => (
                <div key={s} className="flex-1">
                  <div className={`h-1 rounded-full mb-1.5 transition-colors duration-300 ${i < step ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${i < step ? 'text-zinc-900' : 'text-zinc-400'}`}>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="px-6 pb-8">
          {success ? (
            <div className="text-center py-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="w-16 h-16 rounded-full bg-zinc-100 border-4 border-zinc-50 flex items-center justify-center mx-auto mb-5 text-zinc-900">
                <CheckCircle2 strokeWidth={2} className="w-8 h-8" />
              </div>
              <h3 className="text-[20px] font-semibold text-zinc-900 mb-2">Booking Confirmed</h3>
              <p className="text-[14px] text-zinc-500 mb-8 max-w-[300px] mx-auto">Your appointment has been successfully scheduled. You can view the details in your dashboard.</p>
              <button onClick={onClose} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[14px] font-medium transition-colors">
                Return to Home
              </button>
            </div>
          ) : (
            <div className="min-h-[300px]">

              {/* Step 1: Department */}
              {step === 1 && (
                <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                  <h3 className="text-[15px] font-semibold text-zinc-900 mb-1">Select Department</h3>
                  <p className="text-[13px] text-zinc-500 mb-5">Choose the medical specialty required.</p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {departments.map(d => {
                      const meta = getDeptMeta(d.name);
                      const Icon = meta.icon;
                      const sel = selectedDept === d.id;
                      return (
                        <button key={d.id} onClick={() => setDept(d.id)}
                          className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${sel ? 'border-emerald-500 bg-zinc-50 ring-1 ring-emerald-500' : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'}`}>
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${sel ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                            <Icon strokeWidth={sel ? 2 : 1.5} className="w-[18px] h-[18px]" />
                          </div>
                          <span className={`text-[13px] font-medium leading-tight ${sel ? 'text-zinc-900' : 'text-zinc-700'}`}>{d.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button onClick={() => selectedDept && setStep(2)} disabled={!selectedDept}
                    className={`w-full py-2.5 rounded-xl text-[14px] font-medium transition-all flex items-center justify-center gap-2 ${selectedDept ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}>
                    Continue <ArrowRight strokeWidth={2} className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Step 2: Doctor */}
              {step === 2 && (
                <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                  <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 text-[13px] font-medium transition-colors mb-4"><ArrowLeft strokeWidth={2} className="w-3.5 h-3.5" /> Back</button>
                  <h3 className="text-[15px] font-semibold text-zinc-900 mb-1">Select Specialist</h3>
                  <p className="text-[13px] text-zinc-500 mb-5">Available specialists in the chosen department.</p>

                  {doctorsLoading ? (
                    <div className="py-12 flex justify-center text-zinc-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
                  ) : (
                    <div className="space-y-2 mb-6 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                      {doctors.map((doc) => {
                        const sel = selectedDoc === doc.id;
                        return (
                          <button key={doc.id} onClick={() => setDoc(doc.id)}
                            className={`w-full p-3.5 rounded-xl border flex items-center gap-4 text-left transition-all ${sel ? 'border-emerald-500 bg-zinc-50 ring-1 ring-emerald-500' : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'}`}>
                            {doc.profileImageUrl ? (
                              <img src={doc.profileImageUrl.startsWith('http') ? doc.profileImageUrl : `${BASE}${doc.profileImageUrl}`} alt={doc.fullName} className="w-10 h-10 rounded-full object-cover border border-zinc-200" />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-medium ${sel ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                                {(doc.fullName || 'D').charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className={`text-[14px] font-medium truncate ${sel ? 'text-zinc-900' : 'text-zinc-800'}`}>{(doc.fullName || '').toLowerCase().startsWith('dr.') ? doc.fullName : `Dr. ${doc.fullName || doc.id}`}</div>
                              <div className="text-[12px] text-zinc-500 truncate">{doc.specialization}</div>
                            </div>
                            <div className="text-right">
                              {doc.consultationFee && <div className={`text-[14px] font-semibold ${sel ? 'text-zinc-900' : 'text-zinc-700'}`}>₹{doc.consultationFee}</div>}
                            </div>
                          </button>
                        );
                      })}
                      {doctors.length === 0 && <p className="text-center text-[13px] text-zinc-500 py-8 border border-dashed border-zinc-200 rounded-xl">No specialists found in this department.</p>}
                    </div>
                  )}

                  <button onClick={() => selectedDoc && setStep(3)} disabled={!selectedDoc}
                    className={`w-full py-2.5 rounded-xl text-[14px] font-medium transition-all flex items-center justify-center gap-2 ${selectedDoc ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}>
                    Continue <ArrowRight strokeWidth={2} className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Step 3: Info */}
              {step === 3 && (
                <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                  {!initialDocId && <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 text-[13px] font-medium transition-colors mb-4"><ArrowLeft strokeWidth={2} className="w-3.5 h-3.5" /> Back</button>}
                  <h3 className="text-[15px] font-semibold text-zinc-900 mb-1">Patient Information</h3>
                  <p className="text-[13px] text-zinc-500 mb-5">Please verify the primary patient details.</p>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-[12px] font-medium text-zinc-700 mb-1.5 ml-0.5">Patient Full Name</label>
                      <input type="text" value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="e.g. John Doe"
                        className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-lg text-[14px] placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-zinc-700 mb-1.5 ml-0.5">Patient Age</label>
                      <input type="number" value={patientAge} onChange={e => setPatientAge(e.target.value)} placeholder="Age in years"
                        readOnly={!!user?.dateOfBirth}
                        className={`w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-[14px] placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 transition-all shadow-sm ${user?.dateOfBirth ? 'bg-zinc-50 text-zinc-500 cursor-not-allowed' : 'bg-white text-zinc-900'}`}
                      />
                    </div>
                  </div>

                  <button onClick={() => (patientName && patientAge) && setStep(4)} disabled={!patientName || !patientAge}
                    className={`w-full py-2.5 rounded-xl text-[14px] font-medium transition-all flex items-center justify-center gap-2 ${(patientName && patientAge) ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}>
                    Continue <ArrowRight strokeWidth={2} className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Step 4: Schedule */}
              {step === 4 && (
                <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                  <button onClick={() => setStep(3)} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 text-[13px] font-medium transition-colors mb-4"><ArrowLeft strokeWidth={2} className="w-3.5 h-3.5" /> Back</button>
                  <h3 className="text-[15px] font-semibold text-zinc-900 mb-1">Choose Date & Time</h3>
                  <p className="text-[13px] text-zinc-500 mb-5">Select your preferred appointment slot.</p>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-[12px] font-medium text-zinc-700 mb-1.5 ml-0.5">Date</label>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-lg text-[14px] text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 transition-all shadow-sm"
                      />
                    </div>

                    {date && (
                      <div>
                        <label className="block text-[12px] font-medium text-zinc-700 mb-1.5 ml-0.5">Available Slots</label>
                        {slotsLoading ? (
                          <div className="py-6 flex justify-center text-zinc-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
                        ) : (
                          <div className="grid grid-cols-4 gap-2 max-h-[160px] overflow-y-auto pr-1">
                            {slots.map(slotObj => {
                              const isBooked = typeof slotObj === 'string' ? slotObj.endsWith('::booked') : !slotObj.isAvailable;
                              const time = typeof slotObj === 'string' ? slotObj.replace('::booked', '') : slotObj.time;
                              const isSelected = selectedTime === time;

                              return (
                                <button
                                  key={typeof slotObj === 'string' ? slotObj : slotObj.time}
                                  onClick={() => { if (isBooked) return; setTime(time); }}
                                  className={`relative py-2 px-1 rounded-lg text-[12px] font-medium transition-all border
                                    ${isBooked ? 'bg-zinc-50 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60' :
                                      isSelected ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' :
                                        'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}
                                  `}>
                                  {time}
                                  {isBooked && <span className="absolute bottom-0 right-0 left-0 text-[8px] uppercase font-bold text-zinc-400 translate-y-[-2px]">Booked</span>}
                                </button>
                              );
                            })}
                            {slots.length === 0 && <p className="col-span-4 text-center text-[12px] text-zinc-500 py-4 border border-dashed border-zinc-200 rounded-lg">No slots available for this date.</p>}
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-[12px] font-medium text-zinc-700 mb-1.5 ml-0.5">Chief Complaint <span className="text-zinc-400 font-normal">(optional)</span></label>
                      <textarea value={complaint} onChange={e => setComplaint(e.target.value)} rows={2} placeholder="Briefly describe symptoms..."
                        className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-lg text-[14px] placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 transition-all shadow-sm resize-none"
                      />
                    </div>
                  </div>

                  <button onClick={() => (date && selectedTime) && setStep(5)} disabled={!date || !selectedTime}
                    className={`w-full py-2.5 rounded-xl text-[14px] font-medium transition-all flex items-center justify-center gap-2 ${(date && selectedTime) ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}>
                    Review Details <ArrowRight strokeWidth={2} className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Step 5: Confirm */}
              {step === 5 && (
                <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                  <button onClick={() => setStep(4)} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 text-[13px] font-medium transition-colors mb-4"><ArrowLeft strokeWidth={2} className="w-3.5 h-3.5" /> Back</button>
                  <h3 className="text-[15px] font-semibold text-zinc-900 mb-1">Confirm Appointment</h3>
                  <p className="text-[13px] text-zinc-500 mb-5">Please double-check your appointment details before finalizing.</p>

                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 mb-6 space-y-3">
                    {[
                      { label: 'Patient', value: `${patientName} (${patientAge}y)` },
                      { label: 'Consultant', value: (() => { const d = doctors.find(doc => doc.id === selectedDoc); return d ? (d.fullName.toLowerCase().startsWith('dr.') ? d.fullName : `Dr. ${d.fullName}`) : `Dr. #${selectedDoc}`; })() },
                      { label: 'Consultation Fee', value: `₹${doctors.find(d => d.id === selectedDoc)?.consultationFee || '500'}`, highlight: true },
                      { label: 'Date', value: date },
                      { label: 'Time', value: selectedTime },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center text-[13px]">
                        <span className="text-zinc-500 font-medium">{item.label}</span>
                        <span className={`font-semibold ${item.highlight ? 'text-zinc-900' : 'text-zinc-800'}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-[13px] flex items-center gap-2 mb-5">
                      <AlertCircle strokeWidth={2} className="w-4 h-4 flex-shrink-0" /> <span className="leading-tight">{error}</span>
                    </div>
                  )}

                  <button onClick={handleSubmit} disabled={submitting}
                    className={`w-full py-2.5 rounded-xl text-[14px] font-medium transition-all flex items-center justify-center gap-2 ${submitting ? 'bg-zinc-800 text-zinc-200 cursor-wait' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4" />}
                    {submitting ? 'Processing...' : isAuthenticated ? 'Confirm Booking' : 'Login Required'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DOCTOR DETAILS MODAL
// ─────────────────────────────────────────────────────────────────────────────
interface DoctorDetailsModalProps {
  open: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  onBook: (deptId: number, docId: number) => void;
}

function DoctorDetailsModal({ open, onClose, doctor, onBook }: DoctorDetailsModalProps) {
  if (!open || !doctor) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-zinc-900/60 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 md:p-12 flex justify-center items-start animate-in fade-in duration-200" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-[32px] w-full max-w-[500px] shadow-2xl overflow-hidden relative mt-8 sm:mt-12 animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-sm hover:bg-zinc-100 flex items-center justify-center text-zinc-500 transition-colors z-10">
          <X strokeWidth={2} className="w-5 h-5" />
        </button>

        <div className="relative h-64 bg-emerald-50">
           {doctor.profileImageUrl ? (
             <img src={doctor.profileImageUrl.startsWith('http') ? doctor.profileImageUrl : `${BASE}${doctor.profileImageUrl}`} className="w-full h-full object-cover object-top" alt={doctor.fullName} />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-emerald-200 bg-emerald-50">{(doctor.fullName||'D')[0]}</div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        </div>

        <div className="px-8 pb-10 -mt-12 relative z-10">
           <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold uppercase tracking-wider mb-4 shadow-lg shadow-emerald-500/20">
             {doctor.isAvailable ? 'Available Now' : 'Not Available'}
           </div>
           
           <h2 className="text-[28px] font-bold text-zinc-900 leading-tight mb-1">{(doctor.fullName || '').toLowerCase().startsWith('dr.') ? doctor.fullName : `Dr. ${doctor.fullName}`}</h2>
           <p className="text-emerald-600 font-semibold text-[15px] mb-6">{doctor.specialization}</p>

           <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                 <span className="text-[11px] font-bold text-zinc-400 block mb-1 uppercase tracking-tight">Qualification</span>
                 <span className="text-[14px] font-bold text-zinc-700">{doctor.qualification || 'MBBS, MD'}</span>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                 <span className="text-[11px] font-bold text-zinc-400 block mb-1 uppercase tracking-tight">Consultation Fee</span>
                 <span className="text-[14px] font-bold text-zinc-700">₹{doctor.consultationFee || '500'}</span>
              </div>
           </div>

           <div className="mb-8">
              <h4 className="text-[14px] font-bold text-zinc-900 mb-2">About Doctor</h4>
              <p className="text-[14px] text-zinc-500 leading-relaxed">
                 {((doctor.fullName || '').toLowerCase().startsWith('dr.') ? doctor.fullName : `Dr. ${doctor.fullName}`)} is an esteemed {doctor.specialization.toLowerCase()} with extensive experience in clinical practice. 
                 Dedicated to providing compassionate care and utilizing the latest medical advancements to ensure the best outcomes for patients.
              </p>
           </div>

           <button onClick={() => { onClose(); onBook(doctor.departmentId || 0, doctor.id); }} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-[15px] font-bold shadow-xl shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 active:scale-95">
              Book Appointment Now
           </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DATA HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useLiveData(token?: string) {
  const [stats, setStats] = useState<Stats>({});
  const [departments, setDepts] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availBeds, setAvailBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // 1. Departments
      try {
        const d = await apiFetch<any>('/api/departments');
        setDepts(Array.isArray(d) ? d : (d.data ?? []));
      } catch {
        setDepts([
          { id: 1, name: 'Cardiology', description: 'Heart & cardiovascular care', floorNumber: 3 },
          { id: 2, name: 'General Medicine', description: 'Primary healthcare & diagnostics', floorNumber: 1 },
          { id: 3, name: 'Orthopaedics', description: 'Bone, joint & spine treatment', floorNumber: 2 },
          { id: 4, name: 'Neurology', description: 'Brain & nervous system disorders', floorNumber: 4 },
          { id: 5, name: 'Ophthalmology', description: 'Eye care & vision treatment', floorNumber: 2 },
          { id: 6, name: 'Paediatric', description: 'Child health & development', floorNumber: 1 },
          { id: 7, name: 'Laboratory', description: 'Diagnostic tests & reports', floorNumber: 0 },
          { id: 8, name: 'Pharmacy', description: 'Medicines & prescriptions', floorNumber: 0 },
        ]);
      }

      // 2. Beds
      try {
        const b = await apiFetch<any>('/api/Beds/available', token);
        setAvailBeds((Array.isArray(b) ? b : (b.data ?? [])).slice(0, 6));
      } catch {
        setAvailBeds([
          { id: 1, bedNumber: 'ICU-01', wardType: 'ICU', status: 'Available', dailyCharge: 3500 },
          { id: 2, bedNumber: 'GW-04', wardType: 'General', status: 'Available', dailyCharge: 800 },
          { id: 3, bedNumber: 'PVT-02', wardType: 'Private', status: 'Occupied', dailyCharge: 2500 },
          { id: 4, bedNumber: 'GW-07', wardType: 'General', status: 'Available', dailyCharge: 800 },
          { id: 5, bedNumber: 'MAT-01', wardType: 'Maternity', status: 'Available', dailyCharge: 1500 },
          { id: 6, bedNumber: 'PAE-03', wardType: 'Paediatric', status: 'UnderCleaning', dailyCharge: 1200 },
        ]);
      }

      // 3. Doctors
      try {
        const doc = await apiFetch<any>('/api/Doctors');
        setDoctors(Array.isArray(doc) ? doc : (doc.data ?? []));
      } catch {
        setDoctors([
          { id: 1, fullName: 'Dr. Sarah Johnson', specialization: 'Cardiologist', consultationFee: 800, isAvailable: true },
          { id: 2, fullName: 'Dr. Michael Chen', specialization: 'General Physician', consultationFee: 500, isAvailable: true },
          { id: 3, fullName: 'Dr. Robert Wilson', specialization: 'Orthopaedic Surgeon', consultationFee: 900, isAvailable: false },
          { id: 4, fullName: 'Dr. Emily Davis', specialization: 'Neurologist', consultationFee: 1000, isAvailable: true },
          { id: 5, fullName: 'Dr. James Miller', specialization: 'Ophthalmologist', consultationFee: 700, isAvailable: true },
          { id: 6, fullName: 'Dr. Lisa Anderson', specialization: 'Paediatrician', consultationFee: 600, isAvailable: true },
        ]);
      }

      // 4. Stats
      if (token) {
        try {
          const s = await apiFetch<any>('/api/admin/stats', token);
          setStats(s.data ?? s);
        } catch {
          setStats({ totalDoctors: 42, totalPatients: 1840, totalAppointments: 286, totalDepartments: 12, availableBeds: 23, totalBeds: 97 });
        }
      } else {
        setStats({ totalDoctors: 42, totalPatients: 1840, totalAppointments: 286, totalDepartments: 12, availableBeds: 23, totalBeds: 97 });
      }

      setLoading(false);
    };
    load();
  }, [token]);

  return { stats, departments, doctors, availBeds, loading };
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN HOME PAGE
// ─────────────────────────────────────────────────────────────────────────────
const Home: React.FC = () => {
  const auth = useAuth() as any;
  const navigate = useNavigate();
  const isAuth = auth.isAuthenticated as boolean;
  const user = auth.user;
  const token = auth.token ?? auth.user?.token;

  const [bookOpen, setBookOpen] = useState(false);
  const [initDept, setInitDept] = useState<number | null>(null);
  const [initDoc, setInitDoc] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<Doctor | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const { stats, departments, doctors, availBeds, loading } = useLiveData(token);

  useEffect(() => {
    // If logged in and NOT a Patient, redirect to Dashboard.
    // Patients are the only ones allowed to use the Home page after login.
    if (isAuth && user && user.role !== 'Patient') {
      navigate('/dashboard');
    }
  }, [isAuth, user, navigate]);

  // GSAP Refs
  const heroRef = useRef<HTMLDivElement>(null);
  const img1Ref = useRef<HTMLImageElement>(null);
  const img2Ref = useRef<HTMLImageElement>(null);
  const img3Ref = useRef<HTMLImageElement>(null);
  const img4Ref = useRef<HTMLImageElement>(null);
  const text1Ref = useRef<HTMLDivElement>(null);
  const text2Ref = useRef<HTMLDivElement>(null);
  const text3Ref = useRef<HTMLDivElement>(null);
  const text4Ref = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      // Standard homepage intro fade-in
      if (text1Ref.current) {
        gsap.from(text1Ref.current, {
          y: 30,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          delay: 0.2
        });
      }

      // Animate interactive stats
      const statNumbers = document.querySelectorAll(".stat-number");
      if (statNumbers.length > 0 && statsRef.current) {
        gsap.from(".stat-number", {
          scrollTrigger: {
            trigger: statsRef.current,
            start: "top 80%",
          },
          textContent: 0,
          duration: 2.5,
          ease: "power2.out",
          snap: { textContent: 1 },
          stagger: 0.2
        });
      }
    });
    
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openBook = (deptId?: number, docId?: number) => {
    setInitDept(deptId ?? null);
    setInitDoc(docId ?? null);
    setBookOpen(true);
  };

  const openDetails = (doc: Doctor) => {
    setSelectedDocForDetail(doc);
    setDetailOpen(true);
  };

  const getRoleRoute = () => {
    if (!user) return '/dashboard';
    const routes: Record<string, string> = {
      Admin: '/dashboard', Doctor: '/dashboard', Patient: '/dashboard',
      Pharmacist: '/dashboard', LabTechnician: '/dashboard', Receptionist: '/dashboard',
    };
    return routes[user.role] ?? '/dashboard';
  };

  const availCount = availBeds.filter(b => b.status === 'Available').length;

  // Quick Access Roles Data
  const roles = [
    { label: "Admin", icon: Shield, col: "text-zinc-700 bg-white" },
    { label: "Doctor", icon: Stethoscope, col: "text-emerald-500 bg-emerald-500/10" },
    { label: "Patient", icon: Heart, col: "text-emerald-500 bg-emerald-500/10" },
    { label: "Pharmacist", icon: Pill, col: "text-purple-600 bg-purple-50" },
    { label: "Lab Technician", icon: FlaskConical, col: "text-rose-600 bg-rose-50" },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] font-sans text-zinc-900 selection:bg-zinc-200">

      {/* HEADER (Fixed on top, transparent and blurring on scroll) */}
      {/* ── HEADER ────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-100 py-4 transition-all">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
          <div onClick={() => navigate('/')} className="flex-1 flex items-center gap-2 cursor-pointer">
             <div className="w-8 h-8 rounded-full bg-emerald-500 grid grid-cols-2 gap-[2px] p-1.5 rotate-45 shadow-sm">
                 <div className="bg-white rounded-[2px]"></div><div className="bg-white rounded-[2px]"></div>
                 <div className="bg-white rounded-[2px]"></div><div className="bg-white rounded-[2px]"></div>
             </div>
             <span className="text-[20px] font-bold tracking-tight text-zinc-900 flex items-center gap-1">GOMEDIC</span>
          </div>

          <nav className="hidden md:flex flex-none items-center justify-center gap-10">
            <a href="#" className="text-[15px] font-bold transition-all text-emerald-600 border-b-2 border-emerald-600 pb-1.5">Home</a>
            <a href="#specialists" className="text-[15px] font-semibold transition-all text-zinc-500 hover:text-emerald-500 hover:-translate-y-0.5">Find Doctors</a>
            <a href="#contact" className="text-[15px] font-semibold transition-all text-zinc-500 hover:text-emerald-500 hover:-translate-y-0.5">Contact Us</a>
          </nav>

          <div className="flex-1 flex items-center justify-end gap-3">
             {isAuth ? (
               <button onClick={() => navigate(getRoleRoute())} className="px-6 py-2.5 bg-zinc-50 border border-zinc-200 hover:border-emerald-500 transition-colors rounded-full text-[14px] font-semibold text-zinc-700">
                  Dashboard
               </button>
             ) : (
               <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-zinc-50 border border-zinc-200 hover:border-emerald-500 hover:text-emerald-600 transition-colors rounded-full text-[14px] font-semibold text-zinc-700">
                  Login
               </button>
             )}
             <button onClick={() => openBook()} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] transition-all hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:-translate-y-0.5 rounded-full text-[14px] font-semibold">
                Book Appointment
             </button>
          </div>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────── */}
      <div className="pt-28 pb-12 max-w-[1400px] mx-auto px-6">
         <div className="relative w-full h-[540px] rounded-[32px] overflow-hidden bg-blue-100 flex shadow-lg">
             {/* The massive background text */}
             <div className="absolute inset-0 flex items-start pt-10 justify-center z-10 pointer-events-none">
                 <span className="text-[140px] md:text-[180px] font-black text-white/50 tracking-tighter leading-none mix-blend-overlay uppercase">
                    GOMEDIC
                 </span>
             </div>
             
             {/* Image */}
             <img src="https://plus.unsplash.com/premium_photo-1681843126728-04eab730febe?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8bWVkaWNhbCUyMHRlYW18ZW58MHx8MHx8fDA%3D" className="w-full h-full object-cover object-top z-0" alt="Hero Team" />
             
             {/* Gradient overlay for bottom elements */}
             <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-transparent z-10"></div>
             
             <div className="absolute bottom-12 left-12 z-20">
                <h1 className="text-4xl md:text-[50px] font-bold text-white leading-[1.1] tracking-tight">Trusted Medical <br/> Experts Team</h1>
             </div>
             
             <div className="absolute bottom-12 right-12 z-20">
                <button onClick={() => openBook()} className="px-7 py-3.5 bg-white hover:bg-zinc-50 text-emerald-600 rounded-full text-[15px] font-bold transition-all shadow-xl">
                   Schedule Meeting
                </button>
             </div>
         </div>
      </div>

      {/* ── TEAM HEADER ───────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-6 mt-10 mb-8 text-center">
          <h2 className="text-4xl font-semibold text-zinc-900 mb-3 tracking-tight">Your Trusted Medical Team</h2>
          <p className="text-[15px] text-zinc-500 max-w-2xl mx-auto">Dedicated specialists delivering personalized, advanced healthcare for every patient.</p>
      </div>

      {/* ── DOCTORS FILTER & SEARCH ───────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-6 mb-10 flex flex-col items-center">
         <div className="w-full flex items-center justify-between mb-2">
            <h3 className="font-semibold text-zinc-900">Doctors Category:</h3>
         </div>
         <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar w-full md:w-auto">
               <button onClick={() => setSelectedCategoryId(null)} className={`px-5 py-2.5 rounded-full text-[14px] font-medium whitespace-nowrap md:shadow-md transition-colors ${selectedCategoryId === null ? 'bg-emerald-500 text-white' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>All Doctors</button>
               {departments.map(d => (
                 <button onClick={() => setSelectedCategoryId(d.id)} key={d.id} className={`px-5 py-2.5 rounded-full text-[14px] font-medium whitespace-nowrap md:shadow-md transition-colors ${selectedCategoryId === d.id ? 'bg-emerald-500 text-white' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>{d.name}</button>
               ))}
            </div>
            
            <div className="relative w-full md:w-80">
               <input 
                  type="text" 
                  placeholder="Search Doctors..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-full text-[14px] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" 
               />
               <svg className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
         </div>
      </div>

      {/* ── DOCTORS LIST ──────────────────────────────────── */}
      <section id="specialists" className="max-w-[1400px] mx-auto px-6 mb-24">
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.filter(doc => {
               const matchesCategory = selectedCategoryId === null || doc.departmentId === selectedCategoryId;
               const matchesSearch = doc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                   doc.specialization.toLowerCase().includes(searchQuery.toLowerCase());
               return matchesCategory && matchesSearch;
            }).map(doc => (
               <div key={doc.id} className="bg-[#F8FCFA] border border-zinc-100 rounded-[28px] overflow-hidden flex flex-col pt-6 hover:shadow-lg transition-shadow duration-300 relative group">
                  
                  {/* Avatar section */}
                  <div className="px-6 relative h-40 flex justify-center items-end">
                      {doc.profileImageUrl ? (
                          <img src={doc.profileImageUrl.startsWith('http') ? doc.profileImageUrl : `${BASE}${doc.profileImageUrl}`} className="h-40 w-40 object-cover object-top rounded-full bg-white border-4 border-white shadow-sm absolute bottom-0" alt={doc.fullName} />
                      ) : (
                          <div className="h-40 w-40 bg-zinc-200 border-4 border-white rounded-full flex items-center justify-center text-4xl font-bold text-zinc-400 shadow-sm absolute bottom-0">{(doc.fullName||'D')[0]}</div>
                      )}
                  </div>
                  
                  <div className="bg-white rounded-t-[28px] mt-4 flex-1 flex flex-col p-6 w-full border-t border-zinc-50">
                     <h4 className="text-[18px] font-bold text-zinc-900 leading-tight mb-1">{(doc.fullName || '').toLowerCase().startsWith('dr.') ? doc.fullName : `Dr. ${doc.fullName}`}</h4>
                     <p className="text-[13px] text-zinc-500 font-medium mb-4">{doc.specialization}</p>
                     
                     <div className="mb-6 flex-1">
                        <span className="text-[11px] font-bold text-zinc-900 block mb-1">Bio:</span>
                        <p className="text-[12px] text-zinc-500 leading-relaxed line-clamp-3">
                           {((doc.fullName || '').toLowerCase().startsWith('dr.') ? doc.fullName : `Dr. ${doc.fullName}`)} is an experienced {doc.specialization.toLowerCase()} dedicated to diagnosing and treating complex conditions with high precision.
                        </p>
                     </div>
                     
                     <div className="flex gap-2 w-full mt-auto">
                        <button onClick={() => openDetails(doc)} className="flex-1 py-2.5 border-2 border-emerald-500 text-emerald-600 rounded-full text-[13px] font-bold hover:bg-emerald-50 transition-colors">
                           View Details
                        </button>
                        <button onClick={() => openBook(doc.departmentId, doc.id)} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-full text-[13px] font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-colors">
                           Book
                        </button>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* ── CONTACT US ───────────────────────────────────── */}
      <section id="contact" className="bg-[#F8FAFC]">
         <div className="max-w-[1400px] mx-auto px-6 py-24 flex flex-col items-center">
            <h2 className="text-[60px] md:text-[100px] font-black text-zinc-900 tracking-tighter leading-none mb-12">Contact US</h2>
            
            <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 text-left">
               <div>
                  <h4 className="font-semibold text-zinc-900 mb-2">Manhattan, New York</h4>
                  <p className="text-[14px] text-zinc-500 mb-8">2023</p>
                  
                  <h4 className="font-semibold text-zinc-900 mb-2">Office Hours</h4>
                  <p className="text-[14px] text-zinc-500 mb-1">Monday - Friday</p>
                  <p className="text-[14px] text-zinc-500">11 AM - 2 PM</p>
               </div>
               
               <form className="space-y-4">
                  <div>
                    <label className="text-[12px] font-semibold text-zinc-900 mb-1 block">Name (required)</label>
                    <div className="flex gap-3">
                       <input type="text" placeholder="First Name" className="flex-1 p-3 bg-white border border-zinc-200 rounded-lg text-[13px]" />
                       <input type="text" placeholder="Last Name" className="flex-1 p-3 bg-white border border-zinc-200 rounded-lg text-[13px]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-zinc-900 mb-1 block">Services</label>
                    <select className="w-full p-3 bg-white border border-zinc-200 rounded-lg text-[13px] text-zinc-500 appearance-none">
                       <option>Select a service</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-zinc-900 mb-1 block">Email (required)</label>
                    <input type="email" className="w-full p-3 bg-white border border-zinc-200 rounded-lg text-[13px] mb-2" />
                    <label className="flex items-center gap-2 text-[12px] text-zinc-500">
                       <input type="checkbox" className="w-3 h-3 accent-emerald-500" /> Sign up for news and updates.
                    </label>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-zinc-900 mb-1 block">Project description</label>
                    <textarea rows={3} className="w-full p-3 bg-white border border-zinc-200 rounded-lg text-[13px] resize-none"></textarea>
                  </div>
                  <button type="button" className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-[14px] font-bold mt-2">
                     Submit
                  </button>
               </form>
            </div>
         </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="bg-[#1A2634] text-zinc-400 py-16 relative overflow-hidden">
         <div className="absolute inset-x-0 bottom-0 top-0 opacity-20 pointer-events-none">
             <img src="https://plus.unsplash.com/premium_photo-1681843126728-04eab730febe?fm=jpg&q=60&w=3000&auto=format&fit=crop" className="w-full h-full object-cover grayscale" alt="" />
         </div>
         <div className="relative z-10 max-w-[1400px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
               <h4 className="text-white font-semibold mb-4">About Us</h4>
               <ul className="space-y-2 text-[13px]">
                  <li>News</li><li>Investor Relations</li><li>Careers</li><li>Media Kit</li>
               </ul>
            </div>
            <div>
               <h4 className="text-white font-semibold mb-4">Resources</h4>
               <ul className="space-y-2 text-[13px]">
                  <li>Get Started</li><li>Learn</li><li>Case Studies</li>
               </ul>
            </div>
            <div>
               <h4 className="text-white font-semibold mb-4">Community</h4>
               <ul className="space-y-2 text-[13px]">
                  <li>Discord</li><li>Events</li><li>FAQ</li><li>Blog</li>
               </ul>
            </div>
            <div>
               <h4 className="text-white font-semibold mb-4">Legal</h4>
               <ul className="space-y-2 text-[13px]">
                  <li>Brand Policy</li><li>Terms of Service</li><li>Privacy</li><li>Cookie Notice</li>
               </ul>
            </div>
         </div>
         <div className="relative z-10 max-w-[1400px] mx-auto px-6 pt-8 border-t border-white/10 flex justify-between items-center text-[12px]">
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-[8px] text-white">G</div>
                <span className="text-white font-semibold">GOMEDIC</span>
            </div>
            <p>&copy; 2026 GOMEDIC Technologies</p>
         </div>
      </footer>

      {/* BOOKING MODAL */}
      <BookModal
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        departments={departments}
        token={token}
        userId={user?.userId ?? user?.id}
        isAuthenticated={isAuth}
        initialDeptId={initDept}
        initialDocId={initDoc}
      />

      {/* DOCTOR DETAILS MODAL */}
      <DoctorDetailsModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        doctor={selectedDocForDetail}
        onBook={openBook}
      />
    </div>
  );
};

export default Home;
