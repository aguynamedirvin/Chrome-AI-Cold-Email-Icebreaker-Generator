import { getStoredSettings, loadSettings } from './modules/settings.js';
import { getAuthToken } from './modules/googleAuth.js';
import { fetchSheetData, parseSheetData, updateSheetData, columnNameToIndex } from './modules/googleSheets.js';
import { createTab } from './modules/linkedinScrapper.js';
import { formatPositions, extractIcebreaker, generateIcebreaker } from './modules/openAI.js';


// Save settings event listener
document.getElementById('save-settings').addEventListener('click', () => {
  const openaiApiKey = document.getElementById('openai-api-key').value;
  const spreadsheetId = document.getElementById('spreadsheet-id').value;
  const linkedinURLColumn = document.getElementById('linkedin-profile-url-column').value;
  const icebreakerColumn = document.getElementById('icebreaker-column').value;
  const reviewCountColumn = document.getElementById('review-count-column').value;
  const reviewRatingColumn = document.getElementById('rating-column').value;

  if (!openaiApiKey || !spreadsheetId) {
    alert('Please fill in all the required fields.');
    return;
  }

  // Store the API keys and spreadsheetId for future use
  chrome.storage.local.set({
    openaiApiKey,
    spreadsheetId,
    linkedinURLColumn,
    icebreakerColumn,
    reviewCountColumn,
    reviewRatingColumn
  });

  alert('Settings saved.');
});


// Main event listener for generating icebreakers
document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('generate-icebreakers').addEventListener('click', async () => {
    console.log('Generate icebreakers button clicked');

    try {
      const { openaiApiKey, spreadsheetId, linkedinURLColumn, icebreakerColumn, reviewCountColumn, reviewRatingColumn } = await getStoredSettings();

      // Authenticate with Google using the chrome identity API
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError) {
          alert(chrome.runtime.lastError.message);
          return;
        }
      
        const sheetData = await fetchSheetData(token, spreadsheetId);
        
        console.log('Fetched sheet data:', sheetData);
        console.log('linkedinURLColumn:', linkedinURLColumn);
        console.log('icebreakerColumn:', icebreakerColumn);

        // Get the column indexes
        const linkedinURLColumnIndex = columnNameToIndex(linkedinURLColumn);
        const icebreakerColumnIndex = columnNameToIndex(icebreakerColumn);
        const reviewCountColumnIndex = columnNameToIndex(reviewCountColumn);
        const reviewRatingColumnIndex = columnNameToIndex(reviewRatingColumn);

        const leads = parseSheetData(sheetData, linkedinURLColumnIndex, reviewCountColumnIndex, reviewRatingColumnIndex);
        console.log('Parsed leads:', leads);

        for (const lead of leads) {
          console.log('Processing lead...');

          try {
            console.log('Processing lead with LinkedIn URL:', lead.linkedInUrl);
            const { profileData, createdTab } = await createTab(lead.linkedInUrl);

            if (!profileData) {
              console.log('Profile data not found, skipping...');
              chrome.tabs.remove(createdTab.id);
              continue;
            }

            console.log('Profile data:', profileData);

            // Extract relevant data from the page content and generate the icebreaker here.
            console.log('Sending to OpenAI...');
            const icebreaker = await generateIcebreaker(openaiApiKey, profileData, lead.reviewCount, lead.reviewRating);

            // Update the Google Sheet with the generated icebreaker
            await updateSheetData(token, spreadsheetId, lead.row, icebreaker, icebreakerColumn);

            // Close the tab
            console.log('Closing tab with ID:', createdTab.id);
            chrome.tabs.remove(createdTab.id);
          } catch (error) {
            console.error('Error processing lead:', error);
          }
        }


        alert('Successfully generated icebreakers!');
      });
    } catch (error) {
      alert(error);
      status.textContent = 'An error occurred. Please check the console for details.';
    }
  });
});

loadSettings();








