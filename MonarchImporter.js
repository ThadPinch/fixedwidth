/**
 * Monarch Import File Generator
 * 
 * This script processes CSV files from a web application download
 * and generates fixed-width text files for importing into Monarch.
 */
class MonarchImporter {
	constructor() {
	  this.customerData = [];
	  this.orderData = [];
	  this.paymentData = [];
	  this.rejectedOrders = []; // New array to track rejected orders
	}
  
	/**
	 * Initialize default values for missing customer fields
	 * @param {Object} customer - Customer data object
	 * @returns {Object} Customer data with default values for missing fields
	 */
	initializeCustomerDefaults(customer) {
	  // Create a new object with the original data
	  const defaults = { ...customer };
	  
	  // Set default values for critical fields if they're missing
	  defaults['Customer ID'] = defaults['Customer ID'] || '';
	  defaults['MIS Account ID'] = defaults['MIS Account ID'] || defaults['Customer ID'] || '';
	  defaults['Customer Name'] = defaults['Customer Name'] || 'Unknown Customer';
	  
	  // Address information
	  defaults['Bill to Address-Line One'] = defaults['Bill to Address-Line One'] || '';
	  defaults['Bill to Address-Line Two'] = defaults['Bill to Address-Line Two'] || '';
	  defaults['Bill to City'] = defaults['Bill to City'] || '';
	  defaults['Bill to State'] = defaults['Bill to State'] || '';
	  defaults['Bill to Zip'] = defaults['Bill to Zip'] || '';
	  defaults['Bill to Country'] = defaults['Bill to Country'] || 'USA';
	  
	  // Contact information
	  defaults['Bill to Contact First Name'] = defaults['Bill to Contact First Name'] || '';
	  defaults['Bill to Contact Last Name'] = defaults['Bill to Contact Last Name'] || '';
	  defaults['Telephone 1'] = defaults['Telephone 1'] || '';
	  defaults['Fax Number'] = defaults['Fax Number'] || '';
	  defaults['Customer E-mail'] = defaults['Customer E-mail'] || '';
	  
	  // Sales and rep information
	  defaults['Sales Representative ID'] = defaults['Sales Representative ID'] || '000000000';
	  defaults['CSR ID'] = defaults['CSR ID'] || '000';
	  
	  // Financial information
	  defaults['Terms Type'] = defaults['Terms Type'] || '';
	  defaults['Customer Type'] = defaults['Customer Type'] || '';
	  defaults['Price Code'] = defaults['Price Code'] || '';
	  defaults['Credit Limit'] = defaults['Credit Limit'] || '0';
	  
	  // Shipping information
	  defaults['Ship Via'] = defaults['Ship Via'] || '';
	  
	  // Tax information
	  defaults['Bill to Sales Tax ID'] = defaults['Bill to Sales Tax ID'] || '';
	  
	  // Finance charges
	  defaults['Charge Finance Charges'] = defaults['Charge Finance Charges'] || 'N';
	  
	  return defaults;
	}
	
	/**
	 * Parse a CSV file
	 * @param {File} file - The file to parse
	 * @param {string} fileType - Type of file ('customer', 'order', or 'payment')
	 * @returns {Promise} Promise resolving to the parsed data
	 */
	parseCSVFile(file, fileType) {
	  return new Promise((resolve, reject) => {
		const reader = new FileReader();
		
		reader.onload = (event) => {
		  try {
			const csvData = event.target.result;
			let parsedData = this.parseCSV(csvData);
			
			// Store the parsed data based on file type
			if (fileType === 'customer') {
			  // Initialize defaults for each customer record
			  parsedData = parsedData.map(customer => this.initializeCustomerDefaults(customer));
			  this.customerData = parsedData;
			} else if (fileType === 'order') {
			  this.orderData = parsedData;
			} else if (fileType === 'payment') {
			  this.paymentData = parsedData;
			}
			
			resolve(parsedData);
		  } catch (error) {
			reject(error);
		  }
		};
		
		reader.onerror = (error) => {
		  reject(error);
		};
		
		reader.readAsText(file);
	  });
	}
	  
	/**
	 * Parse CSV string data with proper handling of raw CSV data
	 * @param {string} csvString - CSV string to parse
	 * @returns {Array} Array of objects representing the CSV data
	 */
	parseCSV(csvString) {
	  // Using PapaParse library for robust CSV parsing
	  const results = Papa.parse(csvString, {
		header: true,
		skipEmptyLines: true,
		transform: (value) => value.trim()
	  });
	  
	  return results.data;
	}
	
	/**
	 * Clean up product descriptions to remove trailing information
	 * @param {string} description - Product description
	 * @returns {string} Cleaned description
	 */
	cleanProductDescription(description) {
	  if (!description) return '';
	  
	  // If it's just "Shipping", return it as is
	  if (description.trim().toLowerCase() === 'shipping') {
		return description;
	  }
	  
	  // Fix for "Booklet - 6.5" square : Huntress Newsletter mailing - Sample" pattern
	  if (description.includes(' : ')) {
		const parts = description.split(' : ');
		const prefix = parts[0].trim(); // e.g. "Booklet - 6.5" square"
		
		// If there are additional parts that include address info, remove them
		if (parts[1].includes(' - Sample')) {
		  // Only keep the main details before "- Sample"
		  const mainDetails = parts[1].split(' - Sample')[0].trim();
		  return `${prefix} : ${mainDetails}`;
		}
		
		// If there's a dash sequence with additional details, just keep the first part
		if (parts[1].includes(' - ')) {
		  const mainDetails = parts[1].split(' - ')[0].trim();
		  return `${prefix} : ${mainDetails}`;
		}
		
		return description;
	  }
	  
	  return description;
	}
	
	/**
	 * Map CSV data to Monarch jobs format with proper field extraction
	 * Separates main orders and sub-jobs into different arrays and tracks rejected orders
	 * @returns {Promise<Object>} Object containing mainJobs, subJobs, and rejectedOrders arrays in Monarch format
	 */
	async mapOrdersToMonarch() {
	  // Reset rejected orders array
	  this.rejectedOrders = [];
	  
	  // Create an instance of the API service
	  const customerApiService = new CustomerApiService();
	  
	  // First, group orders by invoice number
	  const ordersByInvoice = {};
	  
	  this.orderData.forEach(order => {
		const invoiceNumber = order['Invoice Number'] || '';
		if (!ordersByInvoice[invoiceNumber]) {
		  ordersByInvoice[invoiceNumber] = [];
		}
		ordersByInvoice[invoiceNumber].push(order);
	  });
	  
	  // Process each group and create job records, separating main jobs and sub-jobs
	  const mainJobs = [];
	  const subJobs = [];
	  
	  // Process each invoice
	  for (const [invoiceNumber, orders] of Object.entries(ordersByInvoice)) {
		if (orders.length === 0) continue;
		
		// Create a job ID from the invoice number
		let jobId = '';
		jobId = invoiceNumber.toString().padEnd(8, ' ').substring(0, 8);
		  
		// Clean up jobId by replacing leading zeros with spaces
		jobId = jobId.replace(/^0+/, match => ' '.repeat(match.length));
		
		// Process the first order as the main job (always has blank sub_job_id)
		const firstOrder = orders[0];
		
		// Parse dates from order data
		const dueDate = firstOrder['Due date'] ? this.formatDate(new Date(firstOrder['Due date'])) : '';
		const shipDate = firstOrder['Shipping date'] ? this.formatDate(new Date(firstOrder['Shipping date'])) : '';
		
		// Map the PO number from custom field
		const poNumber = firstOrder['Custom Field 1-po#'] || '';
		
		// Get the customer data that matches this order
		const customerName = firstOrder['Customer Name'] || '';
		
	// Try to find the customer in the API by name
let monarchCustomerId = '';
let customerFound = false;

try {
  console.log(`Searching for customer: ${customerName}`);
  const searchResults = await customerApiService.searchCustomers(customerName);
  
  // Log the search results for debugging
  console.log('API search results:', searchResults);
  
  if (searchResults && Array.isArray(searchResults) && searchResults.length > 0) {
    // Use the first matching customer
    monarchCustomerId = searchResults[0].customer_id;
    console.log(`Customer found in API: ${monarchCustomerId}`);
    customerFound = true;
  } else {
    console.warn(`No monarch customer found for ${customerName}`);
    
    // Add to rejected orders
    const rejectedOrder = {
      invoiceNumber: invoiceNumber,
      customerName: customerName,
      productName: firstOrder['Line: Product Name'] || '',
      poNumber: poNumber,
      dueDate: dueDate,
      amount: firstOrder['Line: Amount'] || '',
      reason: 'Customer not found in Monarch database'
    };
    
    this.rejectedOrders.push(rejectedOrder);
    console.log(`Added to rejected orders: ${customerName}, Invoice: ${invoiceNumber}`);
    
    // Skip processing this order and continue with the next
    continue;
  }
} catch (error) {
  console.error(`Error fetching monarch customer for ${customerName}:`, error);
  
  // Add to rejected orders when API error occurs
  const rejectedOrder = {
    invoiceNumber: invoiceNumber,
    customerName: customerName,
    productName: firstOrder['Line: Product Name'] || '',
    poNumber: poNumber,
    dueDate: dueDate,
    amount: firstOrder['Line: Amount'] || '',
    reason: `API Error: ${error.message}`
  };
  
  this.rejectedOrders.push(rejectedOrder);
  console.log(`Added to rejected orders due to API error: ${customerName}, Invoice: ${invoiceNumber}`);
  
  // Skip processing this order and continue with the next
  continue;
}

// We no longer want to fall back to local data if API call fails
// The full rejection tracking approach should be used instead
		
		// Ensure the customer ID is valid (max 8 chars)
		monarchCustomerId = monarchCustomerId.toString().substring(0, 8);
		
		// Contact name from customer record
		const contactName = this.customerData.find(c => c['Customer ID'] === customerName) ? 
		  `${this.customerData.find(c => c['Customer ID'] === customerName)['Bill to Contact First Name'] || ''} ${this.customerData.find(c => c['Customer ID'] === customerName)['Bill to Contact Last Name'] || ''}`.trim() : 
		  '';
		
		// Format numeric values
		const qtyOrdered = firstOrder['Line: Quantity'] ? 
		  parseFloat(firstOrder['Line: Quantity']).toFixed(0).toString() : 
		  '0';
		
		const unitPrice = firstOrder['Line: Unit price'] ? 
		  parseFloat(firstOrder['Line: Unit price']).toFixed(2).toString() : 
		  '0.00';
		
		// Clean product description
		const rawProductName = firstOrder['Line: Product Name'] || '';
		const productName = this.cleanProductDescription(rawProductName);
  
		// Calculate quotation amount
		let quotationAmount = firstOrder['Line: Amount'] ? 
		  parseFloat(firstOrder['Line: Amount']).toFixed(2).toString() : 
		  '0.00';
		
		// Map main order to Monarch job format (with blank sub_job_id)
		mainJobs.push({
		  'job_id': { value: jobId, pos: 1, len: 8 },
		  'sub_job_id': { value: '    ', pos: 9, len: 4 }, // Always blank for main job
		  'job_description': { value: productName.substring(0, 254), pos: 13, len: 254 },
		  'job_type': { value: 'Production', pos: 267, len: 19 }, // Default to Finished Goods
		  'item_id': { value: '', pos: 286, len: 15 },
		  'cust_ordered_by': { value: monarchCustomerId, pos: 301, len: 8 },
		  'cust_billed_to': { value: monarchCustomerId, pos: 309, len: 8 },
		  'sales_class_id': { value: '113', pos: 317, len: 8 },
		  'po_number': { value: poNumber.substring(0, 20), pos: 325, len: 20 },
		  'date_promised': { value: dueDate, pos: 345, len: 10 },
		  'ship_date': { value: shipDate, pos: 355, len: 10 },
		  'qty_ordered': { value: qtyOrdered, pos: 365, len: 11 },
		  'priority': { value: '', pos: 376, len: 10 }, 
		  'contact_name': { value: contactName.substring(0, 30), pos: 386, len: 30 },
		  'expense_code': { value: '', pos: 416, len: 24 },
		  'shop_floor_active': { value: '0', pos: 440, len: 1 },
		  'form_number': { value: '', pos: 441, len: 20 },
		  'quotation_amount': { value: quotationAmount, pos: 461, len: 15 },
		  'unit_of_measure_id': { value: 'Each', pos: 476, len: 4 }, // Default to Each
		  'unit_price': { value: unitPrice, pos: 480, len: 16 },
		  'job_title': { value: productName.substring(0, 50), pos: 496, len: 50 },
		  'forest_type_id': { value: '', pos: 546, len: 15 },
		});
		
		// Process additional order lines as sub-jobs with numbered sub_job_id
		if (orders.length > 1) {
		  // Start from index 1 (skip the first order that was already processed as main job)
		  for (let i = 1; i < orders.length; i++) {
			const order = orders[i];
			
			// Format sub-job-specific values
			const subJobId = i.toString().padEnd(4, ' ').substring(0, 4);
			
			const orderQty = order['Line: Quantity'] ? 
			  parseFloat(order['Line: Quantity']).toFixed(0).toString() : 
			  '0';
			
			const orderUnitPrice = order['Line: Unit price'] ? 
			  parseFloat(order['Line: Unit price']).toFixed(2).toString() : 
			  '0.00';
			
			const orderRawProductName = order['Line: Product Name'] || '';
			const orderProductName = this.cleanProductDescription(orderRawProductName);
  
			// Calculate quotation amount for sub-job
			let quotationAmount = order['Line: Amount'] ? 
			  parseFloat(order['Line: Amount']).toFixed(2).toString() : 
			  '0.00';
			
			// Map sub-job to Monarch format with the same customer ID
			subJobs.push({
			  'job_id': { value: jobId, pos: 1, len: 8 },
			  'sub_job_id': { value: subJobId, pos: 9, len: 4 }, // Numbered for sub-jobs
			  'job_description': { value: orderProductName.substring(0, 254), pos: 13, len: 254 },
			  'job_type': { value: 'Production', pos: 267, len: 19 },
			  'item_id': { value: '', pos: 286, len: 15 },
			  'cust_ordered_by': { value: monarchCustomerId, pos: 301, len: 8 },
			  'cust_billed_to': { value: monarchCustomerId, pos: 309, len: 8 },
			  'sales_class_id': { value: '113', pos: 317, len: 8 },
			  'po_number': { value: poNumber.substring(0, 20), pos: 325, len: 20 },
			  'date_promised': { value: dueDate, pos: 345, len: 10 },
			  'ship_date': { value: shipDate, pos: 355, len: 10 },
			  'qty_ordered': { value: orderQty, pos: 365, len: 11 },
			  'priority': { value: '', pos: 376, len: 10 }, 
			  'contact_name': { value: contactName.substring(0, 30), pos: 386, len: 30 },
			  'expense_code': { value: '', pos: 416, len: 24 },
			  'shop_floor_active': { value: '0', pos: 440, len: 1 },
			  'form_number': { value: '', pos: 441, len: 20 },
			  'quotation_amount': { value: quotationAmount, pos: 461, len: 15 },
			  'unit_of_measure_id': { value: 'Each', pos: 476, len: 4 },
			  'unit_price': { value: orderUnitPrice, pos: 480, len: 16 },
			  'job_title': { value: orderProductName.substring(0, 50), pos: 496, len: 50 },
			  'forest_type_id': { value: '', pos: 546, len: 15 },
			});
		  }
		}
	  }
	  
	  return { mainJobs, subJobs, rejectedOrders: this.rejectedOrders };
	}
	  
	/**
	 * Format a date to mm/dd/yyyy format
	 * @param {Date} date - Date object
	 * @returns {string} Formatted date string
	 */
	formatDate(date) {
	  try {
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		const year = date.getFullYear();
		return `${month}/${day}/${year}`;
	  } catch (e) {
		// Return current date if there's an error
		const today = new Date();
		const month = (today.getMonth() + 1).toString().padStart(2, '0');
		const day = today.getDate().toString().padStart(2, '0');
		const year = today.getFullYear();
		return `${month}/${day}/${year}`;
	  }
	}
	
	/**
	 * Generate a fixed-width text file from job array
	 * @param {Array} jobs - Array of job objects
	 * @returns {string} Fixed-width text file content
	 */
	generateFixedWidthFile(jobs) {
	  let result = '';
	  
	  jobs.forEach(job => {
		// Create a line of spaces of the required length (560 characters)
		const line = new Array(560 + 1).join(' ').split('');
		
		// Place each field at its proper position
		for (const [field, def] of Object.entries(job)) {
		  if (def.value) {
			const value = def.value.toString();
			const pos = def.pos - 1; // Convert to 0-based index
			const len = def.len;
			
			// Place the value in the line array, truncating if necessary
			for (let i = 0; i < Math.min(len, value.length); i++) {
			  if (pos + i < line.length) {
				line[pos + i] = value[i];
			  }
			}
		  }
		}
		
		// Add the line to the result
		result += line.join('') + '\n';
	  });
	  
	  return result;
	}
	
	/**
	 * Generate rejection file for orders with customers not found in API
	 * @returns {string} CSV formatted rejection file content
	 */
	generateRejectionFile() {
	  if (this.rejectedOrders.length === 0) {
		return "No rejected orders.";
	  }
	  
	  // Create headers for the CSV
	  const headers = [
		"Invoice Number",
		"Customer Name",
		"Product",
		"PO Number",
		"Due Date",
		"Amount",
		"Rejection Reason"
	  ];
	  
	  // Create CSV content
	  let csvContent = headers.join(",") + "\n";
	  
	  // Add each rejected order as a row
	  this.rejectedOrders.forEach(order => {
		// Escape fields that might contain commas
		const escapedCustomerName = `"${order.customerName.replace(/"/g, '""')}"`;
		const escapedProductName = `"${order.productName.replace(/"/g, '""')}"`;
		const escapedPoNumber = `"${order.poNumber.replace(/"/g, '""')}"`;
		const escapedReason = `"${order.reason.replace(/"/g, '""')}"`;
		
		const row = [
		  order.invoiceNumber,
		  escapedCustomerName,
		  escapedProductName,
		  escapedPoNumber,
		  order.dueDate,
		  order.amount,
		  escapedReason
		];
		
		csvContent += row.join(",") + "\n";
	  });
	  
	  return csvContent;
	}
	  
	/**
	 * Generate two separate job import files - one for main jobs and one for sub-jobs
	 * @returns {Promise<Object>} Object containing mainJobsFile and subJobsFile content
	 */
	async generateJobImportFiles() {
	  const { mainJobs, subJobs, rejectedOrders } = await this.mapOrdersToMonarch();
	  
	  // Generate main jobs file (with blank sub_job_id)
	  const mainJobsFile = this.generateFixedWidthFile(mainJobs);
	  
	  // Generate sub-jobs file (with numbered sub_job_id)
	  const subJobsFile = this.generateFixedWidthFile(subJobs);
	  
	  // Generate rejection file
	  const rejectionFile = this.generateRejectionFile();
	  
	  return { mainJobsFile, subJobsFile, rejectionFile };
	}
	  
	/**
	 * Download text content as a file
	 * @param {string} content - Text content to download
	 * @param {string} filename - Name of the file to download
	 */
	downloadTextFile(content, filename) {
	  const blob = new Blob([content], { type: 'text/plain' });
	  const url = URL.createObjectURL(blob);
	  
	  const a = document.createElement('a');
	  a.href = url;
	  a.download = filename;
	  document.body.appendChild(a);
	  a.click();
	  
	  // Clean up
	  setTimeout(() => {
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	  }, 0);
	}
  
	/**
	 * Process all files and generate Monarch import files
	 * @param {Object} files - Object containing File objects for customer, order, and payment CSV files
	 * @returns {Promise} Promise resolving to result object
	 */
	async processFiles(files) {
	  try {
		// Parse all CSV files
		const promises = [];
		if (files.customer) {
		  promises.push(this.parseCSVFile(files.customer, 'customer'));
		}
		if (files.order) {
		  promises.push(this.parseCSVFile(files.order, 'order'));
		}
		if (files.payment) {
		  promises.push(this.parseCSVFile(files.payment, 'payment'));
		}
		
		await Promise.all(promises);
		
		// Generate job import files - note this is now async
		const { mainJobsFile, subJobsFile, rejectionFile } = await this.generateJobImportFiles();
		
		// Download the job files
		this.downloadTextFile(mainJobsFile, 'monarch_main_jobs.txt');
		this.downloadTextFile(subJobsFile, 'monarch_sub_jobs.txt');
		
		// Download rejection file if there are any rejected orders
		if (this.rejectedOrders.length > 0) {
		  this.downloadTextFile(rejectionFile, 'monarch_rejected_orders.txt');
		}
		
		// Store in localStorage for the viewer (combine both for backwards compatibility)
		const combinedFile = mainJobsFile + subJobsFile;
		localStorage.setItem('monarch_job_import', combinedFile);
		
		// Create result message that includes rejection information
		let message = 'Monarch job import files generated successfully!';
		if (this.rejectedOrders.length > 0) {
		  message += ` ${this.rejectedOrders.length} orders were rejected due to missing customer data.`;
		}
		
		return {
		  success: true,
		  message: message,
		  rejectedCount: this.rejectedOrders.length
		};
	  } catch (error) {
		console.error('Error processing files:', error);
		return {
		  success: false,
		  message: `Error processing files: ${error.message}`
		};
	  }
	}
  }