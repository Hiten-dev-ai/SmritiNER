import jsPDF from 'jspdf';
import type { PatientProfile, CognitiveMetrics, GameSession, ReminderItem } from '../types';

export function generateClinicalPDF(
  patient: PatientProfile,
  metrics: CognitiveMetrics,
  sessions: GameSession[],
  reminders: ReminderItem[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header Banner
  doc.setFillColor(30, 79, 46); // Clinical forest green
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('SmritiNER (স্মৃতিNER) - Neurological Cognitive Assessment', 14, 12);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Digital Therapeutics & Longitudinal Neuro-Cognitive Monitoring System', 14, 18);
  doc.text(`Clinical Evaluation Date: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}`, 14, 24);

  y = 36;

  // Patient Info Box
  doc.setDrawColor(200, 220, 205);
  doc.setFillColor(245, 250, 246);
  doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setTextColor(26, 65, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('PATIENT DEMOGRAPHICS & CLINICAL PROFILE', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(45, 45, 45);

  doc.text(`Patient Name: ${patient.name}`, 18, y + 12);
  doc.text(`Age / Gender: ${patient.age} Yrs / ${patient.gender}`, 18, y + 17);
  doc.text(`Location: ${patient.villageOrDistrict}, ${patient.state}`, 18, y + 22);

  doc.text(`Clinical Stage: ${patient.diagnosisStage}`, 110, y + 12);
  doc.text(`Designated Caregiver: ${patient.emergencyContactName} (${patient.emergencyContactPhone})`, 110, y + 17);
  doc.text(`Assigned Health Officer / ASHA: ${patient.ashaWorkerAssigned || 'Jorhat District Hospital'}`, 110, y + 22);

  y += 34;

  // MoCA-Aligned Scores Grid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(30, 79, 46);
  doc.text('COGNITIVE DOMAIN PERFORMANCE METRICS (MoCA / MMSE Aligned)', 14, y);

  y += 5;

  const scoreBoxes = [
    { title: 'Composite Score', val: `${metrics.overallCognitiveScore}/100`, color: [30, 79, 46] },
    { title: 'Memory Retention', val: `${metrics.memoryIndex}%`, color: [2, 132, 199] },
    { title: 'Attention & Focus', val: `${metrics.attentionIndex}%`, color: [217, 119, 6] },
    { title: 'Executive Routine', val: `${metrics.executiveFunction}%`, color: [147, 51, 234] },
    { title: 'Motor Consistency', val: `${metrics.motorReactionScore}%`, color: [14, 165, 233] },
  ];

  const boxWidth = (pageWidth - 28 - 4 * 3) / 5;
  scoreBoxes.forEach((box, i) => {
    const x = 14 + i * (boxWidth + 3);
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(252, 252, 252);
    doc.roundedRect(x, y, boxWidth, 20, 1.5, 1.5, 'FD');

    doc.setFontSize(7.5);
    doc.setTextColor(90, 90, 90);
    doc.text(box.title, x + boxWidth / 2, y + 6, { align: 'center' });

    doc.setFontSize(12.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(box.color[0], box.color[1], box.color[2]);
    doc.text(box.val, x + boxWidth / 2, y + 15, { align: 'center' });
  });

  y += 26;

  // Clinical Summary & Risk Assessment
  doc.setDrawColor(metrics.riskOfDecline === 'High' ? 225 : 30, metrics.riskOfDecline === 'High' ? 29 : 79, metrics.riskOfDecline === 'High' ? 72 : 46);
  doc.setFillColor(metrics.riskOfDecline === 'High' ? 254 : 245, metrics.riskOfDecline === 'High' ? 242 : 250, metrics.riskOfDecline === 'High' ? 242 : 246);
  doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(metrics.riskOfDecline === 'High' ? 180 : 30, metrics.riskOfDecline === 'High' ? 20 : 79, metrics.riskOfDecline === 'High' ? 40 : 46);
  doc.text(`Diagnostic Trajectory Analysis - Risk Category: [ ${metrics.riskOfDecline.toUpperCase()} RISK ]`, 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(40, 40, 40);
  const splitSummary = doc.splitTextToSize(metrics.clinicalSummary, pageWidth - 36);
  doc.text(splitSummary, 18, y + 12);

  y += 28;

  // Recent Cognitive Therapy Sessions Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 79, 46);
  doc.text('LONGITUDINAL DIGITAL THERAPEUTIC SESSIONS (RECENT LOGS)', 14, y);

  y += 5;

  // Table Header
  doc.setFillColor(230, 242, 235);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 70, 40);

  doc.text('Date', 16, y + 5);
  doc.text('Therapeutic Module', 45, y + 5);
  doc.text('Accuracy', 105, y + 5);
  doc.text('Duration', 130, y + 5);
  doc.text('Reaction Latency', 155, y + 5);
  doc.text('Tier', 185, y + 5);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  const displaySessions = sessions.slice(0, 7);
  displaySessions.forEach((s) => {
    const sessionDate = new Date(s.completedAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
    doc.text(sessionDate, 16, y + 5);
    doc.text(s.gameTitle, 45, y + 5);
    doc.text(`${s.accuracy}%`, 105, y + 5);
    doc.text(`${s.durationSeconds}s`, 130, y + 5);
    doc.text(`${s.avgReactionTimeMs} ms`, 155, y + 5);
    doc.text(`Tier ${s.difficultyLevel}`, 185, y + 5);

    doc.setDrawColor(240, 240, 240);
    doc.line(14, y + 7, pageWidth - 14, y + 7);
    y += 7;
  });

  y += 4;

  // Medication & Daily Adherence Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 79, 46);
  doc.text('MEDICATION & ROUTINE COMPLIANCE MONITORING', 14, y);

  y += 5;

  const todayStr = new Date().toISOString().split('T')[0];
  reminders.forEach((r) => {
    const isTaken = r.completedDates.includes(todayStr);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', isTaken ? 'normal' : 'bold');
    doc.setTextColor(isTaken ? 40 : 190, isTaken ? 110 : 40, isTaken ? 50 : 40);
    doc.text(
      `[${isTaken ? 'TAKEN' : 'PENDING'}] ${r.time} - ${r.title} ${r.dosage ? `(${r.dosage})` : ''}`,
      16,
      y + 4
    );
    y += 5.5;
  });

  // Footer Note
  y = 282;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  doc.text(
    'Confidential Medical Document • SmritiNER Clinical Platform for Age-Related Cognitive Disorders (North Eastern Region)',
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  doc.save(`SmritiNER_Clinical_Report_${patient.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
