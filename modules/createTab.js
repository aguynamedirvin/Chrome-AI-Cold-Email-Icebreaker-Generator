console.log('Content script loaded.');

// Create a tab and inject the content script
export function createTab(url) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url, active: false }, (createdTab) => {
      console.log('Opening url...');
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (info.status === 'complete' && tabId === createdTab.id) {
          handleTabCompletion(tabId, listener, resolve, reject);
        }
      });
    });
  });
}

function handleTabCompletion(tabId, listener, resolve, reject) {
  chrome.tabs.get(tabId, (tab) => {
    if (tab.url.includes('/404')) {
      handlePageNotFound(tabId, listener, reject);
    } else {
      handleProfileScraping(tabId, listener, resolve, reject);
    }
  });
}

function handlePageNotFound(tabId, listener, reject) {
  console.log('Page not found (404). Moving to the next profile...');
  chrome.tabs.onUpdated.removeListener(listener);
  chrome.tabs.remove(tabId);
  reject(new Error('Page not found (404).'));
}

function handleProfileScraping(tabId, listener, resolve, reject) {
  chrome.tabs.onUpdated.removeListener(listener);
  console.log('Injecting script...');

  chrome.scripting.executeScript(
    {
      target: { tabId: tabId },
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
        logProfileData(response);
        resolve({ profileData: response, createdTab: tabId });
        chrome.tabs.remove(tabId);
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

function logProfileData(response) {
  console.log('Name:', response.fullName);
  console.log('Bio:', response.tagLine);
  console.log('Location:', response.contactLocation);
  console.log('About:', response.contactAbout);
  console.log('Positions:', response.positions);
}
