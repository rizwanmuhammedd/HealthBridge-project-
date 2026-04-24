import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { PageHeader, Card, EmptyState, Badge, LoadingSpinner, Button, statusBadge, Modal, Input, Select } from '../ui';
import {
    Calendar, Pill, FlaskConical, Receipt, User, Stethoscope,
    LayoutGrid, HeartPulse, Brain, Bone, Baby, Activity, X, ChevronRight, FileText, Plus, Clock, ArrowLeft, ArrowRight, Loader2
} from 'lucide-react';
import api, { appointmentApi, prescriptionApi, billApi, labApi, medicineApi, doctorApi } from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const DEPT_ICONS: Record<string, React.ReactNode> = {
    'General Medicine': <HeartPulse strokeWidth={1.5} className="w-5 h-5" />,
    'Cardiology': <HeartPulse strokeWidth={1.5} className="w-5 h-5 text-zinc-700" />,
    'Neurology': <Brain strokeWidth={1.5} className="w-5 h-5 text-zinc-700" />,
    'Orthopaedics': <Bone strokeWidth={1.5} className="w-5 h-5 text-zinc-700" />,
    'Paediatrics': <Baby strokeWidth={1.5} className="w-5 h-5 text-zinc-700" />,
};

export const PatientDashboard = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [bills, setBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDept, setSelectedDept] = useState<number | null>(null);
    const [selectedPrescription, setSelectedPrescription] = useState<any | null>(null);
    const recordsRef = React.useRef<HTMLDivElement>(null);
    const { addToast } = useNotifications();

    // Booking States
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [bookingStep, setBookingStep] = useState(1);
    const [bookingDeptId, setBookingDeptId] = useState<number | null>(null);
    const [bookingDoc, setBookingDoc] = useState<any | null>(null);
    const [bookingDate, setBookingDate] = useState('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [chiefComplaint, setChiefComplaint] = useState('');
    const [patientAge, setPatientAge] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    
    // Auto-calculate age if DOB is available
    useEffect(() => {
        if (bookingModalOpen && user?.dateOfBirth) {
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
    }, [user, bookingModalOpen]);

    const [slotsLoading, setSlotsLoading] = useState(false);
    const [deptDoctors, setDeptDoctors] = useState<any[]>([]);
    const [deptDocsLoading, setDeptDocsLoading] = useState(false);

    useEffect(() => {
        if (location.pathname === '/appointments' && recordsRef.current) {
            recordsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [location.pathname, loading]);

    const prescIdParam = searchParams.get('prescriptionId');
    const bookParam = searchParams.get('book');

    useEffect(() => {
        if (bookParam === 'true') {
            setBookingStep(1);
            setBookingModalOpen(true);
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('book');
            setSearchParams(newParams, { replace: true });
        }
    }, [bookParam, searchParams, setSearchParams]);

    useEffect(() => {
        if (bookingDeptId) {
            fetchDeptDoctors();
        }
    }, [bookingDeptId]);

    const fetchDeptDoctors = async () => {
        setDeptDocsLoading(true);
        try {
            const res = await api.get(`/api/doctors/department/${bookingDeptId}`);
            setDeptDoctors(res.data);
        } catch (err) {
            setDeptDoctors([]);
        } finally {
            setDeptDocsLoading(false);
        }
    };

    useEffect(() => {
        if (bookingDoc && bookingDate) {
            fetchSlots();
        }
    }, [bookingDoc, bookingDate]);

    const fetchSlots = async () => {
        setSlotsLoading(true);
        try {
            const slotsRes = await doctorApi.getAvailableSlots(bookingDoc.id, bookingDate);
            setAvailableSlots(slotsRes.data.availableSlots || []);
        } catch (err) {
            setAvailableSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    };

    const handleBookAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        setBookingLoading(true);
        try {
            await appointmentApi.book({
                doctorId: bookingDoc.id,
                patientName: user?.fullName || 'Patient',
                patientPhone: user?.phone || '',
                patientAge: parseInt(patientAge),
                appointmentDate: bookingDate,
                appointmentTime: selectedSlot.includes(':') && selectedSlot.split(':').length === 2 ? selectedSlot + ':00' : selectedSlot,
                chiefComplaint
            });
            addToast({ type: 'success', title: 'Success', message: 'Appointment booked successfully!' });
            setBookingModalOpen(false);
            resetBooking();
            const apptRes = await appointmentApi.getMy();
            setAppointments(apptRes.data);
        } catch (err: any) {
            addToast({ type: 'error', title: 'Booking Failed', message: err.response?.data?.message || 'Error booking appointment' });
        } finally {
            setBookingLoading(false);
        }
    };

    const resetBooking = () => {
        setBookingStep(1);
        setBookingDeptId(null);
        setBookingDoc(null);
        setBookingDate('');
        setSelectedSlot('');
        setChiefComplaint('');
    };

    const handlePayForPrescription = async (p: any, isMedicine: boolean = false) => {
        try {
            addToast({ type: 'info', title: 'Preparing Payment', message: `Initializing ${isMedicine ? 'Medicine' : 'Consultation'} fee...` });
            
            // 1. Create order in backend
            const orderRes = await api.post(`/api/prescriptions/${p.id}/create-razorpay-order?isMedicine=${isMedicine}`);
            const { orderId, amount, currency, keyId } = orderRes.data;

            // 2. Configure Razorpay options
            const options = {
                key: keyId,
                amount: amount * 100,
                currency: currency,
                name: "GOMEDIC Hospital",
                description: `${isMedicine ? 'Medicine' : 'Consultation'} Fee - #${p.id}`,
                order_id: orderId,
                handler: async function (response: any) {
                    // 3. Verify payment in backend
                    try {
                        addToast({ type: 'info', title: 'Verifying Payment', message: 'Please wait while we confirm your payment...' });
                        
                        await api.post('/api/prescriptions/verify-razorpay-payment', {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            prescriptionId: p.id,
                            isMedicine: isMedicine
                        });

                        addToast({ type: 'success', title: 'Payment Successful', message: isMedicine ? 'Medicine payment confirmed.' : 'Prescription is now unlocked.' });
                        
                        // Refresh data
                        const prescRes = await prescriptionApi.getByPatient(user?.id || 0);
                        const updatedList = prescRes.data;
                        setPrescriptions(updatedList);
                        
                        // Update current selected prescription if open to show "Payment Completed"
                        const updatedP = updatedList.find((x: any) => x.id === p.id);
                        if (updatedP) {
                            setSelectedPrescription(updatedP);
                        }
                    } catch (err: any) {
                        addToast({ type: 'error', title: 'Verification Failed', message: 'We couldn\'t verify your payment. Please contact support.' });
                    }
                },
                prefill: {
                    name: user?.fullName,
                    contact: user?.phone
                },
                theme: {
                    color: isMedicine ? "#3b82f6" : "#10b981"
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                addToast({ type: 'error', title: 'Payment Failed', message: response.error.description });
            });
            rzp.open();

        } catch (err: any) {
            addToast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Could not initiate payment' });
        }
    };

    const handleDismissMedicinePayment = async (prescriptionId: number) => {
        try {
            await api.patch(`/api/prescriptions/${prescriptionId}/dismiss-medicine-payment`);
            addToast({ type: 'info', title: 'Payment Dismissed', message: 'The medicine payment request has been removed.' });
            
            // Refresh data
            const prescRes = await prescriptionApi.getByPatient(user?.id || 0);
            setPrescriptions(prescRes.data);
        } catch (err: any) {
            addToast({ type: 'error', title: 'Error', message: 'Could not dismiss payment request' });
        }
    };

    const handleDownloadPrescription = (p: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        
        const itemsHtml = p.items?.map((it: any) => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                    <div style="font-weight: bold; color: #111;">${it.medicineName}</div>
                    <div style="font-size: 11px; color: #666;">${it.instructions || ''}</div>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${it.dosage}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${it.frequency}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${it.durationDays} Days</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Prescription #${p.id}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
                        .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                        .hospital-name { font-size: 24px; font-weight: 800; color: #10b981; margin: 0; }
                        .meta-info { margin-bottom: 40px; display: grid; grid-template-cols: 1fr 1fr; gap: 20px; }
                        .meta-block h4 { font-size: 11px; text-transform: uppercase; color: #999; margin: 0 0 5px 0; }
                        .meta-block p { font-weight: bold; margin: 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #f9fafb; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; }
                        .footer { margin-top: 50px; border-top: 1px solid #eee; pt: 20px; font-size: 12px; color: #999; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1 class="hospital-name">GOMEDIC HOSPITAL</h1>
                            <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Digital Clinical Record</p>
                        </div>
                        <div style="text-align: right">
                            <p style="font-weight: bold; margin: 0;">Prescription #${p.id}</p>
                            <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Issued: ${new Date(p.prescribedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    
                    <div class="meta-info">
                        <div class="meta-block">
                            <h4>Patient Details</h4>
                            <p>${p.patientName || 'Clinical Subject'}</p>
                            <span style="font-size: 12px; color: #666;">ID: #${p.patientId}</span>
                        </div>
                        <div class="meta-block" style="text-align: right">
                            <h4>Prescribing Doctor</h4>
                            <p>${(p.doctorName || '').toLowerCase().startsWith('dr.') ? p.doctorName : 'Dr. ' + (p.doctorName || 'Medical Officer')}</p>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Medication</th>
                                <th style="text-align: center;">Dosage</th>
                                <th style="text-align: center;">Frequency</th>
                                <th style="text-align: center;">Duration</th>
                            </tr>
                        </thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>

                    ${p.notes ? `<div style="margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 10px;">
                        <h4 style="font-size: 11px; text-transform: uppercase; color: #999; margin: 0 0 10px 0;">Clinical Notes</h4>
                        <p style="margin: 0; font-size: 13px; line-height: 1.5;">${p.notes}</p>
                    </div>` : ''}

                    <div class="footer">
                        <p>This is a computer-generated document. No signature required.</p>
                        <p>&copy; ${new Date().getFullYear()} GOMEDIC Multi-Speciality Hospital</p>
                    </div>
                    <script>window.print(); setTimeout(() => window.close(), 500);</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDownloadBill = (b: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Invoice ${b.billNumber}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
                        .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                        .hospital-name { font-size: 24px; font-weight: 800; color: #3b82f6; margin: 0; }
                        .invoice-label { font-size: 32px; font-weight: 900; color: #eee; margin: 0; text-transform: uppercase; }
                        .meta-info { margin-bottom: 40px; display: grid; grid-template-cols: 1fr 1fr; gap: 20px; }
                        .meta-block h4 { font-size: 11px; text-transform: uppercase; color: #999; margin: 0 0 5px 0; }
                        .meta-block p { font-weight: bold; margin: 0; }
                        .line-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; }
                        .total-section { margin-top: 30px; border-top: 2px solid #333; pt: 20px; }
                        .total-row { display: flex; justify-content: space-between; padding: 10px 0; }
                        .grand-total { font-size: 20px; font-weight: 900; background: #3b82f6; color: white; padding: 15px 20px; border-radius: 10px; margin-top: 10px; }
                        .footer { margin-top: 100px; font-size: 11px; color: #999; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1 class="hospital-name">GOMEDIC HOSPITAL</h1>
                            <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Medical Billing Department</p>
                        </div>
                        <h2 class="invoice-label">Invoice</h2>
                    </div>

                    <div class="meta-info">
                        <div class="meta-block">
                            <h4>Billed To</h4>
                            <p>${user?.fullName}</p>
                            <span style="font-size: 12px; color: #666;">Patient ID: #${b.patientId}</span>
                        </div>
                        <div class="meta-block" style="text-align: right">
                            <h4>Invoice Details</h4>
                            <p>${b.billNumber}</p>
                            <span style="font-size: 12px; color: #666;">Date: ${new Date(b.generatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div style="margin-top: 40px">
                        <div class="line-item" style="font-weight: bold; background: #f9fafb; padding: 12px;">
                            <span>Description</span>
                            <span>Amount</span>
                        </div>
                        ${b.consultationCharge > 0 ? `<div class="line-item"><span>Professional Consultation Fee</span><span>₹${b.consultationCharge}</span></div>` : ''}
                        ${b.medicineCharge > 0 ? `<div class="line-item"><span>Pharmacy & Medication Overhead</span><span>₹${b.medicineCharge}</span></div>` : ''}
                        ${b.labCharge > 0 ? `<div class="line-item"><span>Diagnostic Laboratory Services</span><span>₹${b.labCharge}</span></div>` : ''}
                        ${b.bedCharge > 0 ? `<div class="line-item"><span>Room / Inpatient Accommodation</span><span>₹${b.bedCharge}</span></div>` : ''}
                        ${b.otherCharges > 0 ? `<div class="line-item"><span>Ancillary Clinical Charges</span><span>₹${b.otherCharges}</span></div>` : ''}
                    </div>

                    <div class="total-section">
                        <div class="total-row">
                            <span style="color: #666">Subtotal</span>
                            <span style="font-weight: bold">₹${b.totalAmount + b.discount}</span>
                        </div>
                        ${b.discount > 0 ? `<div class="total-row" style="color: #ef4444">
                            <span>Hospital Discount</span>
                            <span>- ₹${b.discount}</span>
                        </div>` : ''}
                        <div class="grand-total">
                            <span>Invoice Total</span>
                            <span>₹${b.totalAmount}</span>
                        </div>
                        <div class="total-row" style="margin-top: 10px; color: #10b981; font-weight: bold">
                            <span>Amount Paid</span>
                            <span>₹${b.paidAmount}</span>
                        </div>
                        <div class="total-row">
                            <span style="color: #666">Balance Due</span>
                            <span style="font-weight: bold">₹${b.balanceAmount}</span>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Payment Status: ${b.paymentStatus.toUpperCase()}</p>
                        ${b.paidAt ? `<p>Paid On: ${new Date(b.paidAt).toLocaleString()}</p>` : ''}
                        <p style="margin-top: 20px">Thank you for choosing GOMEDIC Hospital. Wish you a speedy recovery.</p>
                    </div>
                    <script>window.print(); setTimeout(() => window.close(), 500);</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [docRes, deptRes, apptRes, prescRes, billRes] = await Promise.all([
                    doctorApi.getAll(),
                    api.get('/api/departments'),
                    appointmentApi.getMy(),
                    prescriptionApi.getByPatient(user?.id || 0),
                    billApi.getByPatient(user?.id || 0)
                ]);
                setDoctors(docRes.data);
                setDepartments(deptRes.data);
                setAppointments(apptRes.data);
                setPrescriptions(prescRes.data);
                setBills(billRes.data);
            } catch (e) {
                console.error("Failed to load patient data", e);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchData();
    }, [user]);

    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

    const filteredDoctors = selectedDept
        ? doctors.filter(d => d.departmentId === selectedDept)
        : doctors;

    if (loading) return <LoadingSpinner message="Loading patient portal..." />;

    const steps = ['Department', 'Specialist', 'Date & Time', 'Confirm'];

    return (
        <div className="pb-20 max-w-[1200px] mx-auto">
            {/* Main Content */}
            {location.pathname === '/appointments' ? (
                <div className="space-y-8">
                    <PageHeader title="My Appointments" subtitle="Manage your upcoming visits and medical history" />
                    <Card title="Upcoming & Recent Visits">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {appointments.length === 0 ? <div className="col-span-full"><EmptyState icon={<Calendar strokeWidth={1.5} className="w-8 h-8" />} title="No appointments found" /></div> :
                                appointments.map(a => (
                                    <div key={a.id} onClick={() => setSelectedAppointment(a)} className="p-5 rounded-[20px] border transition-colors cursor-pointer group bg-[#FDFDFD] border-zinc-200 hover:border-zinc-300 hover:shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-emerald-500 border-emerald-500 text-white">
                                                <Stethoscope strokeWidth={2} className="w-5 h-5" />
                                            </div>
                                            <Badge variant={statusBadge(a.status)}>{a.status}</Badge>
                                        </div>
                                        <p className="font-semibold text-zinc-900 text-[15px] mb-0.5 tracking-tight">{a.doctorName}</p>
                                        <p className="text-zinc-500 text-[12px] font-medium mb-4">{a.departmentName || 'Specialist'}</p>
                                        <div className="flex items-center gap-2.5 text-[12px] font-semibold text-zinc-700">
                                            <Calendar strokeWidth={2} className="w-3.5 h-3.5 text-zinc-400" /> {a.appointmentDate}
                                            <Clock strokeWidth={2} className="w-3.5 h-3.5 text-zinc-400" /> {a.appointmentTime}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </Card>
                </div>
            ) : location.pathname === '/bills' ? (
                <div className="space-y-8">
                    <PageHeader title="Bills & Payments" subtitle="Track your medical expenses and payment status" />
                    
                    {/* Section: Pending Medicine Payments */}
                    <Card title="Pending Medicine Payments">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {prescriptions.filter(p => p.isPaid && !p.isMedicinePaid && !p.isMedicinePaymentDismissed && p.status !== 'Dispensed').length === 0 ? (
                                <div className="col-span-full py-4 text-center text-zinc-400 text-[13px] italic border-2 border-dashed border-zinc-100 rounded-[20px]">
                                    No pending medicine payments.
                                </div>
                            ) : (
                                prescriptions.filter(p => p.isPaid && !p.isMedicinePaid && !p.isMedicinePaymentDismissed && p.status !== 'Dispensed').map(p => (
                                    <div key={p.id} className="bg-blue-50/30 rounded-[20px] p-5 border border-blue-100 shadow-sm hover:border-blue-200 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 rounded-[12px] bg-blue-500 flex items-center justify-center text-white">
                                                <Pill strokeWidth={2} className="w-5 h-5" />
                                            </div>
                                            <Badge variant="warning">Medicine Fee</Badge>
                                        </div>
                                        <p className="text-[11px] font-bold text-blue-600 uppercase mb-1">Prescription #{p.id}</p>
                                        <h3 className="text-[16px] font-bold text-zinc-900 mb-4">₹{p.totalCost}</h3>
                                        
                                        <div className="flex gap-2">
                                            <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => handlePayForPrescription(p, true)}>Pay Now</Button>
                                            <Button size="sm" variant="secondary" className="px-3" onClick={() => handleDismissMedicinePayment(p.id)} title="Remove from this section"><X className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    <Card title="Payment Ledger">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {bills.length === 0 ? <div className="col-span-full"><EmptyState icon={<Receipt strokeWidth={1.5} className="w-8 h-8" />} title="No billing records found" /></div> :
                                bills.map(b => (
                                <div key={b.id} className="bg-[#FDFDFD] rounded-[20px] p-6 border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-10 h-10 rounded-[12px] bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-600">
                                            <Receipt strokeWidth={2} className="w-5 h-5" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="secondary" className="px-2 h-8" onClick={() => handleDownloadBill(b)} title="Print Invoice"><FileText className="w-4 h-4" /></Button>
                                            <Badge variant={b.paymentStatus === 'Paid' ? 'success' : 'danger'}>{b.paymentStatus}</Badge>
                                        </div>
                                    </div>
                                    <h3 className="text-[16px] font-semibold tracking-tight text-zinc-900 mb-4">{b.billNumber}</h3>
                                    <div className="flex justify-between items-end border-t border-zinc-100 pt-4 mt-2">
                                        <div><p className="text-[10px] font-medium text-zinc-400 uppercase">Generated</p><p className="text-[13px] font-medium text-zinc-700">{new Date(b.generatedAt).toLocaleDateString()}</p></div>
                                        <div className="text-right"><p className="text-[10px] font-medium text-zinc-400 uppercase">Total</p><p className="text-[18px] font-bold text-zinc-900">₹{b.totalAmount}</p></div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                    </Card>
                </div>
            ) : location.pathname === '/prescriptions' ? (
                <div className="space-y-8">
                    <PageHeader title="My Prescriptions" subtitle="Access your medical history and medicine details" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {prescriptions.length === 0 ? <div className="lg:col-span-3"><EmptyState icon={<Pill strokeWidth={1.5} className="w-8 h-8" />} title="No prescriptions found" /></div> :
                            prescriptions.map(p => (
                                <div key={p.id} className="bg-[#FDFDFD] rounded-[20px] p-6 border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-10 h-10 rounded-[12px] bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-600"><Pill strokeWidth={2} className="w-5 h-5" /></div>
                                        <Badge variant={p.status === 'Dispensed' ? 'success' : 'warning'}>{p.status}</Badge>
                                    </div>
                                    <p className="text-[11px] font-semibold text-zinc-500 mb-1">{(p.doctorName || '').toLowerCase().startsWith('dr.') ? p.doctorName : `Dr. ${p.doctorName || 'Medical Team'}`}</p>
                                    <h3 className="text-[15px] font-semibold tracking-tight text-zinc-900 mb-4">Prescription #{p.id}</h3>
                                    <div className="flex justify-between items-center border-t border-zinc-100 pt-4 mt-2">
                                        <div><p className="text-[10px] font-medium text-zinc-400 uppercase">Issued On</p><p className="text-[13px] font-medium text-zinc-700">{new Date(p.prescribedAt).toLocaleDateString()}</p></div>
                                        <div className="flex gap-2">
                                            {p.isPaid ? (
                                                <>
                                                    <Button size="sm" variant="secondary" onClick={() => setSelectedPrescription(p)}>View</Button>
                                                    <Button size="sm" variant="secondary" className="px-2" onClick={() => handleDownloadPrescription(p)} title="Download PDF"><FileText className="w-4 h-4" /></Button>
                                                </>
                                            ) : (
                                                <div className="text-right">
                                                    <p className="text-[10px] text-zinc-400 italic mb-1">Pay bill to unlock</p>
                                                    <Badge variant="warning">Awaiting Payment</Badge>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            ) : (
                <div className="space-y-10">
                    <PageHeader title="Patient Dashboard" subtitle="Manage your health and connect with specialists" />
                    
                    {/* DEPARTMENTS */}
                    <section className="space-y-5">
                        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                            <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5"><LayoutGrid strokeWidth={2} className="w-5 h-5 text-zinc-500" /> Departments</h2>
                            {selectedDept && <Button size="sm" variant="secondary" onClick={() => setSelectedDept(null)}>Clear Filter</Button>}
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            {departments.map(dept => (
                                <div key={dept.id} onClick={() => setSelectedDept(dept.id)} className={`group p-5 rounded-[20px] border transition-all cursor-pointer text-center ${selectedDept === dept.id ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-[#FDFDFD] border-zinc-200 hover:border-zinc-300 hover:shadow-sm text-zinc-900'}`}>
                                    <div className={`w-10 h-10 rounded-[10px] mx-auto mb-3 flex items-center justify-center transition-colors ${selectedDept === dept.id ? 'bg-zinc-800 text-white' : 'bg-zinc-50 border border-zinc-100 text-zinc-600 group-hover:bg-zinc-100'}`}>{DEPT_ICONS[dept.name] || <Stethoscope strokeWidth={1.5} className="w-5 h-5" />}</div>
                                    <h3 className="font-semibold text-[13px] tracking-tight">{dept.name}</h3>
                                    <p className={`text-[11px] mt-1.5 font-medium ${selectedDept === dept.id ? 'text-zinc-400' : 'text-zinc-500'}`}>{doctors.filter(d => d.departmentId === dept.id).length} Specialists</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* SPECIALISTS */}
                    <section className="space-y-5 pt-4">
                        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                            <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5"><User strokeWidth={2} className="w-5 h-5 text-zinc-500" /> {selectedDept ? `Specialists in ${departments.find(d => d.id === selectedDept)?.name}` : 'Our Clinical Team'}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredDoctors.map(doc => (
                                <div key={doc.id} className="bg-[#FDFDFD] rounded-[20px] border border-zinc-200 p-5 transition-shadow hover:shadow-md hover:border-zinc-300">
                                    <div className="flex items-center gap-4 mb-5">
                                        {doc.profileImageUrl ? <img src={doc.profileImageUrl} alt={doc.fullName} className="w-14 h-14 rounded-[14px] object-cover bg-zinc-50 border border-zinc-100" /> : <div className="w-14 h-14 rounded-[14px] flex items-center justify-center bg-zinc-50 border border-zinc-200 text-zinc-400"><User strokeWidth={1.5} className="w-6 h-6" /></div>}
                                        <div className="flex-1 min-w-0"><h3 className="text-[15px] font-semibold text-zinc-900 truncate">{doc.fullName}</h3><p className="text-[12px] text-zinc-500 truncate">{doc.specialization}</p></div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                                        <div className="flex flex-col"><span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-0.5">Consultation</span><span className="text-[15px] font-bold text-zinc-900">₹{doc.consultationFee}</span></div>
                                        <Button size="sm" onClick={() => { setBookingDoc(doc); setBookingDate(new Date().toISOString().split('T')[0]); setBookingStep(3); setBookingModalOpen(true); }}>Schedule Visit</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}

            {/* Common Modals */}

            {/* Generic Booking Modal (Multi-step like home) */}
            <Modal
                isOpen={bookingModalOpen}
                onClose={() => { setBookingModalOpen(false); resetBooking(); }}
                title="Schedule an Appointment"
                size="md"
            >
                <div className="space-y-6">
                    {/* Progress Bar */}
                    <div className="flex gap-2">
                        {steps.map((s, i) => (
                            <div key={s} className="flex-1">
                                <div className={`h-1 rounded-full mb-1.5 transition-colors duration-300 ${i < bookingStep ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
                                <span className={`text-[10px] font-semibold uppercase tracking-wider ${i < bookingStep ? 'text-zinc-900' : 'text-zinc-400'}`}>{s}</span>
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Department */}
                    {bookingStep === 1 && (
                        <div className="animate-in slide-in-from-right-2 fade-in duration-200">
                            <h3 className="text-[15px] font-semibold text-zinc-900 mb-5">Select Department</h3>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {departments.map(d => (
                                    <button key={d.id} onClick={() => { setBookingDeptId(d.id); setBookingStep(2); }}
                                        className="p-4 rounded-xl border border-zinc-200 bg-white hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left">
                                        <span className="text-[13px] font-bold text-zinc-800">{d.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Doctor */}
                    {bookingStep === 2 && (
                        <div className="animate-in slide-in-from-right-2 fade-in duration-200">
                            <button onClick={() => setBookingStep(1)} className="flex items-center gap-1 text-zinc-500 hover:text-zinc-900 text-[12px] font-bold mb-4"><ArrowLeft className="w-3 h-3" /> Back</button>
                            <h3 className="text-[15px] font-semibold text-zinc-900 mb-5">Select Specialist</h3>
                            {deptDocsLoading ? <LoadingSpinner size="sm" /> : (
                                <div className="space-y-2 mb-6">
                                    {deptDoctors.map(doc => (
                                        <button key={doc.id} onClick={() => { setBookingDoc(doc); setBookingDate(new Date().toISOString().split('T')[0]); setBookingStep(3); }}
                                            className="w-full p-4 rounded-xl border border-zinc-200 bg-white hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center justify-between text-left">
                                            <div>
                                                <p className="text-[13px] font-bold text-zinc-900">{doc.fullName}</p>
                                                <p className="text-[11px] text-zinc-500">{doc.specialization}</p>
                                            </div>
                                            <span className="text-[13px] font-bold text-emerald-600">₹{doc.consultationFee}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Date & Time */}
                    {bookingStep === 3 && bookingDoc && (
                        <div className="animate-in slide-in-from-right-2 fade-in duration-200">
                            {!bookParam && <button onClick={() => setBookingStep(2)} className="flex items-center gap-1 text-zinc-500 hover:text-zinc-900 text-[12px] font-bold mb-4"><ArrowLeft className="w-3 h-3" /> Back</button>}
                            <h3 className="text-[15px] font-semibold text-zinc-900 mb-5">Choose Schedule: {bookingDoc.fullName}</h3>
                            
                            <div className="space-y-5">
                                <Input label="Select Date" type="date" required value={bookingDate} onChange={(e: any) => setBookingDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                                
                                <div className="space-y-2">
                                    <label className="text-[12px] font-medium text-zinc-700 block mb-1">Available Slots</label>
                                    {slotsLoading ? <LoadingSpinner size="sm" /> : (
                                        <div className="grid grid-cols-4 gap-2">
                                            {availableSlots.map(slotStr => {
                                                const isBooked = slotStr.endsWith('::booked');
                                                const slot = isBooked ? slotStr.replace('::booked', '') : slotStr;
                                                return (
                                                    <button key={slotStr} type="button" disabled={isBooked} onClick={() => setSelectedSlot(slot)}
                                                        className={`py-2 px-1 rounded-lg border text-[11px] font-bold transition-all ${isBooked ? 'bg-zinc-50 text-zinc-300' : selectedSlot === slot ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white text-zinc-700 hover:border-zinc-400'}`}>
                                                        {slot}
                                                    </button>
                                                );
                                            })}
                                            {availableSlots.length === 0 && <p className="col-span-4 text-center text-[12px] text-zinc-400 italic py-4">No slots available for this date.</p>}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[12px] font-medium text-zinc-700 block mb-1.5">Patient Age</label>
                                        <input 
                                            type="number" 
                                            value={patientAge} 
                                            onChange={e => setPatientAge(e.target.value)} 
                                            placeholder="Age"
                                            readOnly={!!user?.dateOfBirth}
                                            className={`w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-[14px] placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 transition-all shadow-sm ${user?.dateOfBirth ? 'bg-zinc-50 text-zinc-500 cursor-not-allowed' : 'bg-white text-zinc-900'}`}
                                        />
                                    </div>
                                    <Input label="Chief Complaint" required value={chiefComplaint} onChange={(e: any) => setChiefComplaint(e.target.value)} placeholder="e.g. Fever" />
                                </div>
                            </div>

                            <Button onClick={() => setBookingStep(4)} disabled={!selectedSlot || !bookingDate || !chiefComplaint || !patientAge} className="w-full mt-8">Review & Confirm</Button>
                        </div>
                    )}

                    {/* Step 4: Finalize */}
                    {bookingStep === 4 && bookingDoc && (
                        <div className="animate-in slide-in-from-right-2 fade-in duration-200">
                            <button onClick={() => setBookingStep(3)} className="flex items-center gap-1 text-zinc-500 hover:text-zinc-900 text-[12px] font-bold mb-4"><ArrowLeft className="w-3 h-3" /> Back</button>
                            <h3 className="text-[15px] font-semibold text-zinc-900 mb-5">Confirm Details</h3>
                            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-4">
                                <div className="flex justify-between items-center"><span className="text-zinc-500 text-[12px]">Specialist</span><span className="font-bold text-zinc-900 text-[13px]">{bookingDoc.fullName}</span></div>
                                <div className="flex justify-between items-center"><span className="text-zinc-500 text-[12px]">Schedule</span><span className="font-bold text-zinc-900 text-[13px]">{bookingDate} at {selectedSlot}</span></div>
                                <div className="flex justify-between items-center"><span className="text-zinc-500 text-[12px]">Consultation Fee</span><span className="font-bold text-zinc-900 text-[13px]">₹{bookingDoc.consultationFee}</span></div>
                            </div>
                            <Button onClick={handleBookAppointment} loading={bookingLoading} className="w-full mt-8 h-12 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">Finalize Booking</Button>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Other Modals (Prescription, Appointment Detail) */}
            <Modal isOpen={!!selectedAppointment} onClose={() => setSelectedAppointment(null)} title="Appointment Details" size="md">
                {selectedAppointment && (
                    <div className="space-y-6">
                        <div className="bg-[#FDFDFD] border border-zinc-200 rounded-[20px] p-6 shadow-sm">
                            <h3 className="text-xl font-bold tracking-tight text-zinc-900 mb-1">{selectedAppointment.doctorName}</h3>
                            <p className="text-[13px] text-zinc-500 font-medium">{selectedAppointment.departmentName || 'Specialist'}</p>
                            <div className="mt-6 space-y-3">
                                <div className="flex justify-between"><span className="text-[12px] text-zinc-500">Date</span><span className="text-[13px] font-bold">{selectedAppointment.appointmentDate}</span></div>
                                <div className="flex justify-between"><span className="text-[12px] text-zinc-500">Time</span><span className="text-[13px] font-bold">{selectedAppointment.appointmentTime}</span></div>
                                <div className="flex justify-between"><span className="text-[12px] text-zinc-500">Status</span><Badge variant={statusBadge(selectedAppointment.status)}>{selectedAppointment.status}</Badge></div>
                            </div>
                        </div>
                        <Button className="w-full" onClick={() => setSelectedAppointment(null)}>Close</Button>
                    </div>
                )}
            </Modal>

            <Modal isOpen={!!selectedPrescription} onClose={() => setSelectedPrescription(null)} title="Prescription Details" size="md">
                {selectedPrescription && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
                            <div><p className="text-[10px] font-bold text-zinc-400 uppercase">Doctor</p><p className="text-[14px] font-bold text-zinc-900">{(selectedPrescription.doctorName || '').toLowerCase().startsWith('dr.') ? selectedPrescription.doctorName : `Dr. ${selectedPrescription.doctorName}`}</p></div>
                            <Badge variant={selectedPrescription.status === 'Dispensed' ? 'success' : 'warning'}>{selectedPrescription.status}</Badge>
                        </div>
                        <div className="space-y-3">
                            {selectedPrescription.items?.map((it: any, i: number) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-50">
                                    <div><p className="text-[13px] font-bold text-zinc-900">{it.medicineName}</p><p className="text-[11px] text-zinc-500">{it.dosage} - {it.frequency}</p></div>
                                    <div className="text-right">
                                        <p className="text-[12px] font-bold">{it.durationDays} Days</p>
                                        <p className="text-[11px] text-zinc-400">₹{it.lineTotal}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {selectedPrescription.isPaid && !selectedPrescription.isMedicinePaid && selectedPrescription.status !== 'Dispensed' && (
                            <div className="pt-2">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-md" onClick={() => handlePayForPrescription(selectedPrescription, true)}>
                                    Pay for Medicines (Optional: ₹{selectedPrescription.totalCost})
                                </Button>
                                <p className="text-[10px] text-zinc-400 text-center mt-2 italic">Medicine payment is optional. You can also pay at the counter.</p>
                            </div>
                        )}
                        {selectedPrescription.isMedicinePaid && (
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                                <span className="text-[12px] font-bold text-blue-700">Medicine Payment Confirmed</span>
                                <Badge variant="success">Paid ₹{selectedPrescription.totalCost}</Badge>
                            </div>
                        )}
                        <Button className="w-full" variant="secondary" onClick={() => setSelectedPrescription(null)}>Close</Button>
                    </div>
                )}
            </Modal>
        </div>
    );
};
