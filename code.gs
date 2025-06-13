// Google Sheet ID where data will be logged
const SHEET_ID = '1RBWCJKHdC1_saHF6_IHg6t-D4SSS_1tgwq9pUuOA3Q8';

// Google Drive folder ID where attachments will be saved
const FOLDER_ID = '1ZwyhDlvEQRduoY7qpULy1fTa_BRU6Y44';

// Email subject filter to fetch only required emails
const EMAIL_SUBJECT_FILTER = 'subject:"Viable: Trial Document"';

// Label name to mark processed emails
const LABEL_NAME = 'Processed';

//  Google Vision API key
const VISION_API_KEY = 'AIzaSyBqo6aeNPRel6aM_IzO1wSMoyHIAJEckOo';  // 

function processViableEmails() {
  let sheet, folder, label;

  try {
    sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    folder = DriveApp.getFolderById(FOLDER_ID);
    label = getOrCreateLabel(LABEL_NAME);
  } catch (e) {
    Logger.log(' Error accessing Sheet or Drive: ' + e);
    return;
  }

  const threads = GmailApp.search(`${EMAIL_SUBJECT_FILTER} -label:${LABEL_NAME}`);
  if (threads.length === 0) {
    Logger.log(' No matching emails found.');
    return;
  }

  threads.forEach(thread => {
    const messages = thread.getMessages();

    messages.forEach(message => {
      const attachments = message.getAttachments();
      if (!attachments || attachments.length === 0) {
        Logger.log(' Skipping message with no attachments.');
        return;
      }

      attachments.forEach(attachment => {
        const ext = attachment.getName().split('.').pop().toLowerCase();
        const contentType = attachment.getContentType();
        if (!['pdf', 'jpg', 'jpeg', 'png', 'eml'].includes(ext)) {
          Logger.log(' Unsupported file type: ' + ext);
          return;
        }

        try {
          let body = message.getPlainBody(); // Fallback to email text

          //  OCR: Append image/PDF text if applicable
          if (['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
            const blob = attachment.copyBlob();
            const base64Image = Utilities.base64Encode(blob.getBytes());
            const ocrText = extractTextFromImageBase64(base64Image);
            body += '\n\n' + ocrText;
          }

          const dateMatch = body.match(/\d{2}\.\d{2}\.\d{2}/) || ['N/A'];
          const invoiceMatch = body.match(/INV[\dA-Z\-]+/) || ['N/A'];
          let amountMatch = body.match(/(?:Total|Net Amount|Amount)[^\n:]*[:\s₹]?\s?(Rs|₹)?\s?[\d,]+(?:\.\d{2})?/i);
          if (!amountMatch) {
            amountMatch = body.match(/(?:Rs|₹)\s?[0-9,]+(?:\.\d{2})?/) || ['N/A'];
          }

          let vendorMatch = body.match(/Vendor[:\-]?\s*([\w\s]+)/i);
          const vendor = vendorMatch ? vendorMatch[1].trim() : 'Viable';

          const safeDate = dateMatch[0] || 'N/A';
          const safeInvoice = invoiceMatch[0] || 'N/A';
          const safeAmount = amountMatch[0] || 'N/A';
          const fileName = `${safeDate}_${vendor}_${safeInvoice}_${safeAmount}.${ext}`;

          const savedFile = folder.createFile(attachment.copyBlob()).setName(fileName);
          const fileUrl = savedFile.getUrl();

          sheet.appendRow([
            new Date(),
            safeDate,
            safeInvoice,
            safeAmount,
            vendor,
            fileUrl,
            contentType
          ]);
        } catch (error) {
          Logger.log(' Error processing attachment: ' + error);
        }
      });

      try {
        message.markRead();
        thread.addLabel(label);
      } catch (e) {
        Logger.log(' Failed to mark as read or label: ' + e);
      }
    });
  });
}

//  Utility: Get or create Gmail label
function getOrCreateLabel(name) {
  let label = GmailApp.getUserLabelByName(name);
  if (!label) {
    label = GmailApp.createLabel(name);
  }
  return label;
}

// Google Vision OCR API Call
function extractTextFromImageBase64(base64Image) {
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;
  const payload = {
    requests: [{
      image: {
        content: base64Image
      },
      features: [{ type: "TEXT_DETECTION" }]
    }]
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    const text = json.responses[0].fullTextAnnotation
      ? json.responses[0].fullTextAnnotation.text
      : 'No text found';
    return text;
  } catch (error) {
    Logger.log(" Vision API Error: " + error);
    return 'OCR error';
  }
}
