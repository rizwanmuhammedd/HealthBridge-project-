import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, BedDouble, Pill, Plus, X, Search, Activity, Camera, User, ClipboardList, CheckCircle2, Clock, Users, ArrowRight } from 'lucide-react';
import { StatCard, Card, Badge, statusBadge, Button, Modal, Input, PageHeader, EmptyState, LoadingSpinner, Select } from '../ui';
import { appointmentApi, admissionApi, medicineApi, prescriptionApi, authApi, doctorApi } from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [admitOpen, setAdmitOpen] = useState(false);
  const [prescribeOpen, setPrescribeOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [selectedApptId, setSelectedApptId] = useState<number | null>(null);

  // Admission State
  const [admitForm, setAdmitForm] = useState({
    patientId: '',
    wardType: 'General',
    admissionReason: ''
  });

  // Prescription State
  const [availableMeds, setAvailableMeds] = useState<any[]>([]);
  const [selectedPatientPhone, setSelectedPatientPhone] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [prescriptionSearchTerm, setPrescriptionSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [prescriptionItems, setPrescriptionItems] = useState<any[]>([]);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useNotifications();

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [apptRes, admRes, medRes, prescRes] = await Promise.all([
        appointmentApi.getByMyDoctor(),
        admissionApi.getAll(),
        medicineApi.getAll(),
        prescriptionApi.getDoctorPrescriptions()
      ]);
      setAppointments(apptRes.data);
      setAdmissions(admRes.data);
      setAvailableMeds(medRes.data);
      setPrescriptions(prescRes.data);
    } catch (err: any) {
      console.error("Load failed", err);
      addToast({
        type: 'error',
        title: 'Data Load Error',
        message: err.response?.data?.message || 'Could not fetch dashboard data. Check API connection.'
      });
    } finally { setLoading(false); }
  }, [user, addToast]);

  useEffect(() => { loadData(); }, [loadData, location.pathname]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
        const res = await authApi.uploadPicture(file, true);
        const newUrl = res.data.imageUrl;
        
        if (user && newUrl) {
            try {
              await doctorApi.updateProfilePicture(newUrl);
            } catch (err) {
              console.warn("PatientService sync failed", err);
            }
            const updatedUser = { ...user, profileImageUrl: newUrl };
            localStorage.setItem('hms_user', JSON.stringify(updatedUser));
            addToast({ type: 'success', title: 'Updated', message: 'Profile picture updated successfully' });
            setTimeout(() => window.location.reload(), 800);
        }
    } catch (err: any) {
        addToast({ type: 'error', title: 'Upload Failed', message: err.response?.data?.message || 'Failed to upload' });
    } finally {
        setUploading(false);
    }
  };

  const handleAddMed = (med: any) => {
    setPrescriptionItems([...prescriptionItems, {
      medicineId: med.id,
      name: med.name,
      dosage: '1-0-1',
      frequency: 'After Food',
      durationDays: 5,
      quantityToDispense: 10,
      instructions: ''
    }]);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const filteredMeds = availableMeds.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSavePrescription = async () => {
    if (!selectedPatient || prescriptionItems.length === 0) {
      return addToast({ type: 'warning', title: 'Action Required', message: 'Add at least one medicine.' });
    }

    setSubmitting(true);
    try {
      await prescriptionApi.create({
        patientId: selectedPatient,
        patientName: selectedPatientName,
        patientPhone: selectedPatientPhone,
        appointmentId: selectedApptId,
        doctorName: user?.fullName || 'Doctor',
        notes: notes,
        items: prescriptionItems
      });

      if (selectedApptId) {
        await appointmentApi.update(selectedApptId, { status: 'Completed' });
      }

      addToast({ type: 'success', title: 'Success', message: 'Prescription finalized.' });
      setPrescribeOpen(false);
      setPrescriptionItems([]);
      setNotes('');
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed', message: err.response?.data?.message || 'Error saving' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitForm.patientId) return;

    setSubmitting(true);
    try {
      await admissionApi.admit({
        patientId: parseInt(admitForm.patientId),
        doctorId: user?.id, // This should be the doctor's internal ID from PatientService
        wardType: admitForm.wardType,
        admissionReason: admitForm.admissionReason
      });
      addToast({ type: 'success', title: 'Admission Requested', message: 'Patient admission process initiated.' });
      setAdmitOpen(false);
      setAdmitForm({ patientId: '', wardType: 'General', admissionReason: '' });
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Admission Failed', message: err.response?.data?.message || 'Error processing admission' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderDashboard = () => {
    const filteredQueue = appointments.filter(a => 
        a.status !== 'Completed' && 
        ((a.patientName || '').toLowerCase().includes(patientSearchTerm.toLowerCase()) || 
         a.patientId.toString().includes(patientSearchTerm))
    );

    return (
        <div className="space-y-8">
            {/* ... header code ... */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title={`Welcome, ${(user?.fullName || '').toLowerCase().startsWith('dr.') ? user?.fullName?.split(' ')[1] || '' : `Dr. ${user?.fullName?.split(' ')[0] || ''}`}`}
                    subtitle="Here's what's happening with your practice today."
                />
                <div className="flex items-center gap-4">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-16 h-16 rounded-[20px] overflow-hidden border-2 border-zinc-100 shadow-sm transition-all group-hover:border-zinc-300">
                            {user?.profileImageUrl ? (
                                <img src={user.profileImageUrl} alt={user.fullName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-zinc-50 flex items-center justify-center text-zinc-400">
                                    <User strokeWidth={1.5} className="w-8 h-8" />
                                </div>
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-[20px]">
                                    <LoadingSpinner size="sm" />
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-500 transition-transform group-hover:scale-110">
                            <Camera strokeWidth={2} className="w-3 h-3" />
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                    </div>
                    <Button onClick={() => setAdmitOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/10"><Plus className="w-4 h-4" /> Admit Patient</Button>
                </div>
            </div>

            {/* ... stats grid ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">Appointments</p>
                            <h3 className="text-2xl font-bold text-zinc-900">{appointments.filter(a => a.status !== 'Completed').length}</h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
                            <BedDouble className="w-6 h-6 text-violet-500" />
                        </div>
                        <div>
                            <p className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">Admissions</p>
                            <h3 className="text-2xl font-bold text-zinc-900">{admissions.length}</h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">Completed</p>
                            <h3 className="text-2xl font-bold text-zinc-900">{appointments.filter(a => a.status === 'Completed').length}</h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">Waiting</p>
                            <h3 className="text-2xl font-bold text-zinc-900">{appointments.filter(a => a.status === 'Scheduled').length}</h3>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="p-0 border-none shadow-sm bg-white overflow-hidden">
                        <div className="p-5 border-b border-zinc-50 flex justify-between items-center">
                            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-500" /> Up Next in Queue
                            </h3>
                            <div className="relative w-48">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search patient..." 
                                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    value={patientSearchTerm}
                                    onChange={(e) => setPatientSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="p-2">
                            {filteredQueue.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
                                    <Calendar className="w-12 h-12 mb-3 opacity-20" />
                                    <p>{patientSearchTerm ? "No matching patients" : "No pending patients today"}</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredQueue.slice(0, 5).map(a => (
                                        <div key={a.id} className="p-4 hover:bg-zinc-50 transition-colors rounded-lg flex justify-between items-center group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    {a.tokenNumber}
                                                </div>
                                                <div>
                                                    <p className="text-[14px] font-bold text-zinc-900">{a.patientName}</p>
                                                    <p className="text-[11px] text-zinc-500 font-medium">{a.patientAge}y &bull; ID #{a.patientId} &bull; {a.appointmentTime}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={statusBadge(a.status)}>{a.status}</Badge>
                                                <Button size="sm" variant="secondary" onClick={() => { setSelectedPatient(a.patientId); setSelectedPatientName(a.patientName); setSelectedPatientPhone(a.patientPhone || ''); setSelectedApptId(a.id); setPrescribeOpen(true); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Prescribe
                                                </Button>
                                                <Button size="sm" variant="secondary" onClick={() => { setAdmitForm({ ...admitForm, patientId: a.patientId.toString() }); setAdmitOpen(true); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Admit
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
                {/* ... Admissions card ... */}
                <div className="space-y-8">
                    <Card className="p-0 border-none shadow-sm bg-white overflow-hidden">
                        <div className="p-5 border-b border-zinc-50 flex justify-between items-center">
                            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                                <BedDouble className="w-4 h-4 text-violet-500" /> Admitted Patients
                            </h3>
                            <Button variant="secondary" size="sm" onClick={() => window.location.pathname = '/admissions'}>All Admissions</Button>
                        </div>
                        <div className="p-4 space-y-3">
                            {admissions.length === 0 ? (
                                <div className="py-12 text-center text-zinc-400 text-sm italic">No active admissions</div>
                            ) : (
                                admissions.slice(0, 5).map(a => (
                                    <div key={a.id} className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:border-zinc-200 transition-colors flex justify-between items-center">
                                        <div>
                                            <p className="text-[13px] font-bold text-zinc-900">Patient #{a.patientId}</p>
                                            <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1.5"><BedDouble className="w-3 h-3 text-zinc-400" /> Bed {a.bedId}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-zinc-300" />
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
  };

  const renderAppointments = () => {
    const filtered = appointments.filter(a => 
        (a.patientName || '').toLowerCase().includes(patientSearchTerm.toLowerCase()) || 
        a.patientId.toString().includes(patientSearchTerm)
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <PageHeader title="Patient Appointments" subtitle="Manage your clinical queue and historical patient visits" />
                <div className="w-full md:w-80 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder="Search patient name or ID..." 
                        className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={patientSearchTerm}
                        onChange={(e) => setPatientSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <Card className="p-0 border-none shadow-sm bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50/50">
                            <tr>
                                <th className="p-4 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Patient Name</th>
                                <th className="p-4 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Token</th>
                                <th className="p-4 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Schedule</th>
                                <th className="p-4 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {filtered.map(a => (
                                <tr key={a.id} className="hover:bg-zinc-50/80 transition-colors group">
                                    <td className="p-4">
                                        <p className="text-[14px] font-bold text-zinc-900">{a.patientName}</p>
                                        <p className="text-[11px] text-zinc-500">{a.patientAge} Years &bull; ID #{a.patientId}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center font-bold text-zinc-600 text-[12px]">
                                            {a.tokenNumber}
                                        </span>
                                    </td>
                                    <td className="p-4 text-[13px] text-zinc-600 font-medium">{a.appointmentTime}</td>
                                    <td className="p-4"><Badge variant={statusBadge(a.status)}>{a.status}</Badge></td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {a.status !== 'Completed' && (
                                                <Button size="sm" variant="secondary" onClick={() => { setSelectedPatient(a.patientId); setSelectedApptId(a.id); setPrescribeOpen(true); }}>
                                                    Prescribe
                                                </Button>
                                            )}
                                            <Button size="sm" variant="secondary" onClick={() => { setAdmitForm({ ...admitForm, patientId: a.patientId.toString() }); setAdmitOpen(true); }}>
                                                Admit
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div className="py-20 text-center text-zinc-400">
                            <Search className="w-12 h-12 mb-3 mx-auto opacity-20" />
                            <p>No matching appointments found</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
  };

  const renderPrescriptions = () => {
    const filtered = prescriptions.filter(p => 
        p.id.toString().includes(prescriptionSearchTerm) || 
        p.patientId.toString().includes(prescriptionSearchTerm)
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <PageHeader title="Clinical Prescriptions" subtitle="View and manage medication history for your patients" />
                <div className="w-full md:w-80 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder="Search by ID or Patient ID..." 
                        className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={prescriptionSearchTerm}
                        onChange={(e) => setPrescriptionSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.length === 0 ? (
                    <div className="col-span-full py-20 bg-white rounded-3xl border border-zinc-100 flex flex-col items-center justify-center text-zinc-400">
                        <Search className="w-12 h-12 mb-3 opacity-20" />
                        <p>{prescriptionSearchTerm ? "No matching prescriptions" : "No prescriptions issued yet"}</p>
                    </div>
                ) : (
                    filtered.map(p => (
                        <Card key={p.id} className="p-0 border-none shadow-sm bg-white overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-zinc-50 flex justify-between items-center bg-zinc-50/30">
                                <h3 className="text-[15px] font-bold text-zinc-900">#PRES-{p.id}</h3>
                                <Badge variant={p.status === 'Dispensed' ? 'success' : 'warning'}>{p.status}</Badge>
                            </div>
                            <div className="p-5 flex-1 space-y-4">
                                <div className="flex justify-between items-center text-[13px]">
                                    <span className="text-zinc-500 font-medium">Patient ID</span>
                                    <span className="font-bold text-zinc-900">#{p.patientId}</span>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Medications</p>
                                    {p.items?.map((it: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center text-[12px]">
                                            <span className="text-zinc-600">{it.medicineName}</span>
                                            <span className="font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">x{it.quantityToDispense}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
  };

  const renderAdmissions = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageHeader title="Patient Admissions" subtitle="Track active inpatient care and bed assignments" />
        <Button onClick={() => setAdmitOpen(true)}><Plus className="w-4 h-4" /> New Admission</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {admissions.map(a => (
          <Card key={a.id} className="p-5 border-none shadow-sm bg-white hover:border-emerald-500/20 transition-all border-l-4 border-l-emerald-500">
            <div className="flex justify-between items-start mb-4">
               <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                 <User className="w-5 h-5" />
               </div>
               <Badge variant="success">Active</Badge>
            </div>
            <h3 className="font-bold text-zinc-900">Patient #{a.patientId}</h3>
            <p className="text-[12px] text-zinc-500 mt-1">Bed Assignment: {a.bedId}</p>
            <div className="mt-4 pt-4 border-t border-zinc-50 flex gap-2">
               <Button size="sm" variant="secondary" className="flex-1">Vitals</Button>
               <Button size="sm" variant="secondary" className="flex-1">History</Button>
            </div>
          </Card>
        ))}
        {admissions.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-3xl border border-zinc-100 flex flex-col items-center justify-center text-zinc-400">
            <BedDouble className="w-12 h-12 mb-3 opacity-20" />
            <p>No active admissions under your care</p>
          </div>
        )}
      </div>
    </div>
  );

  const getContent = () => {
    if (location.pathname === '/appointments') return renderAppointments();
    if (location.pathname === '/prescriptions') return renderPrescriptions();
    if (location.pathname === '/admissions') return renderAdmissions();
    return renderDashboard();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="pb-20 max-w-7xl mx-auto">
      {getContent()}

      <Modal isOpen={admitOpen} onClose={() => setAdmitOpen(false)} title="New Admission Request">
        <form onSubmit={handleAdmit} className="space-y-5">
          <p className="text-[13px] text-zinc-500 leading-relaxed mb-2">Initiate an admission request for clinical care. Floor management will assign the specific bed.</p>
          <Input 
            label="Patient Registration ID" 
            type="number" 
            required
            value={admitForm.patientId}
            onChange={(e: any) => setAdmitForm({ ...admitForm, patientId: e.target.value })}
            placeholder="e.g. 1004" 
          />
          <Select 
            label="Ward Type"
            value={admitForm.wardType}
            onChange={(e: any) => setAdmitForm({ ...admitForm, wardType: e.target.value })}
            options={[
                { value: 'General', label: 'General Ward' },
                { value: 'ICU', label: 'Intensive Care Unit (ICU)' },
                { value: 'Private', label: 'Private Premium Suite' }
            ]}
          />
          <Input 
            label="Admission Reason" 
            placeholder="e.g. Post-operative care" 
            value={admitForm.admissionReason}
            onChange={(e: any) => setAdmitForm({ ...admitForm, admissionReason: e.target.value })}
          />
          <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-700" loading={submitting}>Process Request</Button>
        </form>
      </Modal>

      <Modal isOpen={prescribeOpen} onClose={() => setPrescribeOpen(false)} title="Clinical Prescription Form" size="xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="sticky top-0 bg-[#FDFDFD] z-10 pb-4 border-b border-zinc-100 mb-4">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Medication Search</p>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search strokeWidth={2} className="w-4 h-4 text-zinc-400" />
                </div>
                <input
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-zinc-200 text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100 focus:border-zinc-400 transition-all"
                  placeholder="Search active pharmacy inventory..."
                  value={searchTerm}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    setSearchTerm(val);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
                {showSuggestions && searchTerm && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] max-h-56 overflow-y-auto custom-scrollbar">
                    {filteredMeds.length > 0 ? (
                      filteredMeds.map(m => (
                        <div
                          key={m.id}
                          className="px-4 py-3 hover:bg-zinc-50 cursor-pointer text-[13px] font-medium border-b border-zinc-100 last:border-0 transition-colors flex justify-between items-center"
                          onClick={() => handleAddMed(m)}
                        >
                          <span className="text-zinc-900">{m.name}</span>
                          <Badge variant={m.stockQuantity > 20 ? 'success' : 'warning'}>{m.stockQuantity} stock</Badge>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-4 text-[13px] text-zinc-500 text-center italic">No inventory match</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 pb-4">
              {prescriptionItems.length === 0 && (
                <div className="bg-zinc-50/50 border border-dashed border-zinc-200 rounded-[16px] py-10 flex flex-col items-center justify-center text-zinc-400">
                  <Pill strokeWidth={1.5} className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-[12px] font-medium">Search to add medications</p>
                </div>
              )}

              {prescriptionItems.map((it, i) => (
                <div key={i} className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative group">
                  <button onClick={() => setPrescriptionItems(prescriptionItems.filter((_, idx) => idx !== i))} className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 hover:bg-red-50 w-6 h-6 rounded-md flex items-center justify-center transition-colors">
                    <X strokeWidth={2} className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-[14px] font-bold tracking-tight text-zinc-900 pr-8 line-clamp-1">{it.name}</span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1.5 block">Dosage</label>
                      <input className="w-full px-3 py-2 text-[12px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-zinc-100 focus:border-zinc-400 transition-all text-zinc-900 font-medium" placeholder="e.g. 1-0-1" value={it.dosage} onChange={(e) => {
                        const newItems = [...prescriptionItems];
                        newItems[i].dosage = e.target.value;
                        setPrescriptionItems(newItems);
                      }} />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1.5 block">Quantity Total</label>
                      <input className="w-full px-3 py-2 text-[12px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-zinc-100 focus:border-zinc-400 transition-all text-zinc-900 font-medium" placeholder="Qty" type="number" min="1" value={it.quantityToDispense} onChange={(e) => {
                        const newItems = [...prescriptionItems];
                        newItems[i].quantityToDispense = parseInt(e.target.value) || 0;
                        setPrescriptionItems(newItems);
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-4 border-t md:border-t-0 md:border-l border-zinc-100 pt-6 md:pt-0 md:pl-6">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Clinical Notes & Diagnosis</p>
            <textarea
              className="w-full h-[200px] md:h-[300px] p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] outline-none focus:ring-4 focus:ring-zinc-100 focus:border-zinc-400 resize-none transition-all text-zinc-900 placeholder-zinc-400"
              placeholder="Document symptoms, diagnosis, and care instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-8 pt-5 border-t border-zinc-100 flex justify-end">
          <Button className="w-full sm:w-auto min-w-[200px] bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/10" loading={submitting} onClick={handleSavePrescription}>Confirm & Finalize</Button>
        </div>
      </Modal>
    </div>
  );
};

export default DoctorDashboard;
