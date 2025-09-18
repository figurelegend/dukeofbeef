// Updated Google Apps Script - Copy this to your Apps Script editor
function doGet(e) {
  try {
    // Replace with your actual Google Sheet ID (from the URL)
    // Example: If your sheet URL is:
    // https://docs.google.com/spreadsheets/d/1ABC123xyz/edit
    // Then your SHEET_ID is: 1ABC123xyz
    const SHEET_ID = 'YOUR_SHEET_ID_HERE';

    // Change 'Sheet1' if your sheet has a different name
    const SHEET_NAME = 'Sheet1';

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error('Sheet not found. Check sheet name: ' + SHEET_NAME);
    }

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