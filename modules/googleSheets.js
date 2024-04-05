/**
 * 
 * This module contains helper functions to interact with Google Sheets API.
 * modules/googleSheets.js
 * 
 */

/** 
 * The columnNameToIndex function converts a column name (like "A" or "AB") to a column 
 * index (0 or 27). It's used to map the column names from the settings to their corresponding 
 * indexes in the sheet. 
 **/
export function columnNameToIndex(columnName) {
  let columnIndex = 0;
  for (let i = 0; i < columnName.length; i++) {
    columnIndex = columnIndex * 26 + columnName.charCodeAt(i) - 'A'.charCodeAt(0) + 1;
  }
  
  return columnIndex - 1;
}

// Fetch sheet data from the Google Sheets API
export async function fetchSheetData(authToken, spreadsheetId) {
  const sheetName = 'Sheet3';
  //const range = 'A:Z';

  //const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!${range}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data;
}


// Parse sheet data to extract the LinkedIn URLs
export function parseSheetData(sheetData, linkedinURLColumnIndex, reviewCountColumnIndex, reviewRatingColumnIndex, bioColumnIndex, experienceColumnIndex) {
  const leads = [];

  if (Array.isArray(sheetData.values)) {
    // Start from index 1 to skip the column headers
    for (let index = 1; index < sheetData.values.length; index++) {
      const row = sheetData.values[index];
      const linkedInUrl = row[linkedinURLColumnIndex];

      const reviewCount = row[reviewCountColumnIndex] || '';
      const reviewRating = row[reviewRatingColumnIndex] || '';

      const bio = row[bioColumnIndex] || '';
      const experience = row[experienceColumnIndex] || '';

      leads.push({
        row: index + 2,
        linkedInUrl,
        reviewCount,
        reviewRating,
        bio,
        experience
      });
    }
  } else {
    throw new Error('Invalid sheet data');
  }

  return leads;
}

// Update the Google Sheet with the generated icebreaker
export async function updateSheetData(authToken, spreadsheetId, rowIndex, icebreaker, icebreakerColumn) {
  const sheetName = 'Sheet1';
  const adjustedRowIndex = rowIndex - 1; // Subtract 1 from rowIndex
  const cellRange = `${sheetName}!${icebreakerColumn}${adjustedRowIndex}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${cellRange}?valueInputOption=RAW`;

  const body = {
    range: cellRange,
    values: [[icebreaker]],
  };

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data;
}




// Converts a column index to a column name (e.g., 27 to 'AA')
function indexToColumnName(index) {
  let columnName = '';
  while (index > 0) {
      const remainder = (index - 1) % 26;
      columnName = String.fromCharCode(65 + remainder) + columnName;
      index = (index - remainder) / 26;
  }
  return columnName;
}

export async function updateSpreadsheetColumns(authToken, spreadsheetId, sheetName, rowIndex, bio, experience, bioColumn, experienceColumn) {
  // Decrease the rowIndex by 1 to match the array indexing (0-indexed)
  const adjustedRowIndex = rowIndex - 1;

  // Construct the URL for the batchUpdate endpoint
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;

  // Create the request body for batchUpdate operation
  const body = {
    valueInputOption: 'USER_ENTERED', // Ensure the input is treated as a user would type it
    data: [
      {
        range: `${sheetName}!${bioColumn}${adjustedRowIndex}`,
        values: [[bio]]
      },
      {
        range: `${sheetName}!${experienceColumn}${adjustedRowIndex}`,
        values: [[experience]]
      }
    ]
  };

  // Make the POST request to the batchUpdate endpoint
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(body),
  });

  // Parse the response from the API
  const responseData = await response.json();

  // Throw an error if there was a problem with the batch update
  if (responseData.error) {
    throw new Error(responseData.error.message);
  }

  // Return the API response
  return responseData;
}
