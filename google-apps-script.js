// This code goes in Google Apps Script, not in your website
// 1. Open your Google Sheet
// 2. Extensions → Apps Script
// 3. Paste this code
// 4. Deploy → New Deployment → Web app
// 5. Execute as: Me
// 6. Who has access: Anyone

function doGet(e) {
  try {
    // Replace with your Google Sheet ID
    const SHEET_ID = 'YOUR_SHEET_ID_HERE';
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Sheet1');

    // Get all data
    const data = sheet.getDataRange().getValues();

    // Convert to JSON
    const jsonData = {
      success: true,
      values: data
    };

    // Return as JSON with CORS headers
    return ContentService
      .createTextOutput(JSON.stringify(jsonData))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}