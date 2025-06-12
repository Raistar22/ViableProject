// Google Sheet ID where data will be logged
const SHEET_ID = '1RBWCJKHdC1_saHF6_IHg6t-D4SSS_1tgwq9pUuOA3Q8';

//  Google Drive folder ID where attachments will be saved
const FOLDER_ID = '1ZwyhDlvEQRduoY7qpULy1fTa_BRU6Y44';

//  Email subject filter to fetch only required emails
const EMAIL_SUBJECT_FILTER = 'subject:"Viable: Trial Document"';

//  Label name to mark processed emails
const LABEL_NAME = 'Processed';

function processViableEmails() {
  let sheet, folder, label;

  try {
    //  Access the Google Sheet, Drive folder, and label
    sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    folder = DriveApp.getFolderById(FOLDER_ID);
    label = getOrCreateLabel(LABEL_NAME);
  } catch (e) {
    Logger.log(' Error accessing Sheet or Drive: ' + e);
    return;
  }

  //  Search for unprocessed email threads with specific subject
  const threads = GmailApp.search(`${EMAIL_SUBJECT_FILTER} -label:${LABEL_NAME}`);
  if (threads.length === 0) {
    Logger.log(' No matching emails found.');
    return;
  }

  // 📨 Loop through each email thread
  threads.forEach(thread => {
    const messages = thread.getMessages();

    messages.forEach(message => {
      const attachments = message.getAttachments();

      //  Skip messages with no attachments
      if (!attachments || attachments.length === 0) {
        Logger.log(' Skipping message with no attachments.');
        return;
      }

      // 📎 Loop through each attachment
      attachments.forEach(attachment => {
        const ext = attachment.getName().split('.').pop().toLowerCase();
        const contentType = attachment.getContentType();

        //  Skip unsupported file types
        if (!['pdf', 'jpg', 'jpeg', 'png', 'eml'].includes(ext)) {
          Logger.log(' Unsupported file type: ' + ext);
          return;
        }

        try {
          const body = message.getPlainBody(); //  Extract plain text body from the email

          //  Extract invoice/bill date
          const dateMatch = body.match(/\d{2}\.\d{2}\.\d{2}/) || ['N/A'];

          //  Extract invoice number
          const invoiceMatch = body.match(/INV[\dA-Z\-]+/) || ['N/A'];

          //  Try to find the final amount using keywords like "Total" or "Net Amount"
          let amountMatch = body.match(/(?:Total|Net Amount|Amount)[^\n:]*[:\s₹]?\s?(Rs|₹)?\s?[\d,]+(?:\.\d{2})?/i);
          if (!amountMatch) {
            amountMatch = body.match(/(?:Rs|₹)\s?[0-9,]+(?:\.\d{2})?/) || ['N/A'];
          }

          //  Extract vendor/company name (default to "Viable")
          let vendorMatch = body.match(/Vendor[:\-]?\s*([\w\s]+)/i);
          const vendor = vendorMatch ? vendorMatch[1].trim() : 'Viable';

          //  Construct a formatted file name
          const safeDate = dateMatch[0] || 'N/A';
          const safeInvoice = invoiceMatch[0] || 'N/A';
          const safeAmount = amountMatch[0] || 'N/A';
          const fileName = `${safeDate}_${vendor}_${safeInvoice}_${safeAmount}.${ext}`;

          //  Save file to Drive with custom name
          const savedFile = folder.createFile(attachment.copyBlob()).setName(fileName);
          const fileUrl = savedFile.getUrl(); // 🔗 Get shareable URL

          //  Append metadata to the Google Sheet
          sheet.appendRow([
            new Date(),        // Timestamp
            safeDate,          // Invoice/Bill Date
            safeInvoice,       // Invoice/Bill Number
            safeAmount,        // Amount
            vendor,            // Vendor/Company Name
            fileUrl,           // Drive File URL
            contentType        // File MIME Type
          ]);
        } catch (error) {
          Logger.log(' Error processing attachment: ' + error);
        }
      });

      try {
        //  Mark message as read and apply label to avoid reprocessing
        message.markRead();
        thread.addLabel(label);
      } catch (e) {
        Logger.log(' Failed to mark as read or label: ' + e);
      }
    });
  });
}

// 🔧 Utility: Get existing label or create if it doesn't exist
function getOrCreateLabel(name) {
  let label = GmailApp.getUserLabelByName(name);
  if (!label) {
    label = GmailApp.createLabel(name);
  }
  return label;
}
