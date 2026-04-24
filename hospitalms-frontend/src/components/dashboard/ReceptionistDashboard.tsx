import React, { useState, useEffect } from 'react';
import { PageHeader, Card, EmptyState, Badge, LoadingSpinner, Button, statusBadge, Modal, Input, Select } from '../ui';
import { Calendar, Receipt, Search } from 'lucide-react';
import api, { appointmentApi, prescriptionApi, doctorApi } from '../../api/axiosInstance';
import { useNotifications } from '../../context/NotificationContext';
import { EnquiryChat } from '../chat/EnquiryChat';

export const ReceptionistDashboard = () => {
    const { addToast } = useNotifications();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [bills, setBills] = useState<any[]>([]);
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [genModalOpen, setGenModalOpen] = useState(false);
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [selectedAppt, setSelectedAppt] = useState<any | null>(null);
    const [selectedBill, setSelectedBill] = useState<any | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [apptSearchTerm, setApptSearchTerm] = useState('');
    const [billSearchTerm, setBillSearchTerm] = useState('');
    const [beds, setBeds] = useState<any[]>([]);
    const [activeAdmissions, setActiveAdmissions] = useState<any[]>([]);
    const [selectedBed, setSelectedBed] = useState<any | null>(null);
    const [bedStatusModalOpen, setBedStatusModalOpen] = useState(false);

    const [billForm, setBillForm] = useState({
        consultationCharge: 0, medicineCharge: 0, labCharge: 0, bedCharge: 0, otherCharges: 0, discount: 0
    });
    const [payForm, setPayForm] = useState({ amount: 0, method: 'Cash' });

    const loadData = async () => {
        try {
            const [apptRes, billRes, prescRes, docRes, bedRes, admRes] = await Promise.all([
                appointmentApi.getAll(),
                api.get('/api/bills/pending'),
                prescriptionApi.getPending(),
                doctorApi.getAll(),
                bedApi.getAll(),
                api.get('/api/admissions')
            ]);
            setAppointments(apptRes.data);
            setBills(billRes.data || []);
            setPrescriptions(prescRes.data || []);
            setDoctors(docRes.data || []);
            setBeds(bedRes.data || []);
            setActiveAdmissions(admRes.data || []);
        } catch { }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleUpdateBedStatus = async (status: string) => {
        if (!selectedBed) return;
        try {
            await bedApi.updateStatus(selectedBed.id, status);
            addToast({ type: 'success', title: 'Bed Updated', message: `Bed #${selectedBed.bedNumber} is now ${status}` });
            setBedStatusModalOpen(false);
            loadData();
        } catch (err) {
            addToast({ type: 'error', title: 'Update Failed', message: 'Could not update bed status' });
        }
    };

    const renderWardManagement = () => {
        const wards = [...new Set(beds.map(b => b.wardType))];
        
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                        <BedDouble className="w-5 h-5 text-violet-500" /> Ward & Facility Monitoring
                    </h2>
                    <div className="flex gap-2">
                        <Badge variant="success">{beds.filter(b => b.status === 'Available').length} Free</Badge>
                        <Badge variant="danger">{beds.filter(b => b.status === 'Occupied').length} Occupied</Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wards.map(ward => (
                        <Card key={ward} title={`${ward} Ward`}>
                            <div className="grid grid-cols-4 gap-2">
                                {beds.filter(b => b.wardType === ward).map(b => (
                                    <button 
                                        key={b.id} 
                                        onClick={() => { setSelectedBed(b); setBedStatusModalOpen(true); }}
                                        className={`h-12 rounded-lg border flex flex-col items-center justify-center transition-all ${
                                            b.status === 'Available' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                                            b.status === 'Occupied' ? 'bg-red-50 border-red-100 text-red-700 hover:bg-red-100' :
                                            'bg-orange-50 border-orange-100 text-orange-700 hover:bg-orange-100'
                                        }`}
                                        title={`${b.bedNumber} - ${b.status}`}
                                    >
                                        <span className="text-[10px] font-bold">{b.bedNumber.split('-')[1] || b.bedNumber}</span>
                                        <BedDouble className="w-3 h-3 opacity-50" />
                                    </button>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    };

    const handleOpenGenBill = (appt: any) => {
        const doc = doctors.find(d => d.id === appt.doctorId);
        const presc = prescriptions.find(p => p.appointmentId === appt.id);

        setSelectedAppt(appt);
        setBillForm({
            consultationCharge: doc?.consultationFee || 500,
            medicineCharge: presc?.totalCost || 0,
            labCharge: 0, bedCharge: 0, otherCharges: 0, discount: 0
        });
        setGenModalOpen(true);
    };

    const handleGenerateBill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAppt) return;
        setSubmitting(true);
        try {
            await api.post('/api/bills', {
                patientId: selectedAppt.patientId,
                ...billForm,
                consultationCharge: parseFloat(billForm.consultationCharge.toString()),
                medicineCharge: parseFloat(billForm.medicineCharge.toString())
            });
            addToast({ type: 'success', title: 'Bill Generated', message: 'Ready for payment collection' });
            setGenModalOpen(false);
            loadData();
        } catch (err: any) {
            addToast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Generation failed' });
        } finally { setSubmitting(false); }
    };

    const handleCollectPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBill) return;
        setSubmitting(true);
        try {
            await api.post(`/api/bills/${selectedBill.id}/payment`, {
                amount: parseFloat(payForm.amount.toString()),
                paymentMethod: payForm.method
            });
            addToast({ type: 'success', title: 'Paid', message: 'Payment recorded successfully' });
            setPayModalOpen(false);
            loadData();
        } catch (err: any) {
            addToast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Payment failed' });
        } finally { setSubmitting(false); }
    };

    const renderAppointments = () => {
        const filtered = appointments.filter(a => 
            (a.patientName || '').toLowerCase().includes(apptSearchTerm.toLowerCase()) ||
            (a.doctorName || '').toLowerCase().includes(apptSearchTerm.toLowerCase()) ||
            a.patientId?.toString().includes(apptSearchTerm)
        );

        return (
            <Card title="Today's Active Appointments">
                <div className="mb-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder="Search patient or doctor..." 
                        className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        value={apptSearchTerm}
                        onChange={(e) => setApptSearchTerm(e.target.value)}
                    />
                </div>
                {filtered.length === 0 ? <EmptyState icon={<Calendar strokeWidth={1.5} className="w-8 h-8" />} title={apptSearchTerm ? "No matches found" : "No visits scheduled"} /> :
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                        {filtered.map(a => (
                            <div key={a.id} className="p-4 bg-[#FDFDFD] border border-zinc-200 rounded-[16px] flex justify-between items-center transition-shadow hover:shadow-sm">
                                <div className="flex-1">
                                    <p className="text-[14px] font-bold tracking-tight text-zinc-900">{a.patientName}</p>
                                    <p className="text-[12px] text-zinc-500 font-medium">{(a.doctorName || '').toLowerCase().startsWith('dr.') ? a.doctorName : `Dr. ${a.doctorName}`} &bull; {a.appointmentTime}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant={statusBadge(a.status)}>{a.status}</Badge>
                                    {a.status === 'Completed' && (
                                        <Button size="sm" variant="secondary" onClick={() => handleOpenGenBill(a)}>Create Bill</Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                }
            </Card>
        );
    };

    const renderBills = () => {
        const pending = bills.filter(b => 
            (b.paymentStatus === 'Pending' || b.paymentStatus === 'PartiallyPaid') &&
            (b.id.toString().includes(billSearchTerm) ||
             b.patientId?.toString().includes(billSearchTerm) ||
             (b.patientName || '').toLowerCase().includes(billSearchTerm.toLowerCase()))
        );

        const completed = bills.filter(b => 
            b.paymentStatus === 'Paid' &&
            (b.id.toString().includes(billSearchTerm) ||
             b.patientId?.toString().includes(billSearchTerm) ||
             (b.patientName || '').toLowerCase().includes(billSearchTerm.toLowerCase()))
        );

        return (
            <div className="space-y-6">
                <Card title="Outstanding Ledger Accounts">
                    <div className="mb-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input 
                            type="text" 
                            placeholder="Search by ID or Patient..." 
                            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            value={billSearchTerm}
                            onChange={(e) => setBillSearchTerm(e.target.value)}
                        />
                    </div>
                    {pending.length === 0 ? <EmptyState icon={<Receipt strokeWidth={1.5} className="w-8 h-8" />} title={billSearchTerm ? "No matching bills" : "No pending payments"} /> :
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {pending.map(b => (
                                <div key={b.id} className="p-4 flex justify-between items-center bg-white border border-red-100 rounded-[16px] transition-shadow hover:shadow-sm">
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-semibold text-zinc-900">Ledger #{b.id} {b.prescriptionId ? '(Consultation)' : ''}</span>
                                        <span className="text-[11px] text-red-600 font-bold uppercase tracking-wider mt-0.5">Due: ₹{b.balanceAmount}</span>
                                    </div>
                                    <Button size="sm" onClick={() => { setSelectedBill(b); setPayForm({ amount: b.balanceAmount, method: 'Cash' }); setPayModalOpen(true); }}>Collect ₹{b.balanceAmount}</Button>
                                </div>
                            ))}
                        </div>
                    }
                </Card>

                <Card title="Recently Received Payments">
                    {completed.length === 0 ? <p className="text-[12px] text-zinc-400 italic text-center py-4">No recent payments received</p> :
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {completed.slice(0, 10).map(b => (
                                <div key={b.id} className="p-4 flex justify-between items-center bg-emerald-50/30 border border-emerald-100 rounded-[16px]">
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-semibold text-emerald-900">Ledger #{b.id}</span>
                                        <span className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">Paid: ₹{b.totalAmount} via {b.paymentMethod}</span>
                                    </div>
                                    <Badge variant="success">Cleared</Badge>
                                </div>
                            ))}
                        </div>
                    }
                </Card>
            </div>
        );
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-10 max-w-7xl mx-auto">
            <PageHeader title="Reception Services" subtitle="Orchestrate hospital check-ins, structured billing, and bed allocations" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {renderAppointments()}
                {renderBills()}
            </div>

            {renderWardManagement()}

            <Modal isOpen={bedStatusModalOpen} onClose={() => setBedStatusModalOpen(false)} title="Update Bed Status" size="sm">
                {selectedBed && (
                    <div className="space-y-6">
                        <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-center">
                            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Current State</p>
                            <h3 className="text-lg font-bold text-zinc-900">Bed #{selectedBed.bedNumber} ({selectedBed.status})</h3>
                            <p className="text-[12px] text-zinc-500">{selectedBed.wardType} Ward</p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                            <Button variant="secondary" className="justify-start gap-3 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200" onClick={() => handleUpdateBedStatus('Available')}>
                                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Mark as Available
                            </Button>
                            <Button variant="secondary" className="justify-start gap-3 hover:bg-red-50 hover:text-red-700 hover:border-red-200" onClick={() => handleUpdateBedStatus('Occupied')}>
                                <div className="w-2 h-2 rounded-full bg-red-500" /> Mark as Occupied
                            </Button>
                            <Button variant="secondary" className="justify-start gap-3 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200" onClick={() => handleUpdateBedStatus('UnderCleaning')}>
                                <div className="w-2 h-2 rounded-full bg-orange-500" /> Send to Cleaning
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={genModalOpen} onClose={() => setGenModalOpen(false)} title="Generate Invoice Ledger" size="md">
                <form onSubmit={handleGenerateBill} className="space-y-5">
                    <div className="p-4 bg-zinc-50 rounded-[16px] border border-zinc-200 mb-2">
                        <p className="text-[11px] font-semibold text-zinc-500 tracking-widest uppercase mb-1">Patient Subject</p>
                        <p className="text-[14px] font-bold text-zinc-900">{selectedAppt?.patientName}</p>
                        <p className="text-[11px] font-medium text-zinc-500 mt-0.5">Consultant: {selectedAppt?.doctorName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Consultation Rate (₹)" type="number" value={billForm.consultationCharge} onChange={(e: any) => setBillForm({ ...billForm, consultationCharge: e.target.value })} required />
                        <Input label="Pharmacy Overhead (₹)" type="number" value={billForm.medicineCharge} onChange={(e: any) => setBillForm({ ...billForm, medicineCharge: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Laboratory Cost (₹)" type="number" value={billForm.labCharge} onChange={(e: any) => setBillForm({ ...billForm, labCharge: e.target.value })} />
                        <Input label="Ancillary Deductibles (₹)" type="number" value={billForm.otherCharges} onChange={(e: any) => setBillForm({ ...billForm, otherCharges: e.target.value })} />
                    </div>
                    <Input label="Discount Subtracted (₹)" type="number" value={billForm.discount} onChange={(e: any) => setBillForm({ ...billForm, discount: e.target.value })} />

                    <div className="p-4 bg-emerald-500 rounded-[16px] text-white flex justify-between items-center mt-2">
                        <span className="text-[12px] font-medium opacity-80 uppercase tracking-widest">Calculated Total</span>
                        <span className="text-2xl font-bold tracking-tight">₹{(parseFloat(billForm.consultationCharge.toString()) + parseFloat(billForm.medicineCharge.toString()) + parseFloat(billForm.labCharge.toString()) + parseFloat(billForm.otherCharges.toString())) - parseFloat(billForm.discount.toString())}</span>
                    </div>

                    <div className="pt-3 flex gap-3">
                        <Button type="button" variant="secondary" className="flex-1" onClick={() => setGenModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="flex-1" loading={submitting}>Issue Bill</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={payModalOpen} onClose={() => setPayModalOpen(false)} title="Settle Ledger Payments" size="sm">
                <form onSubmit={handleCollectPayment} className="space-y-6">
                    <div className="text-center p-6 bg-zinc-50 border border-zinc-100 rounded-[16px]">
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Amount Owed</p>
                        <p className="text-[32px] font-black tracking-tight text-zinc-900">₹{payForm.amount}</p>
                    </div>
                    <Select
                        label="Transfer Method"
                        value={payForm.method}
                        onChange={(e: any) => setPayForm({ ...payForm, method: e.target.value })}
                        options={[
                            { value: 'Cash', label: 'Standard Cash' },
                            { value: 'Card', label: 'Debit/Credit Card' },
                            { value: 'UPI', label: 'UPI / Fast Scan' },
                            { value: 'Insurance', label: 'Insurance Claim Routing' }
                        ]}
                    />
                    <Button type="submit" className="w-full h-12" loading={submitting}>Resolve Payment Balance</Button>
                </form>
            </Modal>

            {/* ENQUIRY CHAT SECTION */}
            <div className="pt-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Patient Enquiry Desk</h2>
                        <p className="text-[13px] text-zinc-500 font-medium">Real-time communication with patients</p>
                    </div>
                </div>
                <EnquiryChat />
            </div>
        </div>
    );
};
