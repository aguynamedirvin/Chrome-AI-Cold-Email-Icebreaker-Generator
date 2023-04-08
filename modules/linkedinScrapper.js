// Implement the logic for scraping LinkedIn data
console.log('Content script loaded.');

// Create a tab and inject the content script
export function createTab(url) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url, active: false }, (createdTab) => {
      console.log('Opening url...');
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (info.status === 'complete' && tabId === createdTab.id) {
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
                console.log('Full name:', response.fullName);
                console.log('Tag line:', response.tagLine);
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
    });
  });
}

