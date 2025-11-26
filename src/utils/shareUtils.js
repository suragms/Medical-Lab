// Share utilities for WhatsApp and Email

// Share PDF via WhatsApp (Web Share API - Free!)
export const shareViaWhatsApp = async (pdfBlob, patientName, phone) => {
  const fileName = `${patientName.replace(/\s+/g, '_')}_Report.pdf`;
  
  try {
    // Check if Web Share API is available
    if (navigator.share) {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      await navigator.share({
        title: `Lab Report - ${patientName}`,
        text: `Medical test report for ${patientName}`,
        files: [file]
      });
      
      return { success: true, message: 'Shared successfully!' };
    } else {
      // Fallback: Open WhatsApp Web with message
      const message = encodeURIComponent(`Lab Report for ${patientName} is ready. Please contact us to receive your report.`);
      const whatsappNumber = phone.replace(/\D/g, ''); // Remove non-digits
      const url = `https://wa.me/${whatsappNumber}?text=${message}`;
      
      window.open(url, '_blank');
      return { success: true, message: 'Opening WhatsApp...' };
    }
  } catch (error) {
    console.error('WhatsApp share error:', error);
    return { success: false, message: 'Could not share via WhatsApp' };
  }
};

// Share PDF via Email (requires backend SMTP)
export const shareViaEmail = async (pdfBlob, patientEmail, patientName) => {
  try {
    // Convert blob to base64
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        const base64data = reader.result.split(',')[1];
        
        try {
          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: patientEmail,
              subject: `Lab Test Report - ${patientName}`,
              patientName: patientName,
              pdfData: base64data,
              fileName: `${patientName.replace(/\s+/g, '_')}_Report.pdf`
            })
          });

          if (response.ok) {
            resolve({ success: true, message: 'Email sent successfully!' });
          } else {
            reject({ success: false, message: 'Failed to send email' });
          }
        } catch (error) {
          reject({ success: false, message: 'Email service unavailable' });
        }
      };

      reader.onerror = () => {
        reject({ success: false, message: 'Error reading PDF' });
      };

      reader.readAsDataURL(pdfBlob);
    });
  } catch (error) {
    console.error('Email share error:', error);
    return { success: false, message: 'Could not send email' };
  }
};

// Download PDF directly
export const downloadPDFDirect = (pdfBlob, patientName) => {
  const fileName = `${patientName.replace(/\s+/g, '_')}_Report.pdf`;
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Print PDF
export const printPDFDirect = (pdfBlob) => {
  const url = URL.createObjectURL(pdfBlob);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow.print();
    }, 100);
  };
};

// Copy WhatsApp link to clipboard
export const copyWhatsAppLink = (phone, patientName) => {
  const message = encodeURIComponent(`Lab Report for ${patientName} is ready. Please visit our lab to collect your report or request digital copy.`);
  const whatsappNumber = phone.replace(/\D/g, '');
  const url = `https://wa.me/${whatsappNumber}?text=${message}`;
  
  navigator.clipboard.writeText(url).then(() => {
    return { success: true, message: 'WhatsApp link copied!' };
  }).catch(() => {
    return { success: false, message: 'Failed to copy link' };
  });
};
