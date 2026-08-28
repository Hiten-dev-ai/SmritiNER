import jsPDF from 'jspdf';
import type { AuthenticatedPatient, CaregiverObservation, JourneyGameSession, ReminderItem } from '../types';
import { computeEngagementAnalytics } from './analyticsEngine';
import { getLocalDateKey } from './localDate';

const safeText = (value?: string) => (value || 'Not recorded').replace(/[^\x20-\x7E]/g, '').trim() || 'Not recorded';

export function generateEngagementPDF(
  patient: AuthenticatedPatient,
  sessions: JourneyGameSession[],
  reminders: ReminderItem[],
  observations: CaregiverObservation[],
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const analytics = computeEngagementAnalytics(sessions, reminders);
  const width = doc.internal.pageSize.getWidth();
  let y = 16;

  const heading = (label: string) => {
    if (y > 260) { doc.addPage(); y = 18; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(28, 88, 55); doc.text(label, 14, y); y += 7;
  };
  const line = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(55, 55, 55); doc.text(`${label}:`, 16, y);
    doc.setFont('helvetica', 'normal'); doc.text(safeText(value), 56, y); y += 5.5;
  };

  doc.setFillColor(28, 88, 55); doc.rect(0, 0, width, 31, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text('SmritiNER - Caregiver Observation and Engagement Summary', 14, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text('DEMO-GENERATED - NON-DIAGNOSTIC - NOT A CLINICAL ASSESSMENT', 14, y + 7);
  y = 40;

  heading('CARE PROFILE');
  line('Patient', patient.name); line('Age / gender', `${patient.age} / ${patient.gender}`);
  line('Location', `${patient.district}, ${patient.state}`); line('Preferred language', patient.preferredLanguage);
  line('Emergency contact', `${patient.emergencyContactName} - ${patient.emergencyContactPhone}`);
  if (patient.clinicianCondition) line('Clinician-recorded context', patient.clinicianCondition);

  y += 3; heading('ENGAGEMENT SNAPSHOT');
  line('Last active', analytics.lastActive ? new Date(analytics.lastActive).toLocaleString('en-IN') : 'No completed sessions');
  line('Active days in last 7 days', String(analytics.activeDaysLast7));
  line('Completed sessions', String(analytics.completedSessions));
  line('Completion rate', `${analytics.completionRate}%`);
  line('Accuracy consistency', `${analytics.averageAccuracy}% average`);
  line('Median response time', analytics.medianResponseMs ? `${(analytics.medianResponseMs / 1000).toFixed(1)} seconds` : 'Insufficient data');
  line('Average hint use', String(analytics.averageHints));

  y += 3; heading('PERSONAL BASELINE COMPARISON');
  if (!analytics.trends.length) line('Status', 'Insufficient data');
  analytics.trends.forEach((trend) => {
    const detail = trend.status === 'insufficient-data'
      ? `Insufficient data (${trend.sessions}/10 comparable sessions)`
      : `${trend.status.replace('-', ' ')}; accuracy ${trend.accuracyChange! >= 0 ? '+' : ''}${trend.accuracyChange} points; response ${trend.responseChangePercent! >= 0 ? '+' : ''}${trend.responseChangePercent}%`;
    line(trend.label, detail);
  });
  if (analytics.notableChange) {
    doc.setFillColor(255, 247, 220); doc.roundedRect(14, y, width - 28, 20, 2, 2, 'F');
    doc.setTextColor(115, 70, 10); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text(doc.splitTextToSize('Notable change - check sleep, illness, mood, medicine, interruptions, and device conditions. Discuss sudden or persistent change with a qualified clinician.', width - 36), 18, y + 6);
    y += 25;
  }

  heading('TODAY\'S CARE ROUTINES');
  const today = getLocalDateKey();
  reminders.slice(0, 12).forEach((reminder) => line(`${reminder.time} ${reminder.title}`, reminder.completedDates.includes(today) ? 'Completed' : 'Pending'));

  y += 3; heading('RECENT CAREGIVER OBSERVATIONS');
  if (!observations.length) line('Status', 'No observations recorded');
  observations.slice(0, 5).forEach((observation) => {
    const text = `${new Date(observation.observedAt).toLocaleDateString('en-IN')} [${observation.tags.join(', ') || 'context'}] ${safeText(observation.note)}`;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(55, 55, 55);
    const wrapped = doc.splitTextToSize(text, width - 32); doc.text(wrapped, 16, y); y += wrapped.length * 4.5 + 2;
  });

  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
  doc.text('Game results can be influenced by device, environment, familiarity, vision, hearing, mood, sleep, and illness.', width / 2, 278, { align: 'center' });
  doc.text('This summary supports caregiver observation only. It does not diagnose dementia or replace professional care.', width / 2, 283, { align: 'center' });
  doc.save(`SmritiNER_Caregiver_Observation_Engagement_${safeText(patient.name).replace(/\W+/g, '_')}.pdf`);
}
