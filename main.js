// Main application code
document.addEventListener('DOMContentLoaded', function() {
  // Clear the local storage
  localStorage.clear();

  // Tab switching functionality
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Job Import Elements
  const zipDropzone = document.getElementById('zip-dropzone');
  const zipFileInput = document.getElementById('zip-file');
  const customerFileInput = document.getElementById('customer-file');
  const orderFileInput = document.getElementById('order-file');
  const paymentFileInput = document.getElementById('payment-file');
  const generateJobBtn = document.getElementById('generate-job-btn');
  
  // Customer Import Elements
  const customerListDropzone = document.getElementById('customer-list-dropzone');
  const customerListFileInput = document.getElementById('customer-list-file');
  const generateCustomerBtn = document.getElementById('generate-customer-btn');
  
// Update these elements to handle ZIP files
customerListFileInput.setAttribute('accept', '.zip');
  // Log element
  const logElement = document.getElementById('log');
  
  // Store file objects
  const files = {
    customer: null,
    order: null,
    payment: null
  };
  
  // Store customer list file
  let customerListFile = null;
  
  // Create importer instances
  const monarchImporter = new MonarchImporter();
  const customerListImporter = new CustomerListImporter();
  
  // Initialize the file viewer
  const fileViewer = new MonarchFileViewer();
  fileViewer.initialize();
  
  /**
   * Helper function to log messages
   * @param {string} message - Message to log
   * @param {string} type - Type of message ('info', 'success', 'error')
   */
  function logMessage(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = message;
    logElement.appendChild(logEntry);
    logElement.scrollTop = logElement.scrollHeight;
  }
  
  /**
   * Update file status indicators
   * @param {string} fileType - Type of file
   * @param {boolean} isFound - Whether the file is found
   */
  function updateFileStatus(fileType, isFound) {
    const statusElement = document.getElementById(`${fileType}-status`);
    const textElement = document.getElementById(`${fileType}-text`);
    
    if (isFound) {
      statusElement.className = 'status-indicator status-found';
      textElement.textContent = 'Found';
    } else {
      statusElement.className = 'status-indicator status-missing';
      textElement.textContent = 'Not found';
    }
    
    // Enable/disable generate button
    generateJobBtn.disabled = !(files.customer && files.order);
  }
 
  /**
   * Update customer list status
   * @param {boolean} isFound - Whether the file is found
   */
  function updateCustomerListStatus(isFound) {
    const statusElement = document.getElementById('customer-list-status');
    const textElement = document.getElementById('customer-list-text');
    
    if (isFound) {
      statusElement.className = 'status-indicator status-found';
      textElement.textContent = 'Found';
      generateCustomerBtn.disabled = false;
    } else {
      statusElement.className = 'status-indicator status-missing';
      textElement.textContent = 'Not found';
      generateCustomerBtn.disabled = true;
    }
  }
  
  // Set up ZIP file drag and drop
  zipDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    zipDropzone.classList.add('highlight');
  });
  
  zipDropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    zipDropzone.classList.remove('highlight');
  });
  
  zipDropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    zipDropzone.classList.remove('highlight');
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0 && droppedFiles[0].type === 'application/zip') {
      await processZipFile(droppedFiles[0]);

      if (files.customer && files.order) {
        processJobFiles();
      }
    } else {
      logMessage('Please drop a ZIP file.', 'error');
    }
  });
  
  zipDropzone.addEventListener('click', () => {
    zipFileInput.click();
  });
  
  zipFileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      await processZipFile(e.target.files[0]);
      
      if (files.customer && files.order) {
        processJobFiles();
      }
    }
  });
  
  /**
   * Process uploaded ZIP file
   * @param {File} zipFile - The ZIP file to process
   */
  async function processZipFile(zipFile) {
    try {
      logMessage(`Processing ZIP file: ${zipFile.name}...`);
      
      const zip = await JSZip.loadAsync(zipFile);
      
      // Extract CSV files
      for (const filename of Object.keys(zip.files)) {
        if (filename.toLowerCase().endsWith('.csv')) {
          const fileContent = await zip.files[filename].async('blob');
          const file = new File([fileContent], filename, { type: 'text/csv' });
          
          // Store the file based on its name
          if (filename.toLowerCase().includes('customer')) {
            files.customer = file;
            updateFileStatus('customer', true);
            logMessage(`Found customer.csv in ZIP file`);
          } else if (filename.toLowerCase().includes('order')) {
            files.order = file;
            updateFileStatus('order', true);
            logMessage(`Found order.csv in ZIP file`);
          } else if (filename.toLowerCase().includes('payment')) {
            files.payment = file;
            updateFileStatus('payment', true);
            logMessage(`Found payment.csv in ZIP file`);
          }
        }
      }
      
      logMessage('ZIP file processing complete', 'success');
    } catch (error) {
      logMessage(`Error processing ZIP file: ${error.message}`, 'error');
    }
  }
  
  // Set up customer list drag and drop handlers
  customerListDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    customerListDropzone.classList.add('highlight');
  });
  
  customerListDropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    customerListDropzone.classList.remove('highlight');
  });
  
  // Update customer list drop handlers
  customerListDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    customerListDropzone.classList.remove('highlight');
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const file = droppedFiles[0];
      if (file.name.endsWith('.zip')) {
        customerListFile = file;
        updateCustomerListStatus(true);
        logMessage(`Customer ZIP file selected: ${file.name}`);
        // Don't process immediately - wait for button click
      } else {
        logMessage('Please drop a ZIP file containing customer and user data.', 'error');
      }
    }
  });
  
  customerListDropzone.addEventListener('click', () => {
    customerListFileInput.click();
  });
  
// Update customer list input change handler
customerListFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    const file = e.target.files[0];
    if (file.name.endsWith('.zip')) {
      customerListFile = file;
      updateCustomerListStatus(true);
      logMessage(`Customer ZIP file selected: ${file.name}`);
    } else {
      logMessage('Please select a ZIP file containing customer and user data.', 'error');
      updateCustomerListStatus(false);
    }
  }
});

// Update process customer file function
function processCustomerFile() {
  if (customerListFile) {
    logMessage('Processing customer ZIP file...');
    
    // Create an instance of CustomerListImporter for each operation
    // to avoid conflicts with any stored data
    const importer = new CustomerListImporter();
    
    importer.processFile(customerListFile)
      .then(result => {
        if (result.success) {
          const summary = result.summary || {};
          logMessage(result.message, 'success');
          
          // Add a summary of the import
          if (summary.customers && summary.users) {
            logMessage(`Processed ${summary.customers} customers and ${summary.users} users.`, 'info');
            
            if (summary.emailsMatched !== undefined) {
              logMessage(`Found email addresses for ${summary.emailsMatched} customers.`, 'info');
            }
          }
          
          // Load the file in the viewer
          fileViewer.loadFile('customer');
        } else {
          logMessage(result.message, 'error');
        }
      })
      .catch(error => {
        logMessage(`Error: ${error.message}`, 'error');
      });
  } else {
    logMessage('No customer ZIP file selected.', 'error');
  }
}

/**
 * Process job files
 */
async function processJobFiles() {
  if (files.customer && files.order) {
    logMessage('Processing job files...');
    fileViewer.loadFile('job');
    
    try {
      const result = await monarchImporter.processFiles(files);
      if (result.success) {
        logMessage(result.message, 'success');
      } else {
        logMessage(result.message, 'error');
      }
    } catch (error) {
      logMessage(`Error: ${error.message}`, 'error');
    }
  }
}

// Individual file uploads
customerFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    files.customer = e.target.files[0];
    updateFileStatus('customer', true);
    logMessage(`Customer file selected: ${files.customer.name}`);
  }
});

orderFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    files.order = e.target.files[0];
    updateFileStatus('order', true);
    logMessage(`Order file selected: ${files.order.name}`);
  }
});

paymentFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    files.payment = e.target.files[0];
    updateFileStatus('payment', true);
    logMessage(`Payment file selected: ${files.payment.name}`);
  }
});

// Generate job import file
generateJobBtn.addEventListener('click', async () => {
  if (!files.customer || !files.order) {
    logMessage('Missing required files. Need at least Customer and Order data.', 'error');
    return;
  }
  
  logMessage('Generating Monarch job import file...');
  
  try {
    const result = await monarchImporter.processFiles(files);
    
    if (result.success) {
      logMessage(result.message, 'success');
      fileViewer.loadFile('job');
    } else {
      logMessage(result.message, 'error');
    }
  } catch (error) {
    logMessage(`Error: ${error.message}`, 'error');
  }
});

 // Update the generate button click handler
 generateCustomerBtn.addEventListener('click', () => {
  if (!customerListFile) {
    logMessage('No customer ZIP file selected.', 'error');
    return;
  }
  
  logMessage('Generating Monarch customer import file...');
  processCustomerFile();
});

logMessage('Ready to process files. Upload ZIP or individual CSV files to begin.');
});