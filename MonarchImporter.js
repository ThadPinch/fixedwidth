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
	 * Groups jobs with the same invoice number and assigns consecutive line numbers
	 * @returns {Array} Array of job objects in Monarch format
	 */
	mapOrdersToMonarch() {
	  // First, group orders by invoice number
	  const ordersByInvoice = {};
	  
	  this.orderData.forEach(order => {
		const invoiceNumber = order['Invoice Number'] || '';
		if (!ordersByInvoice[invoiceNumber]) {
		  ordersByInvoice[invoiceNumber] = [];
		}
		ordersByInvoice[invoiceNumber].push(order);
	  });
	  
	  // Process each group and create job records with consecutive line numbers
	  const jobs = [];
	  
	  Object.entries(ordersByInvoice).forEach(([invoiceNumber, orders]) => {
		orders.forEach((order, index) => {
		  // Create a job ID from the invoice number
		  let jobId = '';
		  if (invoiceNumber) {
			jobId = invoiceNumber.toString().padStart(8, '0').substring(0, 8);
		  } else {
			// Generate a unique ID if invoice number is missing
			jobId = (`JOB${jobs.length + 1}`).padStart(8, '0').substring(0, 8);
		  }
		  
		  // Clean up jobId by replacing leading zeros with spaces
		  jobId = jobId.replace(/^0+/, match => ' '.repeat(match.length));
		  
		  // Create sub-job ID (line number) - 1-based indexing
		  const subJobId = (index + 1).toString().padStart(4, ' ');
		  
		  // Parse dates from order data
		  const dueDate = order['Due date'] ? this.formatDate(new Date(order['Due date'])) : '';
		  const shipDate = order['Shipping date'] ? this.formatDate(new Date(order['Shipping date'])) : '';
		  
		  // Map the PO number from custom field
		  const poNumber = order['Custom Field 1-po#'] || '';
		  
		  // Get the customer data that matches this order
		  const customerRecord = this.customerData.find(c => c['Customer ID'] === order['Customer Name']);
		  const customerId = customerRecord ? customerRecord['Customer ID'] : '';
		  
		  // Contact name from customer record
		  const contactName = customerRecord ? 
			`${customerRecord['Bill to Contact First Name'] || ''} ${customerRecord['Bill to Contact Last Name'] || ''}`.trim() : 
			'';
		  
		  // Format numeric values
		  const qtyOrdered = order['Line: Quantity'] ? 
			parseFloat(order['Line: Quantity']).toFixed(2).toString() : 
			'0.00';
		  
		  const unitPrice = order['Line: Unit price'] ? 
			parseFloat(order['Line: Unit price']).toFixed(2).toString() : 
			'0.00';
		  
		  // Clean product description
		  const rawProductName = order['Line: Product Name'] || '';
		  const productName = this.cleanProductDescription(rawProductName);
		  
		  // Map order to Monarch job format
		  jobs.push({
			'job_id': { value: jobId, pos: 1, len: 8 },
			'sub_job_id': { value: subJobId, pos: 9, len: 4 },
			'job_description': { value: productName.substring(0, 254), pos: 13, len: 254 },
			'job_type': { value: 'FG', pos: 267, len: 19 }, // Default to Finished Goods
			'item_id': { value: '', pos: 286, len: 15 },
			'cust_ordered_by': { value: customerId.substring(0, 8), pos: 301, len: 8 },
			'cust_billed_to': { value: customerId.substring(0, 8), pos: 309, len: 8 },
			'sales_class_id': { value: '', pos: 317, len: 8 },
			'po_number': { value: poNumber.substring(0, 20), pos: 325, len: 20 },
			'date_promised': { value: dueDate, pos: 345, len: 10 },
			'ship_date': { value: shipDate, pos: 355, len: 10 },
			'qty_ordered': { value: qtyOrdered, pos: 365, len: 11 },
			'priority': { value: '', pos: 376, len: 10 }, 
			'contact_name': { value: contactName.substring(0, 30), pos: 386, len: 30 },
			'expense_code': { value: '', pos: 416, len: 24 },
			'shop_floor_active': { value: '1', pos: 440, len: 1 },
			'form_number': { value: '', pos: 441, len: 20 },
			'quotation_amount': { value: '', pos: 461, len: 15 },
			'unit_of_measure_id': { value: 'EA', pos: 476, len: 4 }, // Default to Each
			'unit_price': { value: unitPrice, pos: 480, len: 16 },
			'job_title': { value: productName.substring(0, 50), pos: 496, len: 50 },
			'forest_type_id': { value: '', pos: 546, len: 15 },
		  });
		});
	  });
	  
	  return jobs;
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
	 * Generate fixed-width job import file
	 * @returns {string} Fixed-width text file content
	 */
	generateJobImportFile() {
	  const jobs = this.mapOrdersToMonarch();
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
		
		// Generate job import file
		const jobImport = this.generateJobImportFile();
		
		// Download the job file
		this.downloadTextFile(jobImport, 'monarch_job_import.txt');
		
		// Store in localStorage for the viewer
		localStorage.setItem('monarch_job_import', jobImport);
		
		return {
		  success: true,
		  message: 'Monarch job import file generated successfully!'
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
  