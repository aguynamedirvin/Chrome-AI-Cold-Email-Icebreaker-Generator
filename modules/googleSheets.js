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
  const sheetName = 'Sheet1';
  const range = 'A:Z';

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!${range}`;

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
export function parseSheetData(sheetData, linkedinURLColumnIndex, reviewCountColumnIndex, reviewRatingColumnIndex) {
  const leads = [];

  if (Array.isArray(sheetData.values)) {
    // Start from index 1 to skip the column headers
    for (let index = 1; index < sheetData.values.length; index++) {
      const row = sheetData.values[index];
      const linkedInUrl = row[linkedinURLColumnIndex];

      const reviewCount = row[reviewCountColumnIndex] || '';
      const reviewRating = row[reviewRatingColumnIndex] || '';

      leads.push({
        row: index + 2,
        linkedInUrl,
        reviewCount,
        reviewRating
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