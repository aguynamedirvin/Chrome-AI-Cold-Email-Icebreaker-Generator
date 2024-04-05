/**
 * 
 * This file contains the main logic for the extension popup.
 * popup.js
 * 
 */

import { getStoredSettings, loadSettings } from './modules/settings.js';
import { getAuthToken } from './modules/googleAuth.js';
import { fetchSheetData, parseSheetData, updateSheetData, updateSpreadsheetColumns, columnNameToIndex } from './modules/googleSheets.js';
import { createTab } from './modules/createTab.js';
import { formatPositions, extractIcebreaker, generateIcebreaker } from './modules/openAI.js';


const status = document.getElementById('status');


// Save settings event listener
document.getElementById('save-settings').addEventListener('click', () => {
  const openaiApiKey = document.getElementById('openai-api-key').value;
  const spreadsheetId = document.getElementById('spreadsheet-id').value;
  const sheetName = document.getElementById('sheet-name').value;
  const linkedinURLColumn = document.getElementById('linkedin-profile-url-column').value;
  const icebreakerColumn = document.getElementById('icebreaker-column').value;
  const reviewCountColumn = document.getElementById('review-count-column').value;
  const reviewRatingColumn = document.getElementById('rating-column').value;
  
  const bioColumn = document.getElementById('bio-column').value;
  const experienceColumn = document.getElementById('experience-column').value;

  if (!openaiApiKey || !spreadsheetId) {
    status.classList.add('error');
    status.classList.remove('success');
    status.textContent = 'Please fill in all the required fields.';
    //return;
  }

  // Store the API keys and spreadsheetId for future use
  chrome.storage.local.set({
    openaiApiKey,
    spreadsheetId,
    sheetName,
    linkedinURLColumn,
    icebreakerColumn,
    reviewCountColumn,
    reviewRatingColumn,

    bioColumn,
    experienceColumn
  });

  status.classList.remove('error');
  status.classList.add('success');
  status.textContent = 'Settings saved successfully!';
});


// Main event listener for generating icebreakers
document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('generate-icebreakers').addEventListener('click', async () => {
    console.log('Generate icebreakers button clicked');

    try {
      const { openaiApiKey, spreadsheetId, sheetName, linkedinURLColumn, icebreakerColumn, reviewCountColumn, reviewRatingColumn, bioColumn, experienceColumn } = await getStoredSettings();

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

        const bioColumnIndex = columnNameToIndex(bioColumn);
        const experienceColumnIndex = columnNameToIndex(experienceColumn);

        const leads = parseSheetData(sheetData, linkedinURLColumnIndex, reviewCountColumnIndex, reviewRatingColumnIndex, bioColumnIndex, experienceColumnIndex);
        console.log('Parsed leads:', leads);

        for (const lead of leads) {

          if (lead.bio === '' && lead.experience === '') {
            console.log(`Lead ${lead.row} already has bio and experience, skipping...`);
            status.textContent = `Lead ${lead.row} already has bio and experience, skipping...`;
            
            console.log('Processing lead with LinkedIn URL:', lead.linkedInUrl);
            const { profileData, createdTab } = await createTab(lead.linkedInUrl);
          
            if (!profileData) {
              console.log('Profile data not found, skipping...');
              chrome.tabs.remove(createdTab);
              continue;
            }
          
            console.log('Profile data:', profileData);
          
            // Assuming profileData contains bio and experience information
            const bio = profileData.bio || 'No bio found';
            const experience = formatPositions(profileData.positions); // Ensure you have a function to format experience data properly
          
            // Write the bio and experience to the Google Sheet
            await updateSpreadsheetColumns(token, spreadsheetId, sheetName, lead.row, bio, experience, bioColumn, experienceColumn);
            console.log('Bio and experience updated in spreadsheet');
            continue;

            // Close the tab after processing
            console.log('Closing tab with ID:', createdTab);
            chrome.tabs.remove(createdTab);

          }

          /*console.log('Processing lead with LinkedIn URL:', lead.linkedInUrl);
          const { profileData, createdTab } = await createTab(lead.linkedInUrl);
        
          if (!profileData) {
            console.log('Profile data not found, skipping...');
            chrome.tabs.remove(createdTab);
            continue;
          }
        
          console.log('Profile data:', profileData);
        
          // Assuming profileData contains bio and experience information
          const bio = profileData.bio || 'No bio found';
          const experience = formatPositions(profileData.positions); // Ensure you have a function to format experience data properly
        
          // Write the bio and experience to the Google Sheet
          await updateSpreadsheetColumns(token, spreadsheetId, sheetName, lead.row, bio, experience, bioColumn, experienceColumn);
          console.log('Bio and experience updated in spreadsheet');*/
        
          
        }
        

        /*for (const lead of leads) {
          console.log('Processing lead...');

          try {
            console.log('Processing lead with LinkedIn URL:', lead.linkedInUrl);
            const { profileData, createdTab } = await createTab(lead.linkedInUrl);

            if (!profileData) {
              console.log('Profile data not found, skipping...');
              chrome.tabs.remove(createdTab);
              continue;
            }

            console.log('Profile data:', profileData);

            // Assuming profileData contains bio and experience information
            const bio = profileData.bio || 'No bio found';
            const experience = profileData.experience || 'No experience listed';
            console.log('Bio:', bio);
            console.log('Experience:', experience);

            // Extract relevant data from the page content and generate the icebreaker here.
            //console.log('Sending to OpenAI...');
            //const icebreaker = await generateIcebreaker(openaiApiKey, profileData, lead.reviewCount, lead.reviewRating);


            await updateSpreadsheetColumns(token, spreadsheetId, lead.row);
            console.log('Bio and experience updated in spreadsheet');

            // Update the Google Sheet with the generated icebreaker
            //await updateSheetData(token, spreadsheetId, lead.row, icebreaker, icebreakerColumn);

            // Close the tab
            console.log('Closing tab with ID:', createdTab);
            chrome.tabs.remove(createdTab);
          } catch (error) {
            console.error('Error processing lead:', error);
          }
        }*/


        alert('Successfully generated icebreakers!');
      });
    } catch (error) {
      alert(error);
      status.textContent = 'An error occurred. Please check the console for details.';
    }
  });
});

loadSettings();