import React from 'react';
import { PageHeader, Card, EmptyState } from '../ui';
import { Calendar, Pill, FlaskConical, Receipt } from 'lucide-react';

export const PatientDashboard = () => (
  <div className="space-y-6">
    <PageHeader title="My Health Portal" subtitle="Manage your visits and medical records" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card title="Next Visit"><EmptyState icon={<Calendar />} title="No upcoming visits" /></Card>
      <Card title="Lab Results"><EmptyState icon={<FlaskConical />} title="All results normal" /></Card>
      <Card title="Outstanding Bills"><EmptyState icon={<Receipt />} title="No pending payments" /></Card>
    </div>
  </div>
);

export const PharmacistDashboard = () => (
  <div className="space-y-6">
    <PageHeader title="Pharmacy Management" />
    <Card title="Pending Prescriptions"><EmptyState icon={<Pill />} title="Queue is clear" /></Card>
  </div>
);

export const LabTechDashboard = () => (
  <div className="space-y-6">
    <PageHeader title="Laboratory Queue" />
    <Card title="Processing"><EmptyState icon={<FlaskConical />} title="No pending samples" /></Card>
  </div>
);

export const ReceptionistDashboard = () => (
  <div className="space-y-6">
    <PageHeader title="Reception Desk" />
    <Card title="Waitlist"><EmptyState icon={<Calendar />} title="No patients waiting" /></Card>
  </div>
);
