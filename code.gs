const SHEET_ID = '1RBWCJKHdC1_saHF6_IHg6t-D4SSS_1tgwq9pUuOA3Q8'; // Your Google Sheet ID
const FOLDER_ID = '1ZwyhDlvEQRduoY7qpULy1fTa_BRU6Y44'; // Your Drive folder ID
const EMAIL_SUBJECT_FILTER = 'subject:"Viable: Trial Document"';
const LABEL_NAME = 'Processed';

function processViableEmails() {
  const threads = GmailApp.search(EMAIL_SUBJECT_FILTER + ' -label:' + LABEL_NAME);
  const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const label = getOrCreateLabel(LABEL_NAME);

  threads.forEach(thread => {
    const messages = thread.getMessages();

    messages.forEach(message => {
      const attachments = message.getAttachments();
      if (attachments.length === 0) return;

      attachments.forEach(attachment => {
        const contentType = attachment.getContentType();
        const ext = attachment.getName().split('.').pop();

        // Skip unsupported file types
        if (!['pdf', 'jpg', 'jpeg', 'png', 'eml'].includes(ext.toLowerCase())) return;

        // Simulated Extraction from email body
        const body = message.getPlainBody(); // use message.getBody() if needed

        const dateMatch = body.match(/\d{2}\.\d{2}\.\d{2}/) || ['N/A'];
        const invoiceMatch = body.match(/INV[\dA-Z\-]+/) || ['N/A'];
        const amountMatch = body.match(/(?:Rs|₹)\s?[0-9,]+(?:\.\d{2})?/) || ['N/A'];

        let vendorMatch = body.match(/Vendor[:\-]?\s*(\w+)/i);
        const vendor = vendorMatch ? vendorMatch[1] : 'Viable';

        const fileName = `${dateMatch[0]}_${vendor}_${invoiceMatch[0]}_${amountMatch[0]}.${ext}`;
        const savedFile = folder.createFile(attachment.copyBlob()).setName(fileName);
        const fileUrl = savedFile.getUrl();

        // Log to Google Sheet
        sheet.appendRow([
          new Date(),            // Timestamp
          dateMatch[0],          // Invoice/Bill Date
          invoiceMatch[0],       // Invoice/Bill Number
          amountMatch[0],        // Amount
          vendor,                // Vendor/Company Name
          fileUrl,               // Drive File URL
          contentType            // File Type
        ]);
      });

      message.markRead();
    });

    thread.addLabel(label);
  });
}

function getOrCreateLabel(name) {
  let label = GmailApp.getUserLabelByName(name);
  if (!label) {
    label = GmailApp.createLabel(name);
  }
  return label;
}
