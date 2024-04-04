/** 
 * 
 * Description: This module is responsible for scrapping LinkedIn profile.
 * modules/linkedinProfileScrapper.js
 * 
 **/ 

// Implement loginc for scrapping LinkedInProfile
console.log('Content script loaded.');

// Establish a connection to the background script
// Establish a connection to the background script
let port = null;
chrome.runtime.onConnect.addListener((p) => {
  console.log('Connected to background script:', p);
  port = p;

  port.onMessage.addListener((request) => {
    console.log('Message received:', request);

    if (request.action === 'scrapeLinkedInProfile') {
      console.log('Getting content...');
      scrollToBottom(() => {
        waitForElement('main.scaffold-layout__main h1', () => {
          if (port) {
            try {
              port.postMessage(scrapeProfile());
            } catch (error) {
              console.error('Error posting message:', error);
            }
          } else {
            console.log('Port is disconnected.');
          }
        });
      });
    }
  });

  // Handle port disconnection
  port.onDisconnect.addListener(() => {
    console.log('Port disconnected');
    port = null;
  });
});


// Scroll to the bottom of the page and then call the callback
function scrollToBottom(callback) {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  setTimeout(callback, 3000);
}

// Wait for an element to be available and then call the callback
function waitForElement(selector, callback) {
  const element = document.querySelector(selector);
  if (element) {
    console.log('Element found:', element);
    callback();
  } else {
    const observer = new MutationObserver((mutations, observer) => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        callback();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}



// Scrape the LinkedIn profile
function scrapeProfile() {
  let bioText = ''; // Declare bioText outside of the if block to widen its scope
  const positions = [];

  try {
    const h2Elements = document.querySelectorAll('h2');
    console.log('h2Elements:', h2Elements);

    // Get the bio text
    const aboutH2 = Array.from(h2Elements).find(h2 => h2.textContent.includes('About'));
    if (aboutH2) {
      const aboutContainer = aboutH2.closest('.pv-profile-card');
      const bioElement = aboutContainer.querySelector('.pv-shared-text-with-see-more');
      bioText = bioElement ? bioElement.textContent.trim() : '';
      console.log('Bio:', bioText);
    }

    // Get the positions
    const experienceH2 = Array.from(h2Elements).find(h2 => h2.textContent.includes('Experience'));

    if (experienceH2) {
      const experienceContainer = experienceH2.closest('.pv-profile-card');
      const experienceItems = experienceContainer.querySelectorAll('.pvs-list__outer-container .artdeco-list__item');

      experienceItems.forEach(item => {
        const title = item.querySelector('.display-flex .t-bold span')?.textContent.trim() || '';
        const company = item.querySelector('.t-14.t-normal span')?.textContent.trim() || '';
        const duration = item.querySelector('.t-14.t-normal.t-black--light span')?.textContent.trim() || '';
        const descriptionElement = item.querySelector('.pv-shared-text-with-see-more span');
        const description = descriptionElement ? descriptionElement.textContent.trim() : '';

        console.log({
            title,
            company,
            duration,
            description
        });

        positions.push({ title, company, duration, description });
      });
    }

    console.log('Sending response...');
    return { bio: bioText, positions }; // Corrected return statement
  } catch (error) {
    console.error('Error while sending response:', error);
  }
}
