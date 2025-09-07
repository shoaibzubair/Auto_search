let searchTerms = [
    "interior design", "wedding planning", "small business ideas", "parenting tips", "retirement planning", "online courses", "digital marketing", "podcast recommendations", "yoga poses", "wine tasting", "budget travel", "freelancing opportunities", "sustainable fashion", "plant-based recipes", "graphic design", "social media trends", "public speaking", "time management", "creative writing", "outdoor activities", "antique collecting", "skincare routines", "jewelry making", "woodworking projects", "beard grooming", "nail art", "hairstyle trends", "makeup tutorials", "board game reviews", "puzzle solutions", "craft beer", "coffee brewing", "tea ceremonies", "cheese making", "bread baking", "fermentation", "urban planning", "architecture styles", "real estate trends", "rental property", "insurance options", "tax strategies", "scholarship opportunities", "study abroad", "networking events", "job interviews", "resume writing", "salary negotiation", "workplace productivity", "team building", "leadership skills", "conflict resolution", "customer service", "sales techniques", "marketing automation", "content creation", "SEO strategies", "web development", "database design", "cloud computing", "machine learning", "data visualization", "statistical analysis", "research methods", "academic writing", "scientific publications", "patent applications", "innovation management", "startup funding", "venture capital", "crowdfunding", "business partnerships", "supply chain", "logistics management", "quality control", "project management", "risk assessment", "compliance regulations", "environmental law", "intellectual property", "contract negotiation", "dispute resolution", "mediation services", "legal research", "court procedures", "immigration law", "family law", "estate planning", "elder care", "disability resources", "addiction recovery", "grief counseling", "relationship advice", "dating tips", "marriage counseling", "child development", "educational psychology", "learning disabilities", "special needs support", "autism resources", "ADHD management", "anxiety treatment", "depression help"
];

const TOTAL_SEARCHES = 5; // Easy to change to 20 later
const SEARCH_INTERVAL = 9000; // 9 seconds in milliseconds

let currentSearchCount = 0;
let searchTabId = null;
let isSearching = false;

// Function to shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Function to perform a single search using Bing search bar
async function performSearch(tabId, searchTerm, searchNumber) {
  try {
    console.log(`Performing search ${searchNumber}/${TOTAL_SEARCHES}: ${searchTerm}`);
    
    // First make sure we're on Bing
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url.includes('bing.com')) {
      await chrome.tabs.update(tabId, { url: 'https://www.bing.com/' });
      // Wait for Bing to load
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Now inject script to use the search bar
    await chrome.scripting.executeScript({
      target: {tabId: tabId},
      func: (term) => {
        return new Promise((resolve, reject) => {
          try {
            // Function to find the search input field
            function findSearchInput() {
              const selectors = [
                '#sb_form_q', // Standard Bing search input
                'input[name="q"]', // General query input
                'input[type="search"]', // Any search input
                'input.b_searchbox', // Bing search box class
                '#searchbox' // Another possible ID
              ];
              
              for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) return element;
              }
              return null;
            }
            
            // Find the search input
            const searchInput = findSearchInput();
            
            if (!searchInput) {
              throw new Error("Could not find search input field");
            }
            
            // Clear any existing value and focus
            searchInput.value = '';
            searchInput.focus();
            
            // Insert the search term
            searchInput.value = term;
            
            // Dispatch input event
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Small delay to simulate typing, then submit
            setTimeout(() => {
              // Find the search button
              const searchButton = document.querySelector('#search_icon') || 
                                  document.querySelector('button[type="submit"]') ||
                                  document.querySelector('#sb_form_go');
              
              if (searchButton) {
                searchButton.click();
                resolve(true);
              } else {
                // Try submitting the form
                const form = document.querySelector('#sb_form') || document.querySelector('form');
                if (form) {
                  form.submit();
                  resolve(true);
                } else {
                  // Last resort - simulate Enter key
                  searchInput.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true
                  }));
                  resolve(true);
                }
              }
            }, 500);
          } catch (err) {
            reject(err);
          }
        });
      },
      args: [searchTerm]
    });
    
    console.log(`Search ${searchNumber} completed successfully`);
    
  } catch (error) {
    console.error(`Error during search ${searchNumber}:`, error);
  }
}

// Main function to start the automated searches
async function startAutomaticSearches() {
  if (isSearching) {
    console.log("Searches already in progress, skipping...");
    return;
  }
  
  isSearching = true;
  currentSearchCount = 0;
  
  console.log(`Starting automatic searches at: ${new Date().toLocaleString()}`);
  console.log(`Will perform ${TOTAL_SEARCHES} searches with ${SEARCH_INTERVAL/1000} second intervals`);
  
  try {
    // Create a new tab for searches
    const searchTab = await chrome.tabs.create({ 
      url: "https://www.bing.com/", 
      active: true 
    });
    searchTabId = searchTab.id;
    
    // Wait for tab to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get randomized search terms
    const randomizedTerms = shuffleArray(searchTerms).slice(0, TOTAL_SEARCHES);
    
    // Perform searches sequentially
    for (let i = 0; i < TOTAL_SEARCHES; i++) {
      currentSearchCount = i + 1;
      const searchTerm = randomizedTerms[i];
      
      await performSearch(searchTabId, searchTerm, currentSearchCount);
      
      // Wait before next search (except for the last search)
      if (i < TOTAL_SEARCHES - 1) {
        console.log(`Waiting ${SEARCH_INTERVAL/1000} seconds before next search...`);
        await new Promise(resolve => setTimeout(resolve, SEARCH_INTERVAL));
      }
    }
    
    console.log(`All ${TOTAL_SEARCHES} searches completed at: ${new Date().toLocaleString()}`);
    
    // After all searches are complete, visit rewards page and execute reward automation
    await automateRewards(searchTabId);
    
  } catch (error) {
    console.error("Error during automatic searches:", error);
  } finally {
    isSearching = false;
  }
}

// Function to automate Bing rewards after searches complete
async function automateRewards(tabId) {
  try {
    console.log("Starting Bing rewards automation...");
    
    // Navigate to rewards page
    await chrome.tabs.update(tabId, { url: 'https://rewards.bing.com/' });
    
    // Wait for rewards page to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Execute the rewards clicking script
    await chrome.scripting.executeScript({
      target: {tabId: tabId},
      func: () => {
        return new Promise((resolve) => {
          console.log("Starting rewards automation script...");
          
          const rewardLinks = document.querySelectorAll('#more-activities a.ds-card-sec');
          console.log(`Found ${rewardLinks.length} reward activities`);
          
          if (rewardLinks.length === 0) {
            console.log("No reward activities found");
            resolve(0);
            return;
          }
          
          let i = 0;
          function clickNextReward() {
            if (i < rewardLinks.length) {
              console.log(`Clicking reward activity ${i + 1}/${rewardLinks.length}`);
              rewardLinks[i].click();
              i++;
              setTimeout(clickNextReward, 4000); // 4 seconds delay
            } else {
              console.log("All reward activities completed");
              resolve(rewardLinks.length);
            }
          }
          
          clickNextReward();
        });
      }
    });
    
    console.log("Bing rewards automation completed successfully");
    
  } catch (error) {
    console.error("Error during rewards automation:", error);
  }
}

// Start searches automatically when extension loads or browser starts
chrome.runtime.onStartup.addListener(() => {
  console.log("Browser started, initiating automatic searches...");
  // Small delay to ensure everything is loaded
  setTimeout(startAutomaticSearches, 3000);
});

// Start searches when extension is installed or enabled
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed/enabled, initiating automatic searches...");
  // Small delay to ensure everything is loaded
  setTimeout(startAutomaticSearches, 3000);
});

// Also start searches when service worker becomes active (for Edge compatibility)
chrome.runtime.onSuspend.addListener(() => {
  console.log("Service worker suspending...");
});

// Additional trigger - start searches when any tab is created (as a fallback)
chrome.tabs.onCreated.addListener((tab) => {
  // Only trigger once and only if not already searching
  if (!isSearching && currentSearchCount === 0) {
    console.log("New tab created, checking if we should start searches...");
    setTimeout(() => {
      if (!isSearching && currentSearchCount === 0) {
        startAutomaticSearches();
      }
    }, 1000);
  }
});

// For debugging - manual trigger (can be removed later)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startSearches") {
    startAutomaticSearches();
  } else if (message.action === "getStatus") {
    sendResponse({
      isSearching: isSearching,
      currentSearchCount: currentSearchCount,
      totalSearches: TOTAL_SEARCHES
    });
  }
});