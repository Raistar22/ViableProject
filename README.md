# 📬 Gmail to Google Drive & Google Sheets Automation

This project automates the process of reading specific emails from Gmail, downloading their attachments, storing them into Google Drive with a structured filename, and logging extracted invoice metadata into a Google Sheet — all using Google Apps Script.

---

## 🚀 Workflow Overview

1. **Gmail Parsing**
   - Scans Gmail for emails with subject: `Viable: Trial Document`.
   - Processes only unread and unlabelled emails.
   - Skips emails with no attachments or unsupported file types.

2. **Attachment Handling**
   - Saves attachments into a Google Drive folder named `Viable_Test Documents`.
   - Renames files using this format:  
     ```
     <Date>_<Vendor/CompanyName>_<Invoice/BillNumber>_<TotalAmount>.<extension>
     ```
     Example: `03.06.2025_Viable_INV12345_Rs 40,000.jpg`

3. **Metadata Extraction**
   - Extracts from email body:
     - Invoice Date
     - Vendor Name
     - Invoice/Bill Number
     - Final Amount (prefers `Total`, `Net Amount`, or `Final Amount`)

4. **Google Sheets Logging**
   - Each processed file adds a new row to the Sheet:
     ```
     | Timestamp | Invoice Date | Invoice Number | Amount | Vendor | Drive File URL | File Type |
     ```

5. **Post-processing**
   - Marks the email as read
   - Applies a Gmail label `Processed`
   - Scheduled to run automatically every 3 hours

---

## 📁 Project Links

| Resource        | Link                                                                 |
|----------------|----------------------------------------------------------------------|
| 🔗 Google Sheet | [Click to View](https://docs.google.com/spreadsheets/d/1RBWCJKHdC1_saHF6_IHg6t-D4SSS_1tgwq9pUuOA3Q8/edit?usp=sharing) |
| 🗃 Google Drive Folder | [Click to View](https://drive.google.com/drive/folders/1ZwyhDlvEQRduoY7qpULy1fTa_BRU6Y44?usp=sharing) |
| 🧠 Script Editor | `Code.gs` (in this repo — paste into Google Apps Script Editor)     |

---

## 🛠 How to Run This Project

1. Open [Google Apps Script Editor](https://script.google.com).
2. Create a new project and copy the contents of `Code.gs` into it.
3. Replace `SHEET_ID` and `FOLDER_ID` with your own.
4. Click **Run** → `processViableEmails()` manually once.
5. Authorize the app (you may need to click *Advanced → Go to Unsafe*).
6. Go to **Triggers** → Add a time-driven trigger to run every 3 hours.

---

## 🧠 Technologies Used

- Google Apps Script (JavaScript-based)
- Google Sheets API
- Gmail API
- Google Drive API

---

## 🧪 Sample Output

| Timestamp           | Invoice Date | Invoice Number | Amount    | Vendor | Drive File URL | File Type |
|---------------------|--------------|----------------|-----------|--------|----------------|-----------|
| `2025-06-12 08:00`  | 03.06.2025   | INV12345       | Rs 40,000 | Viable | [View File](https://drive.google.com/...) | image/jpeg |

---

## 📸 Screenshots

> 📂 Viable_Test Documents Folder  
> 📊 Google Sheet Sample Entry  
> 📜 Email Body Sample
> 
![image](https://github.com/user-attachments/assets/d8a33d35-3b40-4e7d-a451-dfea1ad74b76)

![image](https://github.com/user-attachments/assets/f2b78547-ed94-4a94-9dbf-23b4a3b230da)
![image](https://github.com/user-attachments/assets/72b2df0c-dda7-4832-9e0a-7717101dddb8)
![image](https://github.com/user-attachments/assets/a21c714a-247a-486f-af37-11ae0e1425a7)


Sure! Here's a natural-sounding section you can add to your README under the title **"🔍 How Google Vision API Is Used"**, in your tone and writing style:

---

## 🔍 How Google Vision API Is Used

So in this project, I used Google Cloud Vision API to extract text from attachments like invoices that come in as images or PDFs.

Here’s how it works behind the scenes:

* First, the script checks if the attachment is a valid file type (`pdf`, `jpg`, `jpeg`, `png`). If it’s not, we skip it.
* If it's valid, we convert the attachment into a Base64 string using Apps Script’s built-in utilities. This is necessary because the Vision API needs the image in Base64 format.
* Once the image is ready, we send it to the Vision API endpoint using a `POST` request. The API responds with the full extracted text (OCR).
* I then merge this OCR text with the email body and run regex patterns over it to pull out specific info like:

  * Invoice Date (e.g., `03.06.2025`)
  * Invoice Number (e.g., `INV12345`)
  * Amount (e.g., `₹ 40,000`)
  * Vendor Name (if found)

This is super useful because sometimes the email doesn’t contain all the metadata in the body — it’s only on the invoice image. So OCR ensures we still get the needed details even if the email text is empty or missing parts.

All this is handled inside a function called `extractTextFromImageBase64()`, and it runs automatically for every supported attachment.

If OCR fails or doesn't return any text, I log the error and move on without breaking the whole process.






---

##Error Handlings
| Requirementa                                      | Status ✅ |
| ------------------------------------------------ | -------- |
| Skip emails with no attachments                  | ✅        |
| Skip unsupported file types                      | ✅        |
| Handle Drive or Sheet access errors              | ✅        |
| Log extraction failures and continue             | ✅        |
| Avoid crashing if no matching emails are found   | ✅        |
| Default to `'N/A'` if info missing               | ✅        |
| Extract final amount based on “Total/Net Amount” | ✅        |
| Save file with formatted name                    | ✅        |
| Log everything in Google Sheet                   | ✅        |
| Label and mark emails as read                    | ✅        |


## 🙌 Acknowledgements

Built as a task for a startup interview. Thanks to [Viable] and team for the sample data.

---

## 📄 License

MIT License (you can change this)

---

