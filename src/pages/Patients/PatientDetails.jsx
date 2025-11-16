import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Download, Share2, Printer, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePatientStore, useSettingsStore } from '../../store';
import { getProfileById } from '../../data/testMaster';
import { generatePatientReport, getPDFBlob } from '../../utils/pdfGenerator';
import { shareViaWhatsApp, downloadPDFDirect, printPDFDirect } from '../../utils/shareUtils';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPatientById } = usePatientStore();
  const { labInfo } = useSettingsStore();
  const patient = getPatientById(id);
  const profile = patient ? getProfileById(patient.testProfile) : null;
  const [isGenerating, setIsGenerating] = useState(false);

  if (!patient) {
    return <div>Patient not found</div>;
  }

  const hasResults = patient.resultSnapshot && patient.resultSnapshot.length > 0;

  const handleDownloadPDF = async () => {
    if (!hasResults) {
      toast.error('No test results available');
      return;
    }

    setIsGenerating(true);
    try {
      const doc = generatePatientReport(patient, profile, patient.resultSnapshot, labInfo);
      const blob = getPDFBlob(doc);
      downloadPDFDirect(blob, patient.name);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    if (!hasResults) {
      toast.error('No test results available');
      return;
    }

    setIsGenerating(true);
    try {
      const doc = generatePatientReport(patient, profile, patient.resultSnapshot, labInfo);
      const blob = getPDFBlob(doc);
      printPDFDirect(blob);
      toast.success('Opening print dialog...');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsAppShare = async () => {
    if (!hasResults) {
      toast.error('No test results available');
      return;
    }

    setIsGenerating(true);
    try {
      const doc = generatePatientReport(patient, profile, patient.resultSnapshot, labInfo);
      const blob = getPDFBlob(doc);
      const result = await shareViaWhatsApp(blob, patient.name, patient.phone);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('WhatsApp share error:', error);
      toast.error('Failed to share via WhatsApp');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Button variant="ghost" onClick={() => navigate('/patients')} icon={ArrowLeft} style={{ marginBottom: '1rem' }}>
        Back
      </Button>

      <Card title={`Patient: ${patient.name}`}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div><strong>Age:</strong> {patient.age} years</div>
          <div><strong>Gender:</strong> {patient.gender}</div>
          <div><strong>Phone:</strong> {patient.phone}</div>
          {patient.address && <div><strong>Address:</strong> {patient.address}</div>}
          <div><strong>Test Profile:</strong> {profile?.name || patient.testProfile}</div>
          {patient.referredBy && <div><strong>Referred By:</strong> {patient.referredBy}</div>}
          <div><strong>Created:</strong> {new Date(patient.createdAt).toLocaleString()}</div>
          <div><strong>Status:</strong> <span style={{ 
            padding: '0.25rem 0.75rem', 
            borderRadius: '4px',
            background: patient.status === 'completed' ? '#e8f5e9' : '#fff3e0',
            color: patient.status === 'completed' ? '#2e7d32' : '#f57c00',
            fontWeight: 600
          }}>{patient.status.replace('_', ' ').toUpperCase()}</span></div>
          
          {patient.status === 'registered' && (
            <Button 
              onClick={() => navigate(`/results/enter/${patient.id}`)}
              icon={FileText}
              variant="primary"
            >
              Enter Results
            </Button>
          )}

          {hasResults && (
            <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #e0e0e0', paddingTop: '1rem' }}>
              <h4 style={{ margin: 0 }}>Report Actions</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                <Button 
                  onClick={handleDownloadPDF}
                  icon={Download}
                  variant="primary"
                  size="small"
                  loading={isGenerating}
                >
                  Download PDF
                </Button>
                <Button 
                  onClick={handlePrint}
                  icon={Printer}
                  variant="secondary"
                  size="small"
                  loading={isGenerating}
                >
                  Print
                </Button>
                <Button 
                  onClick={handleWhatsAppShare}
                  icon={Share2}
                  variant="success"
                  size="small"
                  loading={isGenerating}
                >
                  WhatsApp
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PatientDetails;
