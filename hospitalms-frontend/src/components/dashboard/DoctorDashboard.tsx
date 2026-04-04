import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, BedDouble, Pill, FlaskConical, Clock, CheckCircle, Plus, Stethoscope, ChevronRight } from 'lucide-react';
import { StatCard, Card, Badge, statusBadge, Button, Modal, Input, Select, PageHeader, EmptyState, LoadingSpinner } from '../ui';
import { appointmentApi, admissionApi, prescriptionApi, medicineApi } from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [admitOpen, setAdmitOpen] = useState(false);
  const [prescribeOpen, setPrescribeOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [apptRes, admRes] = await Promise.all([
        appointmentApi.getByDoctor(user!.userId),
        admissionApi.getAll()
      ]);
      setAppointments(apptRes.data);
      setAdmissions(admRes.data);
    } catch {
      // Demo fallback
      setAppointments([{ id: 1, patientId: 101, appointmentDate: new Date().toISOString().split('T')[0], appointmentTime: '09:00', tokenNumber: 1, status: 'Scheduled' }]);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title={`Dr. ${user?.fullName} 👋`} subtitle="Welcome to your medical portal" action={<Button onClick={() => setAdmitOpen(true)}><Plus className="w-4 h-4" /> Admit Patient</Button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Appts" value={appointments.length} icon={<Calendar />} color="blue" />
        <StatCard title="Active Admissions" value={admissions.length} icon={<BedDouble />} color="violet" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Patient Queue">
            {appointments.length === 0 ? <EmptyState title="No appointments" icon={<Calendar />} /> : 
              appointments.map(a => (
                <div key={a.id} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                  <div className="flex-1">
                    <span className="text-sm font-semibold">Patient #{a.patientId}</span>
                    <p className="text-xs text-slate-400">{a.appointmentTime} - Token #{a.tokenNumber}</p>
                  </div>
                  <Badge variant={statusBadge(a.status)}>{a.status}</Badge>
                  <Button size="sm" variant="secondary" onClick={() => { setSelectedPatient(a.patientId); setPrescribeOpen(true); }}><Pill className="w-3 h-3" /> Prescribe</Button>
                </div>
              ))
            }
          </Card>
        </div>
        <Card title="Active Admissions">
          {admissions.length === 0 ? <EmptyState title="Empty ward" icon={<BedDouble />} /> : 
            admissions.map(a => (
              <div key={a.id} className="p-3 bg-violet-50 rounded-xl mb-2">
                <p className="text-sm font-bold">Patient #{a.patientId}</p>
                <p className="text-xs text-slate-500">Bed #{a.bedId}</p>
              </div>
            ))
          }
        </Card>
      </div>
      <Modal isOpen={admitOpen} onClose={() => setAdmitOpen(false)} title="New Admission"><div className="space-y-4"><Input label="Patient ID" type="number" /><Button className="w-full">Process Admission</Button></div></Modal>
      <Modal isOpen={prescribeOpen} onClose={() => setPrescribeOpen(false)} title="New Prescription"><div className="space-y-4"><Input label="Notes" /><Button className="w-full">Save Prescription</Button></div></Modal>
    </div>
  );
};
export default DoctorDashboard;
