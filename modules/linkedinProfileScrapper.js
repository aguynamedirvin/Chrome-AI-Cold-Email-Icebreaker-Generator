// Implement loginc for scrapping LinkedInProfile
console.log('Content script loaded.');

// Establish a connection to the background script
chrome.runtime.onConnect.addListener((port) => {
  console.log('Connected to background script:', port);

  port.onMessage.addListener((request) => {
    console.log('Message received:', request);

    if (request.action === 'scrapeLinkedInProfile') {
      console.log('Getting content...');
      scrollToBottom(() => {
        waitForElement('main.scaffold-layout__main .pv-text-details__left-panel h1', () => {
          port.postMessage(scrapeProfile());
        });
      });
    }
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
  try {
    const fullName = getTextContent('main.scaffold-layout__main .pv-text-details__left-panel h1');
    const tagLine = getTextContent('main.scaffold-layout__main .pv-text-details__left-panel .text-body-medium.break-words');
    const contactLocation = getTextContent('main.scaffold-layout__main .pv-text-details__left-panel span.text-body-small.inline.t-black--light.break-words');
    const currentCompany = getTextContent('main.scaffold-layout__main .pv-text-details__right-panel li:first-of-type span div.inline-show-more-text');

    const contactAbout = getContactAbout();
    const positions = getPositions();

    console.log('Sending response...');
    return { fullName, tagLine, contactLocation, currentCompany, contactAbout, positions };
  } catch (error) {
    console.error('Error while sending response:', error);
  }
}

// Helper Functions
function getTextContent(selector) {
  const element = document.querySelector(selector);
  return element ? element.textContent : '';
}

function getContactAbout() {
  const aboutElement = document.getElementById('about');
  let contactAbout = '';

  if (aboutElement) {
    const aboutSection = aboutElement.closest('section');
    const container = aboutSection.querySelector('.pv-shared-text-with-see-more .inline-show-more-text');
    const spans = container.querySelectorAll('span');
    contactAbout = spans[0].textContent.trim();
  }

  return contactAbout;
}

function getPositions() {
  const experienceSection = document.querySelector('#experience').parentElement;
  const experienceList = experienceSection.querySelectorAll('.pvs-list__item--line-separated');
  const positions = [];

  experienceList.forEach(item => {
    const positionElement = item.querySelector('.mr1.t-bold span[aria-hidden="true"]');
    const companyElement = item.querySelector('.t-14.t-normal:not(.t-black--light) span[aria-hidden="true"]');
    const durationElement = item.querySelector('.t-14.t-normal.t-black--light span[aria-hidden="true"]');
    const locationElement = item.querySelector('.t-14.t-normal.t-black--light:nth-child(4) span[aria-hidden="true"]');

    const position = positionElement ? positionElement.textContent : '';
    const company = companyElement ? companyElement.textContent : '';
    const duration = durationElement ? durationElement.textContent : '';
    const location = locationElement ? locationElement.textContent : '';

    positions.push({
      position: position.trim(),
      company: company.trim(),
      duration: duration.trim(),
      location: location.trim()
    });
  });

  return positions;
}
