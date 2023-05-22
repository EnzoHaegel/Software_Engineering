import '../lineBot.js';

// Function to handle the import schedule functionality
function handleImportSchedule() {
    // Code to handle the import schedule functionality in your extension
  
    // Send a message to the Line bot to notify about the import schedule action
    chrome.runtime.sendMessage({ command: 'import_schedule' });
  }
  
  // Function to handle routing to the cof.ntpu.edu.tw website
  function handleWebsiteRouting() {
    // Code to open a new tab with the cof.ntpu.edu.tw website in your extension
  
    // Send a message to the Line bot to notify about the website routing action
    chrome.runtime.sendMessage({ command: 'go_to_website' });
  }
  
  // Example event listener or button click handler
  document.getElementById('scheduleButtonID')?.addEventListener('click', handleImportSchedule);
  document.getElementById('websiteButtonID')?.addEventListener('click', handleWebsiteRouting);
  