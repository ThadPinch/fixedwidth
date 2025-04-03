/**
 * Customer Import specific class for handling the standalone customer list import
 */
class CustomerListImporter {
	constructor() {
	  this.customerListData = [];
	}
	
	/**
	 * Parse a CSV or Excel file containing customer data
	 * @param {File} file - The customer list file (CSV or Excel)
	 * @returns {Promise} Promise resolving to the parsed data
	 */
	parseCustomerListFile(file) {
	  return new Promise((resolve, reject) => {
		if (file.name.endsWith('.csv')) {
		  this.parseCSVFile(file).then(resolve).catch(reject);
		} else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
		  this.parseExcelFile(file).then(resolve).catch(reject);
		} else {
		  reject(new Error('Unsupported file format. Please upload a CSV or Excel file.'));
		}
	  });
	}
	
	/**
	 * Parse a CSV file
	 * @param {File} file - The CSV file to parse
	 * @returns {Promise} Promise resolving to the parsed data
	 */
	parseCSVFile(file) {
	  return new Promise((resolve, reject) => {
		const reader = new FileReader();
		
		reader.onload = (event) => {
		  try {
			const csvData = event.target.result;
			
			Papa.parse(csvData, {
			  header: true,
			  dynamicTyping: true,
			  skipEmptyLines: true,
			  complete: (results) => {
				this.customerListData = results.data;
				resolve(results.data);
			  },
			  error: (error) => {
				reject(error);
			  }
			});
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
	 * Parse an Excel file
	 * @param {File} file - The Excel file to parse
	 * @returns {Promise} Promise resolving to the parsed data
	 */
	parseExcelFile(file) {
	  return new Promise((resolve, reject) => {
		// This would require xlsx.js or another Excel parsing library
		// For now, we'll just show an example implementation
		reject(new Error('Excel parsing not implemented. Please use CSV format instead.'));
	  });
	}
	
	/**
	 * Map customer list data to Monarch format
	 * @returns {Array} Array of customer objects in Monarch format
	 */
	mapCustomerListToMonarch() {
	  let custCode = 0;
	  return this.customerListData.map(customer => {
		custCode++;
		// Extract customer data with fallbacks to empty strings
		// const custCode = (customer.accountName || customer.customerID || '').toString().substring(0, 8);
		const custName = (customer.accountName || '').toString().substring(0, 40);
		
		// Address information
		const address1 = (customer.btStreet || '').toString().substring(0, 40);
		const address2 = (customer.btAddress2 || '').toString().substring(0, 40);
		const address3 = (customer.btAddress3 || '').toString().substring(0, 40);
		const city = (customer.btCity || '').toString().substring(0, 40);
		const state = (customer.btState || '').toString().substring(0, 3);
		const zip = (customer.btZip || '').toString().substring(0, 10);
		const country = (customer.btCountry || 'USA').toString().substring(0, 40);
		
		// Contact information
		const phone = (customer.btTelephone || '').toString().substring(0, 20);
		const fax = (customer.btFax || '').toString().substring(0, 20);
		
		// Generate email from available fields
		let email = '';
		if (customer.billContactUserID) {
		  // If there's a billContactUserID, we might use that to find an email
		  // This is a placeholder - in a real implementation, you would look up the email
		  email = '';
		}
		
		// Financial and business information
		const arTaxCode = (customer.taxItem || '').toString().substring(0, 10);
		const termsCode = (customer.btTerms || '').toString().substring(0, 20);
		const salesAgentId = (customer.salesmanID || '000000000').toString().substring(0, 8);
		const csrId = (customer.csrID || '000').toString().substring(0, 3);
		
		// Determine PO Required based on available data
		const poRequired = customer.requirePO === 'Y' ? '1' : '0';
		
		// needs to iterate for

		
		// Create Monarch fixed-width format mapping
		return {
		  'Cust-code': { value: custCode, pos: 1, len: 8 },
		  'Cust-name': { value: custName, pos: 9, len: 40 },
		  
		  // Address information
		  'Address-1': { value: address1, pos: 49, len: 40 },
		  'Address-2': { value: address2, pos: 89, len: 40 },
		  'Address-3': { value: address3, pos: 129, len: 40 },
		  'City': { value: city, pos: 169, len: 40 },
		  'State': { value: state, pos: 209, len: 3 },
		  'Zip': { value: zip, pos: 212, len: 10 },
		  'Country': { value: country, pos: 222, len: 40 },
		  
		  // Contact information
		  'Phone': { value: phone, pos: 262, len: 20 },
		  'FAX': { value: fax, pos: 282, len: 20 },
		  'E-Mail-Address': { value: email, pos: 302, len: 80 },
		  
		  // Business information
		  'AR-Tax-Code': { value: arTaxCode, pos: 382, len: 10 },
		  'Terms-Code': { value: termsCode, pos: 392, len: 20 },
		  'Sales-agent-id': { value: salesAgentId, pos: 412, len: 8 },
		  'CSR-ID': { value: csrId, pos: 420, len: 3 },
		  'territory-id': { value: '', pos: 423, len: 12 },
		  'Cust-ID-Bill-to': { value: '', pos: 435, len: 8 },
		  'Group-ID': { value: '', pos: 443, len: 12 },
		  'Priority': { value: 'Normal', pos: 455, len: 10 },
		  'Estimate-Markup-Pct': { value: '', pos: 465, len: 6 },
		  'Overs-Allowed': { value: '', pos: 471, len: 5 },
		  'Date-First-Order': { value: this.formatDate(new Date()), pos: 476, len: 10 },
		  'PO-Required': { value: poRequired, pos: 486, len: 1 },
		  'AR-Stmt': { value: '1', pos: 487, len: 1 },
		  'AR-Stmt-Dunning-Msg': { value: '0', pos: 488, len: 1 },
		  
		  // Inter-company settings
		  'Inter-company': { value: '0', pos: 489, len: 1 },
		  'System-ID-Inter-company': { value: '', pos: 490, len: 12 },
		  
		  // Banking and financial information
		  'Bank': { value: '', pos: 502, len: 20 },
		  'Bank-acct-num': { value: '', pos: 522, len: 20 },
		  'Sales-tax-exempt': { value: customer.taxExemptionCertificate ? '1' : '0', pos: 542, len: 20 },
		  'Credit-Limit': { value: '0', pos: 562, len: 14 },
		  
		  // Shipping information
		  'Shipment-Method-ID': { value: customer.shipMethod ? customer.shipMethod.toString().substring(0, 8) : '', pos: 576, len: 8 },
		  'Tax-Number': { value: customer.taxExemptionCertificate || '', pos: 584, len: 20 },
		  'Addl-Tax-Number': { value: '', pos: 604, len: 20 },
		  'Industry-Code': { value: customer.accountType ? customer.accountType.toString().substring(0, 8) : '', pos: 624, len: 8 },
		  
		  // Locale and system settings
		  'Locale-ID': { value: 'en_US', pos: 632, len: 6 },
		  'Prograph-Customer-Type': { value: '0', pos: 638, len: 1 },
		  'Prograph-Shipper': { value: '0', pos: 639, len: 1 },
		  'Prograph-Paper-Owner': { value: '0', pos: 640, len: 1 },
		  'Prograph-Advertiser': { value: '0', pos: 641, len: 1 },
		  'Prograph-Advertising-Agency': { value: '0', pos: 642, len: 1 },
		  
		  // Web access flags
		  'Allow-PSF-Access': { value: '0', pos: 643, len: 1 },
		  'PSF-Auto-Accept-Orders': { value: '0', pos: 644, len: 1 },
		  'PrinterSite-Exchange': { value: '0', pos: 645, len: 1 },
		  'Available-in-PrintStream': { value: '0', pos: 646, len: 1 },
		  
		  // PrinterSite settings
		  'PS-Fulfillment': { value: '', pos: 647, len: 8 },
		  'PS-Franchise-Number': { value: '', pos: 655, len: 30 },
		  'PS-Store-Number': { value: '', pos: 685, len: 30 },
		  'PS-Credit-Hold': { value: '0', pos: 715, len: 1 },
		  
		  // Finance and AR settings
		  'AR-Stmt-Finance-Chrg': { value: '0', pos: 716, len: 1 },
		  'Allow-OPS': { value: '0', pos: 717, len: 1 },
		  'iQuote-Customer-ID': { value: '', pos: 718, len: 15 },
		  
		  // Document delivery options
		  'ARStatementDelivery': { value: 'Printer', pos: 733, len: 7 },
		  'BatchCloseInvDelivery': { value: 'Printer', pos: 740, len: 7 },
		  'PointOfTitleTransfer': { value: 'Origin', pos: 747, len: 11 }
		};
	  });
	}
	
	/**
	 * Generate fixed-width customer import file
	 * @returns {string} Fixed-width text file content
	 */
	generateCustomerImportFile() {
	  const customers = this.mapCustomerListToMonarch();
	  let result = '';
	  
	  customers.forEach(customer => {
		// Create a line of spaces with the exact length required (758 characters)
		const line = new Array(758).fill(' ');
		
		// Place each field at its proper position
		for (const [field, def] of Object.entries(customer)) {
		  if (def.value !== undefined) {
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
	 * Format a date to MM/DD/YYYY format
	 * @param {Date} date - Date object
	 * @returns {string} Formatted date string
	 */
	formatDate(date) {
	  const month = (date.getMonth() + 1).toString().padStart(2, '0');
	  const day = date.getDate().toString().padStart(2, '0');
	  const year = date.getFullYear();
	  return `${month}/${day}/${year}`;
	}
	
	/**
	 * Download generated file
	 * @param {string} content - Text content
	 * @param {string} filename - Name to save file as
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
	 * Process customer list file and generate Monarch import file
	 * @param {File} file - Customer list file
	 * @returns {Promise} Promise resolving to result object
	 */
	async processFile(file) {
	  try {
		// Parse the file
		await this.parseCustomerListFile(file);
		
		// Generate and download import file
		const customerImport = this.generateCustomerImportFile();
		this.downloadTextFile(customerImport, 'monarch_customer_import.txt');
		
		// Store in localStorage for the viewer
		localStorage.setItem('monarch_customer_import', customerImport);
		
		return {
		  success: true,
		  message: 'Customer import file generated successfully!'
		};
	  } catch (error) {
		console.error('Error processing customer list:', error);
		return {
		  success: false,
		  message: `Error processing customer list: ${error.message}`
		};
	  }
	}
  }

/**
 * Monarch File Viewer
 * 
 * A standalone component that can be added to display and validate 
 * the fixed-width files generated by the Monarch Importer.
 */
class MonarchFileViewer {

	constructor() {
		this.currentFileContent = null;
		this.currentFileType = null;
		this.fieldDefinitions = {
		  customer: [
			{ name: 'Cust-code', pos: 1, len: 8, color: '#ffcccb' },
			{ name: 'Cust-name', pos: 9, len: 40, color: '#c2f0c2' },
			{ name: 'Address-1', pos: 49, len: 40, color: '#ccd9ff' },
			{ name: 'Address-2', pos: 89, len: 40, color: '#ffffcc' },
			{ name: 'Address-3', pos: 129, len: 40, color: '#e6ccff' },
			{ name: 'City', pos: 169, len: 40, color: '#ffd9cc' },
			{ name: 'State', pos: 209, len: 3, color: '#ccffff' },
			{ name: 'Zip', pos: 212, len: 10, color: '#ffccf9' },
			{ name: 'Country', pos: 222, len: 40, color: '#ccffe6' },
			{ name: 'Phone', pos: 262, len: 20, color: '#ffe6cc' },
			{ name: 'FAX', pos: 282, len: 20, color: '#e6ffcc' },
			{ name: 'E-Mail-Address', pos: 302, len: 80, color: '#ffcccc' },
			{ name: 'AR-Tax-Code', pos: 382, len: 10, color: '#cce6ff' },
			{ name: 'Terms-Code', pos: 392, len: 20, color: '#f9ccff' },
			{ name: 'Sales-agent-id', pos: 412, len: 8, color: '#fff0cc' },
			{ name: 'CSR-ID', pos: 420, len: 3, color: '#cce6e6' },
			{ name: 'territory-id', pos: 423, len: 12, color: '#e6cce6' },
			{ name: 'Cust-ID-Bill-to', pos: 435, len: 8, color: '#ccffe0' },
			{ name: 'Group-ID', pos: 443, len: 12, color: '#ffd9cc' },
			{ name: 'Priority', pos: 455, len: 10, color: '#d9ffcc' },
			{ name: 'Estimate-Markup-Pct', pos: 465, len: 6, color: '#ffcce6' },
			{ name: 'Overs-Allowed', pos: 471, len: 5, color: '#ccffaa' },
			{ name: 'Date-First-Order', pos: 476, len: 10, color: '#aaccff' },
			{ name: 'PO-Required', pos: 486, len: 1, color: '#ffaacc' },
			{ name: 'AR-Stmt', pos: 487, len: 1, color: '#aaffcc' },
			{ name: 'AR-Stmt-Dunning-Msg', pos: 488, len: 1, color: '#ffccaa' },
			{ name: 'Inter-company', pos: 489, len: 1, color: '#ccaaff' },
			{ name: 'System-ID-Inter-company', pos: 490, len: 12, color: '#aaffff' },
			{ name: 'Bank', pos: 502, len: 20, color: '#ffffaa' },
			{ name: 'Bank-acct-num', pos: 522, len: 20, color: '#aacccc' },
			{ name: 'Sales-tax-exempt', pos: 542, len: 20, color: '#ffaaaa' },
			{ name: 'Credit-Limit', pos: 562, len: 14, color: '#ccaaaa' },
			{ name: 'Shipment-Method-ID', pos: 576, len: 8, color: '#aaaacc' },
			{ name: 'Tax-Number', pos: 584, len: 20, color: '#ccccaa' },
			{ name: 'Addl-Tax-Number', pos: 604, len: 20, color: '#aaaaaa' },
			{ name: 'Industry-Code', pos: 624, len: 8, color: '#ffddaa' },
			{ name: 'Locale-ID', pos: 632, len: 6, color: '#aaddff' },
			{ name: 'Prograph-Customer-Type', pos: 638, len: 1, color: '#ddaaff' },
			{ name: 'Prograph-Shipper', pos: 639, len: 1, color: '#ffaadd' },
			{ name: 'Prograph-Paper-Owner', pos: 640, len: 1, color: '#aaffdd' },
			{ name: 'Prograph-Advertiser', pos: 641, len: 1, color: '#ddffaa' },
			{ name: 'Prograph-Advertising-Agency', pos: 642, len: 1, color: '#aaddaa' },
			{ name: 'Allow-PSF-Access', pos: 643, len: 1, color: '#ddaaaa' },
			{ name: 'PSF-Auto-Accept-Orders', pos: 644, len: 1, color: '#aaaadd' },
			{ name: 'PrinterSite-Exchange', pos: 645, len: 1, color: '#ddddaa' },
			{ name: 'Available-in-PrintStream', pos: 646, len: 1, color: '#aadddd' },
			{ name: 'PS-Fulfillment', pos: 647, len: 8, color: '#dddddd' },
			{ name: 'PS-Franchise-Number', pos: 655, len: 30, color: '#ffaaff' },
			{ name: 'PS-Store-Number', pos: 685, len: 30, color: '#aaffaa' },
			{ name: 'PS-Credit-Hold', pos: 715, len: 1, color: '#ffaaaa' },
			{ name: 'AR-Stmt-Finance-Chrg', pos: 716, len: 1, color: '#aaaaff' },
			{ name: 'Allow-OPS', pos: 717, len: 1, color: '#ffffaa' },
			{ name: 'iQuote-Customer-ID', pos: 718, len: 15, color: '#aaffff' },
			{ name: 'ARStatementDelivery', pos: 733, len: 7, color: '#ffaabb' },
			{ name: 'BatchCloseInvDelivery', pos: 740, len: 7, color: '#aabbff' },
			{ name: 'PointOfTitleTransfer', pos: 747, len: 11, color: '#ffbbaa' }
		  ],
		  job: [
			{ name: 'job_id', pos: 1, len: 8, color: '#ffcccb' },
			{ name: 'sub_job_id', pos: 9, len: 4, color: '#c2f0c2' },
			{ name: 'job_description', pos: 13, len: 254, color: '#ccd9ff' },
			{ name: 'job_type', pos: 267, len: 19, color: '#ffffcc' },
			{ name: 'item_id', pos: 286, len: 15, color: '#e6ccff' },
			{ name: 'cust_ordered_by', pos: 301, len: 8, color: '#ffd9cc' },
			{ name: 'cust_billed_to', pos: 309, len: 8, color: '#ccffff' },
			{ name: 'sales_class_id', pos: 317, len: 8, color: '#ffccf9' },
			{ name: 'po_number', pos: 325, len: 20, color: '#ccffe6' },
			{ name: 'date_promised', pos: 345, len: 10, color: '#ffe6cc' },
			{ name: 'ship_date', pos: 355, len: 10, color: '#e6ffcc' },
			{ name: 'qty_ordered', pos: 365, len: 11, color: '#ffcccc' },
			{ name: 'priority', pos: 376, len: 10, color: '#cce6ff' },
			{ name: 'contact_name', pos: 386, len: 30, color: '#f9ccff' },
			{ name: 'expense_code', pos: 416, len: 24, color: '#fff0cc' },
			{ name: 'shop_floor_active', pos: 440, len: 1, color: '#cce6e6' },
			{ name: 'form_number', pos: 441, len: 20, color: '#e6cce6' },
			{ name: 'quotation_amount', pos: 461, len: 15, color: '#ccffe0' },
			{ name: 'unit_of_measure_id', pos: 476, len: 4, color: '#ffd9cc' },
			{ name: 'unit_price', pos: 480, len: 16, color: '#d9ffcc' },
			{ name: 'job_title', pos: 496, len: 50, color: '#ffcce6' }
		  ]
		};
	  }
  
	/**
	 * Initialize the viewer UI
	 */
	initialize() {
	  // Create the viewer container
	  const container = document.createElement('div');
	  container.className = 'file-viewer-container';
	  container.innerHTML = `
		<h2>File Viewer</h2>
		<div class="file-selector">
		  <button id="view-customer-btn" class="viewer-btn">View Customer File</button>
		  <button id="view-job-btn" class="viewer-btn">View Job File</button>
		  <div id="file-position-display" class="position-display">Position: <span id="current-position">0</span></div>
		</div>
		<div id="viewer-content" class="viewer-content"></div>
		<div id="field-key" class="field-key"></div>
	  `;
	  
	  // Add CSS styles
	//   this.addStyles();
	  
	  // Add the container to the page
	  document.querySelector('.container').appendChild(container);
	  
	  // Set up event listeners
	  document.getElementById('view-customer-btn').addEventListener('click', () => {
		this.loadFile('customer');
	  });
	  
	  document.getElementById('view-job-btn').addEventListener('click', () => {
		this.loadFile('job');
	  });
	}
  
	/**
	 * Load a file into the viewer
	 * @param {string} fileType - Type of file ('customer' or 'job')
	 */
	loadFile(fileType) {
	  this.currentFileType = fileType;
	  
	  // Get file content from localStorage where the MonarchImporter stored it
	  const fileKey = fileType === 'customer' ? 'monarch_customer_import' : 'monarch_job_import';
	  this.currentFileContent = localStorage.getItem(fileKey);
	  
	  // If there's no file content yet, show a placeholder
	  if (!this.currentFileContent) {
		// Use sample data for demonstration
		this.currentFileContent = this.getSampleData(fileType);
	  }
	  
	  this.displayFile();
	}
  
	/**
	 * Display the file content with highlighting
	 */
	displayFile() {
		if (!this.currentFileContent || !this.currentFileType) {
			document.getElementById('viewer-content').innerHTML = 
			  '<div class="empty-message">No file loaded. Generate files first or select a file type.</div>';
			document.getElementById('field-key').innerHTML = '';
			return;
		  }
		  
		  const viewerContent = document.getElementById('viewer-content');
		  const fieldKey = document.getElementById('field-key');
		  const fields = this.fieldDefinitions[this.currentFileType];
		  
		  // Split the file content into lines
		  const lines = this.currentFileContent.split('\n');
		  
		  let html = '<div class="content-wrapper" style="position: relative;">';
		  
		  // Add position rulers at the top
		  html += '<div class="position-ruler" style="height: 20px; margin-left: 40px; position: relative; margin-bottom: 5px;">';
		  for (let i = 0; i <= 700; i += 10) {
			html += `<span style="position: absolute; left: ${i * 7.8}px; top: 0; font-size: 9px; color: #999;">${i}</span>`;
			if (i > 0) {
			  html += `<span style="position: absolute; left: ${i * 7.8}px; top: 10px; height: 5px; border-left: 1px solid #ddd;"></span>`;
			}
		  }
		  html += '</div>';
		  
		  lines.forEach((line, lineIndex) => {
			if (!line.trim()) return;
			
			// Add line number
			html += `<div class="line"><span class="line-number">${lineIndex + 1}</span>`;
			
			// Process the line character by character
			for (let i = 0; i < line.length; i++) {
			  const charPos = i + 1; // 1-based position
			  const char = line[i] === ' ' ? '&nbsp;' : line[i];
			  
			  // Find if this character belongs to a field
			  let field = fields.find(f => charPos >= f.pos && charPos < f.pos + f.len);
			  
			  if (field) {
				html += `<span class="highlight" style="background-color: ${field.color}" title="${field.name} (${charPos})">${char}</span>`;
			  } else {
				html += char;
			  }
			}
			
			html += '</div>';
		  });
		  
		  html += '</div>';
		  
		  // Display the highlighted content
		  viewerContent.innerHTML = html;
		  
		  // Add the field key with sorting
		  let keyHtml = '';
		  
		  // Sort fields by position
		  const sortedFields = [...fields].sort((a, b) => a.pos - b.pos);
		  
		  sortedFields.forEach(field => {
			keyHtml += `
			  <div class="field-item">
				<div class="color-box" style="background-color: ${field.color}"></div>
				<span class="field-name">${field.name}</span>
				<span class="field-pos">(${field.pos}-${field.pos + field.len - 1})</span>
			  </div>
			`;
		  });
		  
		  fieldKey.innerHTML = keyHtml;
		  
		  // Set up mousemove to show current position
		  viewerContent.addEventListener('mousemove', this.trackMousePosition.bind(this));
	}
  
	/**
	 * Track mouse position to show the current character position
	 * @param {MouseEvent} event - Mouse event
	 */
	trackMousePosition(event) {
		// We need to get the position relative to the content area
		const viewerContent = document.getElementById('viewer-content');
		const viewerRect = viewerContent.getBoundingClientRect();
		
		// Calculate the exact position considering scroll position
		const scrollLeft = viewerContent.scrollLeft || 0;
		// const x = event.clientX - viewerRect.left + scrollLeft;
		// that is always saying 2 further than it should be
		const x = event.clientX - viewerRect.left + scrollLeft - 10;
		
		// Calculate the position based on the monospace font width
		const charWidth = 7.8; // Approximate width of monospace character
		const lineNumOffset = 40; // Width of line number area
		
		let position = Math.floor((x - lineNumOffset) / charWidth) + 1;
		position = Math.max(1, position);
		
		// Update the position display
		document.getElementById('current-position').textContent = position;
		
		// Find which field this position belongs to
		if (this.currentFileType) {
			const fields = this.fieldDefinitions[this.currentFileType];
			const field = fields.find(f => position >= f.pos && position < f.pos + f.len);
			
			// Update the display with field information if found
			if (field) {
				document.getElementById('current-position').textContent = 
					`${position} (${field.name}: ${position - field.pos + 1}/${field.len})`;
			}
		}
	}
  
	/**
	 * Set the file content to display
	 * @param {string} content - File content
	 * @param {string} fileType - Type of file ('customer' or 'job')
	 */
	setFileContent(content, fileType) {
	  if (content && fileType) {
		this.currentFileContent = content;
		this.currentFileType = fileType;
		
		// Store in localStorage for persistence between page loads
		const fileKey = fileType === 'customer' ? 'monarch_customer_import' : 'monarch_job_import';
		localStorage.setItem(fileKey, content);
		
		this.displayFile();
	  }
	}
  
	/**
	 * Get sample data for demonstration
	 * @param {string} fileType - Type of file ('customer' or 'job')
	 * @returns {string} Sample file content
	 */
	getSampleData(fileType) {
	// 	if (fileType === 'customer') {
	// 	// Sample data with the correct field positions as per the requirements
	// 	return `Sendoso  Sendoso                                447 Battery St Ste 200                                                          San Francisco                        CA94111-3235  USA                                       (415) 555-1212                    info@sendoso.com                                                                              NET30     00000000000                                      04/02/2025000N0                                                                                                                                                                   en_US 000000000000000000000                                                                    000               PrinterPrinterOrigin     
	// Postal   Postal.io Inc                          75 Higuera St Ste 240                                                           San Luis Obispo                     CA93401-5425  USA                                       (805) 555-2020                    contact@postal.io                                                                              NET30     00000000000                                      04/02/2025000N0                                                                                                                                                                   en_US 000000000000000000000                                                                    000               PrinterPrinterOrigin     
	// HIGHGRAD HIGH GRADE USA                        2430 E University Dr.                                                           Phoenix                             AZ85034       USA                                       (847) 208-4198                    allie@highgradeusa.com                                                                          NET30     00000000000                                      04/02/2025000N0                                                                                                                                                                   en_US 000000000000000000000                                                                    000               PrinterPrinterOrigin     `;
	// 	} else {
	// 	// Keep the existing job sample data
	// 	return `00058520    Wide Format Vinyl : Autodesk Poster                                                                                                                                                                                                                           FG                                Sendoso Sendoso                             01/26/202512/27/20242.00       2                                                               1                    44.00          EA  22.00           Wide Format Vinyl : Autodesk Poster                              
	// 00058520    Shipping                                                                                                                                                                                                                                                      FG                                Sendoso Sendoso                             01/26/202512/27/20240.00       2                                                               1                    45.00          EA  45.00           Shipping                                                         
	// 00058531    Booklet - 6.5 square                                                                                                                                                                                                                                         FG                                Postal  Postal                                                   1.00       2                                                               1                    20.00          EA  0.00            Booklet - 6.5 square                                             
	// 00058700    Die Creation : 7.4 x 1.94 - perf seal                                                                                                                                                                                                                         FG                                HIGHGRADHIGHGRAD                            01/26/202512/27/20241.00       2                                                               1                    174.00         EA  174.00          Die Creation : 7.4 x 1.94 - perf seal                            
	// 00058700    Shipping                                                                                                                                                                                                                                                      FG                                HIGHGRADHIGHGRAD                            01/26/202512/27/20240.00       2                                                               1                    0.00           EA  0.00            Shipping                                                         `;
	// 	}

		// just return no data
		return '';
	}
  }



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
   * Update the parseCSVFile method to initialize customer defaults
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
	// Split into lines
	const lines = csvString.split('\n');
	if (lines.length === 0) return [];
	
	// Extract headers
	const headers = lines[0].split(',').map(header => header.trim());
	
	const result = [];
	for (let i = 1; i < lines.length; i++) {
	  if (lines[i].trim() === '') continue;
	  
	  // Fix for product description field
	  // We need to specifically handle the Line: Product Name field that 
	  // might contain information after the description (like billing info)
	  
	  // Create an object for this row
	  const obj = {};
	  let currentLine = lines[i];
	  
	  // Extract each field based on expected position
	  for (let j = 0; j < headers.length; j++) {
		  const fieldParts = currentLine.split(',', 1);
		  const fieldValue = fieldParts[0].trim();
		  obj[headers[j]] = fieldValue;
		  
		  // Remove the processed part from the current line
		  currentLine = currentLine.substring(fieldValue.length + 1);
	  }
	  
	  result.push(obj);
	}
	
	return result;
  }
  
  /**
   * Alternative implementation using a proper CSV parsing library
   * Replace the original parseCSV with this when using PapaParse
   */
  parseCSVWithPapaParse(csvString) {
	// Using PapaParse library for robust CSV parsing
	const results = Papa.parse(csvString, {
	  header: true,
	  skipEmptyLines: true,
	  transform: (value, field) => {
		// For product name field, ensure we're only getting the actual product description
		if (field === 'Line: Product Name') {
		  // The actual product name should be the full field value since PapaParse 
		  // handles CSV parsing correctly
		  return value.trim();
		}
		return value.trim();
	  }
	});
	
	return results.data;
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
	 * Format a date string to mm/dd/yyyy format
	 * @param {string} dateString - Input date string
	 * @returns {string} Formatted date string
	 */
	formatDate(dateString) {
	  try {
		const date = new Date(dateString);
		return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
	  } catch (e) {
		return '';
	  }
	}
	
/**
 * this entire method is now redundant and it needs to go
 */
mapCustomersToMonarch() {
	return this.customerData.map(customer => {
	  // Extract customer ID and ensure it's limited to 8 characters
	  const custCode = (customer['Customer ID'] || '').substring(0, 8);
	  
	  // Map additional fields from CSV that make logical sense
	  const arTaxCode = customer['G/L Sales Account'] || ''; // Use G/L Sales Account for AR Tax Code
	  const termsCode = customer['Terms Type'] || '';
	  const salesAgentId = customer['Sales Representative ID'] || '000000000';
	  const csrId = customer['CSR ID'] || '000';
	  
	  // Map billing information
	  const customerType = customer['Customer Type'] || '';
	  
	  // Determine customer status flags
	  const inactive = customer['Inactive'] === 'TRUE' || customer['Inactive'] === '1' ? '1' : '0';
	  
	  // Terms and finance information
	  const dueMonthEndTerms = customer['Due Month End Terms'] === 'TRUE' || customer['Due Month End Terms'] === '1' ? '1' : '0';
	  const financeCharges = customer['Charge Finance Charges'] === 'TRUE' || customer['Charge Finance Charges'] === '1' ? '1' : '0';
	  const creditLimit = customer['Credit Limit'] || '0';
	  const creditStatus = customer['Credit Status'] || '';
	  
	  // Determine if PO is required
	  const poRequired = customer['Use Standard Terms'] === 'FALSE' || customer['Use Standard Terms'] === '0' ? '1' : '0';
	  
	  // Shipping information
	  const shipVia = customer['Ship Via'] || '';
	  
	  // Use account number for custom fields if appropriate
	  const accountNum = customer['Account #'] || '';
	  
	  // Payment information
	  const paymentMethod = customer['Customer Payment Method'] || '';
	  
	  return {
		// Customer identification - positions based on the provided requirements
		'Cust-code': { value: '1', pos: 1, len: 8 },
		'Cust-name': { value: customer['Customer Name'] || '', pos: 9, len: 40 },
		
		// Address information
		'Address-1': { value: customer['Bill to Address-Line One'] || '', pos: 49, len: 40 },
		'Address-2': { value: customer['Bill to Address-Line Two'] || '', pos: 89, len: 40 },
		'Address-3': { value: '', pos: 129, len: 40 }, // No direct mapping in CSV
		'City': { value: customer['Bill to City'] || '', pos: 169, len: 40 },
		'State': { value: customer['Bill to State'] || '', pos: 209, len: 3 },
		'Zip': { value: customer['Bill to Zip'] || '', pos: 212, len: 10 },
		'Country': { value: customer['Bill to Country'] || 'USA', pos: 222, len: 40 },
		
		// Contact information
		'Phone': { value: customer['Telephone 1'] || '', pos: 262, len: 20 },
		'FAX': { value: customer['Fax Number'] || '', pos: 282, len: 20 },
		'E-Mail-Address': { value: customer['Customer E-mail'] || '', pos: 302, len: 80 },
		
		// Business information - Enhanced with better mappings
		'AR-Tax-Code': { value: arTaxCode, pos: 382, len: 10 }, // Using G/L Sales Account
		'Terms-Code': { value: termsCode, pos: 392, len: 20 },
		'Sales-agent-id': { value: salesAgentId, pos: 412, len: 8 },
		'CSR-ID': { value: csrId, pos: 420, len: 3 },
		'territory-id': { value: '', pos: 423, len: 12 }, // No direct mapping
		'Cust-ID-Bill-to': { value: '', pos: 435, len: 8 }, // No direct mapping for master billing
		'Group-ID': { value: accountNum.substring(0, 12), pos: 443, len: 12 }, // Use Account # if available
		'Priority': { value: creditStatus === 'Good' ? 'High' : 'Normal', pos: 455, len: 10 }, // Set priority based on credit status
		'Estimate-Markup-Pct': { value: '', pos: 465, len: 6 }, // No direct mapping
		'Overs-Allowed': { value: '', pos: 471, len: 5 }, // No direct mapping
		'Date-First-Order': { value: this.formatDate(new Date()), pos: 476, len: 10 }, // Current date as default
		'PO-Required': { value: poRequired, pos: 486, len: 1 }, // Based on Use Standard Terms
		'AR-Stmt': { value: '1', pos: 487, len: 1 }, // Default to Yes for AR statements
		'AR-Stmt-Dunning-Msg': { value: creditStatus === 'Hold' ? '1' : '0', pos: 488, len: 1 }, // Enable dunning for credit holds
		
		// Inter-company settings
		'Inter-company': { value: '0', pos: 489, len: 1 }, // Default to No
		'System-ID-Inter-company': { value: '', pos: 490, len: 12 },
		
		// Banking and financial information
		'Bank': { value: '', pos: 502, len: 20 }, // No direct mapping
		'Bank-acct-num': { value: '', pos: 522, len: 20 }, // No direct mapping
		'Sales-tax-exempt': { value: customer['Bill to Sales Tax ID'] || '', pos: 542, len: 20 },
		'Credit-Limit': { value: creditLimit, pos: 562, len: 14 },
		
		// Shipping information
		'Shipment-Method-ID': { value: shipVia.substring(0, 8), pos: 576, len: 8 },
		'Tax-Number': { value: customer['Bill to Sales Tax ID'] || '', pos: 584, len: 20 },
		'Addl-Tax-Number': { value: '', pos: 604, len: 20 }, // No direct mapping
		'Industry-Code': { value: customerType.substring(0, 8), pos: 624, len: 8 },
		
		// Locale and system settings
		'Locale-ID': { value: customer['Bill to Country'] === 'USA' ? 'en_US' : 'en_US', pos: 632, len: 6 }, // Default to en_US but could be mapped based on country
		'Prograph-Customer-Type': { value: '0', pos: 638, len: 1 },
		'Prograph-Shipper': { value: '0', pos: 639, len: 1 },
		'Prograph-Paper-Owner': { value: '0', pos: 640, len: 1 },
		'Prograph-Advertiser': { value: '0', pos: 641, len: 1 },
		'Prograph-Advertising-Agency': { value: '0', pos: 642, len: 1 },
		
		// Web access flags (all default to 0)
		'Allow-PSF-Access': { value: '0', pos: 643, len: 1 },
		'PSF-Auto-Accept-Orders': { value: '0', pos: 644, len: 1 },
		'PrinterSite-Exchange': { value: '0', pos: 645, len: 1 },
		'Available-in-PrintStream': { value: '0', pos: 646, len: 1 },
		
		// PrinterSite settings
		'PS-Fulfillment': { value: '', pos: 647, len: 8 },
		'PS-Franchise-Number': { value: '', pos: 655, len: 30 },
		'PS-Store-Number': { value: '', pos: 685, len: 30 },
		'PS-Credit-Hold': { value: creditStatus === 'Hold' ? '1' : '0', pos: 715, len: 1 }, // Use credit status to determine hold
		
		// Finance and AR settings
		'AR-Stmt-Finance-Chrg': { value: financeCharges, pos: 716, len: 1 },
		'Allow-OPS': { value: '0', pos: 717, len: 1 },
		'iQuote-Customer-ID': { value: '', pos: 718, len: 15 },
		
		// Document delivery options - use email if available
		'ARStatementDelivery': { value: customer['Customer E-mail'] ? 'E-Mail' : 'Printer', pos: 733, len: 7 },
		'BatchCloseInvDelivery': { value: customer['Customer E-mail'] ? 'E-Mail' : 'Printer', pos: 740, len: 7 },
		'PointOfTitleTransfer': { value: 'Origin', pos: 747, len: 11 }
	  };
	});
  }
  
/**
 * Generate fixed-width customer import file
 * @returns {string} Fixed-width text file content
 */
generateCustomerImportFile() {
	const customers = this.mapCustomersToMonarch();
	let result = '';
	
	customers.forEach(customer => {
	  // Create a line of spaces with the exact length required (758 characters)
	  // The last field ends at position 758 (747 + 11)
	  const line = new Array(758).fill(' ');
	  
	  // Place each field at its proper position
	  for (const [field, def] of Object.entries(customer)) {
		if (def.value !== undefined) {
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
 * Format a date to mm/dd/yyyy format (US format)
 * @param {Date} date - Date object to format
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
		
		// Generate and download Monarch import files
		// const customerImport = this.generateCustomerImportFile();
		const jobImport = this.generateJobImportFile();
		
		// this.downloadTextFile(customerImport, 'monarch_customer_import.txt');
		this.downloadTextFile(jobImport, 'monarch_job_import.txt');
		
		return {
		  success: true,
		  message: 'Monarch import files generated successfully!'
		};
	  } catch (error) {
		console.error('Error processing files:', error);
		return {
		  success: false,
		  message: `Error processing files: ${error.message}`
		};
	  }
	}

	/**
 * Clean up product descriptions to remove trailing information
 * 
 * Add this function to your MonarchImporter class to handle the description issue.
 * Then call it from the mapOrdersToMonarch function before using the product name.
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
   * Usage in mapOrdersToMonarch:
   * 
   * // Get clean product description
   * const rawProductName = order['Line: Product Name'] || '';
   * const productName = this.cleanProductDescription(rawProductName);
   * 
   * // Then use productName for job_description and job_title
   * 'job_description': { value: productName.substring(0, 254), pos: 13, len: 254 },
   * ...
   * 'job_title': { value: productName.substring(0, 50), pos: 496, len: 50 },
   */

  }
  
  // Main application code
  document.addEventListener('DOMContentLoaded', function() {

	// clear the local storage
	localStorage.clear();

	  // Tab switching functionality (add this at the start)
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

  // Original Job Import Elements (rename existing elements to match the new HTML)
  const zipDropzone = document.getElementById('zip-dropzone');
  const zipFileInput = document.getElementById('zip-file');
  const customerFileInput = document.getElementById('customer-file');
  const orderFileInput = document.getElementById('order-file');
  const paymentFileInput = document.getElementById('payment-file');
  // Change this line: update the ID to match the new HTML
  const generateJobBtn = document.getElementById('generate-job-btn');
  
  // New Customer Import Elements (add these new elements)
  const customerListDropzone = document.getElementById('customer-list-dropzone');
  const customerListFileInput = document.getElementById('customer-list-file');
  const generateCustomerBtn = document.getElementById('generate-customer-btn');
  
  // Log element (keep this the same)
  const logElement = document.getElementById('log');
	
	// Store file objects
	const files = {
	  customer: null,
	  order: null,
	  payment: null
	};
	
  // Store customer list file (add this)
  let customerListFile = null;
  
  // Create importer instances
  const monarchImporter = new MonarchImporter();
  // Add this line:
  const customerListImporter = new CustomerListImporter();
  
// Initialize the file viewer
const fileViewer = new MonarchFileViewer();
fileViewer.initialize();

  
  // Helper function to log messages (keep this)
  function logMessage(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = message;
    logElement.appendChild(logEntry);
    logElement.scrollTop = logElement.scrollHeight;
  }
	
  // Update file status indicators (modify this to match the new button ID)
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
    
    // Enable/disable generate button (update this line to match the new button ID)
    generateJobBtn.disabled = !(files.customer && files.order);
  }
 
    // Add new function for customer list status
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
	  }
	});
	
	// Process uploaded ZIP file
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
	
	 // Add new customer list drag and drop handlers
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
	  
	  customerListDropzone.addEventListener('drop', (e) => {
		e.preventDefault();
		e.stopPropagation();
		customerListDropzone.classList.remove('highlight');
		
		const droppedFiles = e.dataTransfer.files;
		if (droppedFiles.length > 0) {
		  const file = droppedFiles[0];
		  if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
			customerListFile = file;
			updateCustomerListStatus(true);
			logMessage(`Customer list file selected: ${file.name}`);
			processCustomerFile();
		  } else {
			logMessage('Please drop a CSV or Excel file.', 'error');
		  }
		}
	  });
	  
	  customerListDropzone.addEventListener('click', () => {
		customerListFileInput.click();
	  });
	  
	  customerListFileInput.addEventListener('change', (e) => {
		if (e.target.files.length > 0) {
		  customerListFile = e.target.files[0];
		  updateCustomerListStatus(true);
		  logMessage(`Customer list file selected: ${customerListFile.name}`);
		      // Process immediately if we have a valid file
			processCustomerFile();
		}
	  });
	
	  // Add a helper function for processing customer files
		function processCustomerFile() {
			if (customerListFile) {
			logMessage('Processing customer list file...');
				let fileViewer = new MonarchFileViewer();
				fileViewer.loadFile('customer');
			customerListImporter.processFile(customerListFile)
				.then(result => {
				if (result.success) {
					logMessage(result.message, 'success');
				} else {
					logMessage(result.message, 'error');
				}
				})
				.catch(error => {
				logMessage(`Error: ${error.message}`, 'error');
				});
			}
		}

		function processJobFiles() {
			if (files.customer && files.order) {
			  logMessage('Processing job files...');
			  // load the Monarch job import file into the file viewer
			  let fileViewer = new MonarchFileViewer();
			  fileViewer.loadFile('job');
			  monarchImporter.processFiles(files)
				.then(result => {
				  if (result.success) {
					logMessage(result.message, 'success');
				  } else {
					logMessage(result.message, 'error');
				  }
				})
				.catch(error => {
				  logMessage(`Error: ${error.message}`, 'error');
				});
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
	
	// Update this part to use the new button ID
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
			// load the Monarch job import file into the file viewer
			if (window.fileViewer) {
				window.fileViewer.loadFile('job');
			}
		  } else {
			logMessage(result.message, 'error');
		  }
		} catch (error) {
		  logMessage(`Error: ${error.message}`, 'error');
		}
	  });
	  

	logMessage('Ready to process files. Upload ZIP or individual CSV files to begin.');

	  // Add new customer list button handler
	  generateCustomerBtn.addEventListener('click', async () => {
		if (!customerListFile) {
		  logMessage('No customer list file selected.', 'error');
		  return;
		}
		
		logMessage('Generating Monarch customer import file...');
		
		try {
		  const result = await customerListImporter.processFile(customerListFile);
		  
		  if (result.success) {
			logMessage(result.message, 'success');
		  } else {
			logMessage(result.message, 'error');
		  }
		} catch (error) {
		  logMessage(`Error: ${error.message}`, 'error');
		}
	  });

	/**
	 * Add this code to the end of your DOMContentLoaded event handler
	 * to integrate the file viewer with your existing code.
	 */

	/**
	 * Fix for empty file downloads
	 * 
	 * Replace your processFiles integration code with this version
	 */

	// Modify the processFiles method in MonarchImporter to store files for the viewer
	// but keep the original download functionality
	const originalProcessFiles = MonarchImporter.prototype.processFiles;
	/**
	 * Process all files and generate Monarch import files
	 * @param {Object} files - Object containing File objects for customer, order, and payment CSV files
	 */
	MonarchImporter.prototype.processFiles = async function(files) {
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
		
		// Generate job import file only (like original)
		const jobImport = this.generateJobImportFile();
		
		// Download the job file
		this.downloadTextFile(jobImport, 'monarch_job_import.txt');
		
		// Store in localStorage for the viewer
		localStorage.setItem('monarch_job_import', jobImport);
		
		// Show the job file in the viewer automatically
		// if (window.fileViewer) {
		// 	window.fileViewer.loadFile('job');
		// }
		let fileViewer = new MonarchFileViewer();
		fileViewer.loadFile('job');
		
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
	};

	// Add this to your MonarchImporter class to fix product descriptions
	MonarchImporter.prototype.cleanProductDescription = function(description) {
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
	};

	/**
	 * Process customer list file and generate Monarch import file
	 * @param {File} file - Customer list file
	 * @returns {Promise} Promise resolving to result object
	 */
	CustomerListImporter.prototype.processFile = async function(file) {
		try {
		// Parse the file
		await this.parseCustomerListFile(file);
		
		// Generate and download import file
		const customerImport = this.generateCustomerImportFile();
		this.downloadTextFile(customerImport, 'monarch_customer_import.txt');
		
		// Store in localStorage for the viewer
		localStorage.setItem('monarch_customer_import', customerImport);
		
		// Show the customer file in the viewer automatically
		if (window.fileViewer) {
			window.fileViewer.loadFile('customer');
		}
		
		return {
			success: true,
			message: 'Customer import file generated successfully!'
		};
		} catch (error) {
		console.error('Error processing customer list:', error);
		return {
			success: false,
			message: `Error processing customer list: ${error.message}`
		};
		}
	};

	// // Modify the mapOrdersToMonarch method to use the cleanProductDescription function
	// const originalMapOrdersToMonarch = MonarchImporter.prototype.mapOrdersToMonarch;
	// MonarchImporter.prototype.mapOrdersToMonarch = function() {
	// // If the original doesn't exist yet, create a basic implementation
	// if (typeof originalMapOrdersToMonarch !== 'function') {
	// 	return this.orderData.map((order, index) => {
	// 	// All your existing code
		
	// 	// But use the cleaned product name:
	// 	const rawProductName = order['Line: Product Name'] || '';
	// 	const productName = this.cleanProductDescription(rawProductName);
		
	// 	return {
	// 		// All your fields with job_description and job_title using the clean product name
	// 		'job_description': { value: productName.substring(0, 254), pos: 13, len: 254 },
	// 		// etc.
	// 	};
	// 	});
	// }
	
	// // If the original exists, use it as a starting point
	// const jobs = originalMapOrdersToMonarch.call(this);
	
	// // Then modify each job to use the cleaned product name
	// return jobs.map(job => {
	// 	const order = this.orderData.find(o => o['Invoice Number'] === job.job_id.value.trim());
	// 	if (order && order['Line: Product Name']) {
	// 	const cleanName = this.cleanProductDescription(order['Line: Product Name']);
	// 	job.job_description.value = cleanName.substring(0, 254);
	// 	job.job_title.value = cleanName.substring(0, 50);
	// 	}
	// 	return job;
	// });
	// };

	// Simple file viewer integration
	// This avoids complex method replacement
	function setupFileViewerIntegration() {
		// Keep a reference to the original download functions
		const originalCustomerImporterDownload = CustomerListImporter.prototype.downloadTextFile;
		const originalMonarchImporterDownload = MonarchImporter.prototype.downloadTextFile;
		
		// Add localStorage and viewer update to customer importer
		CustomerListImporter.prototype.downloadTextFile = function(content, filename) {
		// Still do the original download
		originalCustomerImporterDownload.call(this, content, filename);
		
		// Store in localStorage and update viewer if it's a customer import file
		if (filename === 'monarch_customer_import.txt') {
			localStorage.setItem('monarch_customer_import', content);
			
			// Show the file in the viewer if it exists
			// if (window.fileViewer) {
			// window.fileViewer.loadFile('customer');
			// }
			let fileViewer = new MonarchFileViewer();
			fileViewer.loadFile('customer');
		}
		};
		
		// Add localStorage and viewer update to job importer
		MonarchImporter.prototype.downloadTextFile = function(content, filename) {
		// Still do the original download
		originalMonarchImporterDownload.call(this, content, filename);
		
		// Store in localStorage and update viewer if it's a job import file
		if (filename === 'monarch_job_import.txt') {
			localStorage.setItem('monarch_job_import', content);
			
			// Show the file in the viewer if it exists
			// if (window.fileViewer) {
			// window.fileViewer.loadFile('job');
			// }
			let fileViewer = new MonarchFileViewer();
			fileViewer.loadFile('job');
		}
		};
	}
	
	// Call this function to set up the file viewer integration
	setupFileViewerIntegration();
	
});	
