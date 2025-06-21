// Google Apps Script code for QC Issues
// Deploy this as a web app with "Execute as: Me" and "Who can access: Anyone"

function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    console.log('Received QC data:', data);
    
    // Open your spreadsheet
    const spreadsheetId = '1CNDRfgqSdMEyc0JgW6DerCRX1jUftWSX49nsiBPUbek';
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    
    // Get or create the QC_Issues sheet
    let sheet = spreadsheet.getSheetByName('QC_Issues');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('QC_Issues');
      // Add headers
      const headers = ['Audio File', 'Text', 'Voice', 'Activity Type', 'Set', 'Issue Type', 'Severity', 'Date Flagged', 'Status'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    
    // Prepare the data rows
    const rows = data.issues.map(issue => [
      issue.audioFile || 'N/A',
      issue.text || 'N/A',
      issue.voice || 'female',
      issue.activityType || 'N/A',
      issue.set || 'N/A',
      issue.issueType || 'unclear_pronunciation',
      issue.severity || 'Medium',
      issue.dateFlagged || new Date().toISOString(),
      'New'
    ]);
    
    // Append the data to the sheet
    if (rows.length > 0) {
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow + 1, 1, rows.length, 9).setValues(rows);
      console.log(`Added ${rows.length} rows to QC_Issues sheet`);
    }
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: `Successfully added ${rows.length} QC issues`,
        rowsAdded: rows.length
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
  } catch (error) {
    console.error('Error processing QC data:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}

function doGet(e) {
  // Handle preflight requests
  return ContentService
    .createTextOutput('QC Issues API is running')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function doOptions(e) {
  // Handle preflight OPTIONS request
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '3600');
}