// COPY THIS ENTIRE CODE TO YOUR GOOGLE APPS SCRIPT
// This version has YOUR Sheet ID already configured

function doGet(e) {
  try {
    // Your Sheet ID from the URL you provided
    const SHEET_ID = '15mYSywI_J-fn4I_cvfVo7NMFBXArn-XeUamjwmkiVXk';

    // Using 'Retail' - your sheet tab name
    const SHEET_NAME = 'Retail';

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