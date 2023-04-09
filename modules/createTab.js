// Implement the logic for scraping LinkedIn data
console.log('Content script loaded.');

// Create a tab and inject the content script
export function createTab(url) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url, active: false }, (createdTab) => {
      console.log('Opening url...');
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (info.status === 'complete' && tabId === createdTab.id) {
          chrome.tabs.get(tabId, (tab) => {
            
            // Check for 404 and move to next profile 
            if (tab.url.includes('/404')) {
              console.log('Page not found (404). Moving to the next profile...');
              // Close the current tab and reject the promise
              chrome.tabs.remove(tabId);
              reject(new Error('Page not found (404).'));
            } else {
              chrome.tabs.onUpdated.removeListener(listener);

              console.log('Injecting script...');
              
              chrome.scripting.executeScript(
                {
                  target: { tabId: createdTab.id },
                  files: ['modules/linkedinProfileScrapper.js'],
                },
                (injectionResults) => {
                  if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                    return;
                  }
                  console.log('Script injected:', injectionResults);

                  const port = chrome.tabs.connect(tabId, { name: 'linkedinProfileScrapper' });
                  port.postMessage({ action: 'scrapeLinkedInProfile' });

                  port.onMessage.addListener((response) => {
                    console.log('Name:', response.fullName);
                    console.log('Bio:', response.tagLine);
                    console.log('Location:', response.contactLocation);
                    console.log('About:', response.contactAbout);
                    console.log('Positions:', response.positions);

                    resolve({ profileData: response, createdTab });
                  });

                  port.onDisconnect.addListener((port) => {
                    if (chrome.runtime.lastError) {
                      console.error(chrome.runtime.lastError);
                      reject(chrome.runtime.lastError);
                      return;
                    }
                  });
                }
              );
            }
          });
        }
      });
    });
  });
}

