// modules/settings.js

// Get stored settings from the local storage
export async function getStoredSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get([
        'openaiApiKey', 
        'spreadsheetId',
        'sheetName',
        'linkedinURLColumn', 
        'icebreakerColumn', 
        'reviewCountColumn', 
        'reviewRatingColumn', 
        'bioColumn',
        'experienceColumn'
      ], (result) => {
      resolve(result);
    });
  });
}


// Load settings on script execution
export async function loadSettings() {
  const { openaiApiKey, spreadsheetId, sheetName, linkedinURLColumn, icebreakerColumn, reviewCountColumn, reviewRatingColumn, bioColumn, experienceColumn } = await getStoredSettings();

  if (openaiApiKey) {
    document.getElementById('openai-api-key').value = openaiApiKey;
  }

  if (spreadsheetId) {
    document.getElementById('spreadsheet-id').value = spreadsheetId;
  }

  if (sheetName) {
    document.getElementById('sheet-name').value = sheetName;
  }

  if (linkedinURLColumn) {
    document.getElementById('linkedin-profile-url-column').value = linkedinURLColumn;
  }

  if (icebreakerColumn) {
    document.getElementById('icebreaker-column').value = icebreakerColumn;
  }

  if (reviewCountColumn) {
    document.getElementById('review-count-column').value = reviewCountColumn;
  }

  if (reviewRatingColumn) {
    document.getElementById('rating-column').value = reviewRatingColumn;
  }

  if (bioColumn) {
    document.getElementById('bio-column').value = bioColumn;
  }

  if (experienceColumn) {
    document.getElementById('experience-column').value = experienceColumn;
  }
}