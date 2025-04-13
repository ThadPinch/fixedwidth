/**
 * Customer Import specific class for handling the standalone customer list import
 */

class CustomerListImporter {
	constructor() {
	  this.customerListData = [];
	  this.userListData = [];
	}
	
	/**
	 * Parse a ZIP file containing customer and user data
	 * @param {File} file - The ZIP file
	 * @returns {Promise} Promise resolving to the parsed data
	 */
	parseZipFile(file) {
		return new Promise(async (resolve, reject) => {
		  try {
			// Check if file is a ZIP file
			if (!file.name.endsWith('.zip')) {
			  reject(new Error('Please upload a ZIP file containing customer and user data.'));
			  return;
			}
			
			console.log('Starting ZIP processing:', file.name);
			
			// Load ZIP file using JSZip
			const zip = await JSZip.loadAsync(file);
			console.log('ZIP loaded, files found:', Object.keys(zip.files));
			
			let customerFileFound = false;
			let userFileFound = false;
			
			// Process all files in the ZIP
			const promises = [];
			
			// Look for customer and user files
			Object.keys(zip.files).forEach(filename => {
			  console.log('Processing file from ZIP:', filename);
			  // Skip directories
			  if (zip.files[filename].dir) return;
			  
			  // Process CSV files
			  if (filename.toLowerCase().endsWith('.csv')) {
				const filePromise = zip.files[filename].async('string').then(content => {
				  console.log(`Reading file ${filename}, content length: ${content.length}`);
				  // Output the first 200 chars to see what's in the file
				  console.log('Content preview:', content.substring(0, 200));
				  
				  // Check file type based on content or name
				  if (filename.toLowerCase() === 'list_customer_user.csv' || 
					  (content.includes('userID') && content.includes('contactEmail'))) {
					// This is the user list
					console.log('Found user file:', filename);
					this.parseUserCSV(content);
					userFileFound = true;
					 //i jsut want to make sure the file doesn't have the __MACOSX folder in it so don't use those files
				  } else if (!filename.toLowerCase().includes('__macosx')){
					// Assume this is the customer list
					console.log('Found customer file:', filename);
					this.parseCustomerCSV(content);
					customerFileFound = true;
				  }
				});
				
				promises.push(filePromise);
			  }
			});
			
			// Wait for all files to be processed
			await Promise.all(promises);
			
			console.log('All files processed. Customer file found:', customerFileFound, 'User file found:', userFileFound);
			console.log('Customer data length:', this.customerListData.length);
			console.log('User data length:', this.userListData.length);
			
			// Check if we found both required files
			if (!customerFileFound) {
			  reject(new Error('Customer list CSV not found in the ZIP file.'));
			  return;
			}
			
			if (!userFileFound) {
			  reject(new Error('User list CSV (list_customer_user.csv) not found in the ZIP file.'));
			  return;
			}
			
			// Success - both files processed
			resolve({
			  customers: this.customerListData,
			  users: this.userListData
			});
			
		  } catch (error) {
			console.error('ZIP processing error:', error);
			reject(new Error(`Error processing ZIP file: ${error.message}`));
		  }
		});
	  }
	
	/**
	 * Parse customer CSV content
	 * @param {string} csvContent - The CSV content as string
	 */
	parseCustomerCSV(csvContent) {
		try {
		  const results = Papa.parse(csvContent, {
			header: true,
			dynamicTyping: true,
			skipEmptyLines: true
		  });
		  
		  console.log('Customer CSV parsed:', results);
		  console.log('Headers:', results.meta.fields);
		  console.log('First row:', results.data[0]);
		  
		  this.customerListData = results.data;
		} catch (error) {
		  console.error('Error parsing customer CSV:', error);
		  throw new Error(`Error parsing customer CSV: ${error.message}`);
		}
	  }
	
	/**
	 * Parse user CSV content
	 * @param {string} csvContent - The CSV content as string
	 */
	parseUserCSV(csvContent) {
	  try {
		const results = Papa.parse(csvContent, {
		  header: true,
		  dynamicTyping: true,
		  skipEmptyLines: true
		});
		
		this.userListData = results.data;
	  } catch (error) {
		console.error('Error parsing user CSV:', error);
		throw new Error(`Error parsing user CSV: ${error.message}`);
	  }
	}
	
	/**
	 * Get user email by userID
	 * @param {number|string} userID - The userID to look up
	 * @returns {string} Email address or empty string if not found
	 */
	getUserEmail(userID) {
	  if (!userID) return '';
	  
	  // Convert userID to number for comparison if it's a numeric string
	  const numericUserID = typeof userID === 'string' ? 
		parseInt(userID, 10) : userID;
	  
	  // Find the user with matching userID
	  const user = this.userListData.find(u => {
		// Handle both numeric and string comparisons
		if (typeof u.userID === 'number') {
		  return u.userID === numericUserID;
		} else {
		  return u.userID === userID.toString();
		}
	  });
	  
	  // Return the email if found, otherwise empty string
	  return user ? (user.contactEmail || '') : '';
	}
	
	/**
	 * Map customer list data to Monarch format
	 * @returns {Array} Array of customer objects in Monarch format
	 */
	mapCustomerListToMonarch() {
		console.log('mapping customer list to monarch');
		console.log('Customer data:', this.customerListData);
		
		if (!this.customerListData || this.customerListData.length === 0) {
		  console.error('No customer data found to map');
		  return [];
		}
		
		// Get the first customer to inspect fields
		const firstCustomer = this.customerListData[0];
		console.log('First customer fields:', Object.keys(firstCustomer));
		
		let custCode = 0;
		return this.customerListData.map(customer => {
		  custCode++;
		  
		  // Field mapping - adjust these based on your actual CSV headers
		  // Example: If your CSV has "Company Name" instead of "accountName"
		  const custName = (customer.accountName || customer.customerName || customer["Company Name"] || '').toString().substring(0, 40);
		  
		  // Address information - adjust field names as needed
		  const address1 = (customer.btStreet || customer.address1 || customer["Street Address"] || '').toString().substring(0, 40);
		  const address2 = (customer.btAddress2 || customer.address2 || '').toString().substring(0, 40);
		  const address3 = (customer.btAddress3 || customer.address3 || '').toString().substring(0, 40);
		  const city = (customer.btCity || customer.city || customer.City || '').toString().substring(0, 40);
		  const state = (customer.btState || customer.state || customer.State || '').toString().substring(0, 3);
		  const zip = (customer.btZip || customer.zip || customer.Zip || '').toString().substring(0, 10);
		  const country = (customer.btCountry || customer.country || customer.Country || 'USA').toString().substring(0, 40);
		  
		  // Contact information
		  const phone = (customer.btTelephone || customer.phone || customer.Phone || '').toString().substring(0, 20);
		  const fax = (customer.btFax || customer.fax || customer.Fax || '').toString().substring(0, 20);
		  
		  // Get email from user list based on billContactUserID
		  let email = '';
		  // Try different field names for user ID
		  const userId = customer.billContactUserID || customer.userID || customer.userId || customer.user_id;
		  if (userId) {
			email = this.getUserEmail(userId);
			console.log(`Found user ID ${userId}, email: ${email}`);
		  }
		

		  let people = {
			"hyland": [35],
			"pinch": [0, 2, 32, 5, 6, 37, 40, 42, 44],
			"lawhon": [48]
		  };
		  
		  // Function to get the salesman name based on salesmanID
		  function getSalesmanName(salesmanID) {
			for (const [name, ids] of Object.entries(people)) {
			  if (ids.includes(parseInt(salesmanID))) {
				return name;
			  }
			}
			return 'pinch'; // Return pinch if no match is found
		  }
		  
		  // Get the sales agent id from the people array
		  // do some terms filtering here to maek it so it is their new  values.
		  // 1=taxable, 3=non taxable
		//   const arTaxCode = (customer.isTaxable === 'Y' ? 'Taxable' : 'NonTaxable');
		const arTaxCode = (customer.isTaxable === 'Y' ? '1' : '3');
		  
		  // do some terms filtering here to maek it so it is their new  values.
		  const termsCode = (customer.btTerms || '').toString().substring(0, 20);
		  
		  // Get the numeric salesmanID
		  const salesmanIDNum = parseInt(customer.salesmanID || '0');
		  
		  // Get the salesman name
		  const salesmanName = getSalesmanName(salesmanIDNum);
		  
		  // Set the salesAgentId - either the name if found, or the original formatted ID
		  const salesAgentId = salesmanName || (customer.salesmanID || '000000000').toString().substring(0, 8);
		// const csrId = (customer.csrID || '000').toString().substring(0, 3);
		const csrId = '';
		
		// Determine PO Required based on available data
		const poRequired = customer.requirePO === 'Y' ? '1' : '0';

		/**
		 * Mapping array for shipment methods to codes
		 * Maps the shipMethod ID to the corresponding code for Monarch import
		 */
		const shipMethodMap = [ 
			// UPS Methods (from Image 1)
			{ id: 5, method: "UPS Ground", code: "UPSGRND" },
			{ id: 6, method: "UPS 3 Day Select", code: "UPS3DAY" },
			{ id: 7, method: "UPS 2nd Day Air", code: "UPS2DAY" },
			{ id: 8, method: "UPS Next Day Air", code: "UPS1DAY" },
			{ id: 14, method: "UPS Next Day Air Saver", code: "UPS1DAY" },
			{ id: 15, method: "UPS Next Day Air Early A.M.", code: "UPS1DAY" },
			{ id: 17, method: "UPS 2nd Day Air A.M.", code: "UPS2DAY" },
			{ id: 19, method: "UPS Next Day Air Early A.M. (Saturday)", code: "UPS1DAY" },
			{ id: 20, method: "UPS Next Day Air (Saturday)", code: "UPS1DAY" },
			{ id: 21, method: "UPS 2nd Day Air (Saturday)", code: "UPS2DAY" },
			{ id: 24, method: "UPS Saver", code: "UPSSAVR" },
			{ id: 25, method: "UPS Worldwide Express", code: "UPSWWEX" },
			{ id: 26, method: "UPS Worldwide Expedited", code: "UPSWWED" },
			{ id: 27, method: "UPS Worldwide Express Plus", code: "UPSWWEP" },
			{ id: 54, method: "UPS Standard", code: "UPSSTD" },
			{ id: 86, method: "Ground", code: "DELGND" },
		  
			// FedEx Methods (from Image 2)
			{ id: 1, method: "FedEx Ground", code: "FEDXGND" },
			{ id: 2, method: "FedEx 2Day", code: "FEDX2DY" },
			{ id: 3, method: "FedEx Express Saver", code: "FEDXEXP" },
			{ id: 4, method: "FedEx Standard Overnight", code: "FEDXSTD" },
			{ id: 28, method: "FedEx First Overnight", code: "FEDX1ST" },
			{ id: 29, method: "FedEx Priority Overnight (Saturday Delivery)", code: "FEDXPRI" },
			{ id: 30, method: "FedEx Priority Overnight", code: "FEDXPRI" },
			{ id: 31, method: "FedEx 2Day (Saturday Delivery)", code: "FEDX2DY" },
			{ id: 32, method: "FedEx 1Day Freight", code: "FEDX1DF" },
			{ id: 33, method: "FedEx 1Day Freight (Saturday Delivery)", code: "FEDX1DF" },
			{ id: 34, method: "FedEx 2Day Freight", code: "FEDX2DF" },
			{ id: 35, method: "FedEx 2Day Freight (Saturday Delivery)", code: "FEDX2DF" },
			{ id: 37, method: "FedEx 3Day Freight", code: "FEDX3DF" },
			{ id: 38, method: "FedEx Europe First International Priority", code: "FEDXEIP" },
			{ id: 39, method: "FedEx International Economy", code: "FEDXIEC" },
			{ id: 40, method: "FedEx International Economy Freight", code: "FEDXIEF" },
			{ id: 41, method: "FedEx International First", code: "FEDXIFR" },
			{ id: 42, method: "FedEx International Priority", code: "FEDXIPR" },
			{ id: 43, method: "FedEx International Priority Freight", code: "FEDXIPF" },
			{ id: 44, method: "FedEx Ground Home Delivery", code: "FEDXGHD" },
			{ id: 80, method: "FedEx International Ground Canada", code: "FEDXIGC" },
			{ id: 82, method: "FedEx International Priority Express", code: "FEDXIPE" },
			{ id: 90, method: "FedEx Ground", code: "FEDXGND" },
		  
			// Additional methods mentioned
			{ id: 11, method: "Will Call", code: "WILLCALL" },
			{ id: 18, method: "Delivery", code: "DELIVERY" },
			{ id: 87, method: "Delivery", code: "DELIVERY" }
		  ];
		
		// Shipment-Method-ID
		// const shipMethod = shipMethodMap.find(method => method.id === customer.shipMethod);
		// const shipMethodCode = shipMethod ? shipMethod.code : '';
		const shipMethodCode = '';
		const shipMethod = '';
		
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
		  'Priority': { value: '', pos: 455, len: 10 },
		  'Estimate-Markup-Pct': { value: '', pos: 465, len: 6 },
		  'Overs-Allowed': { value: '', pos: 471, len: 5 },
		  'Date-First-Order': { value: '', pos: 476, len: 10 },
		  'PO-Required': { value: poRequired, pos: 486, len: 1 },
		  'AR-Stmt': { value: '0', pos: 487, len: 1 },
		  'AR-Stmt-Dunning-Msg': { value: '0', pos: 488, len: 1 },
		  
		  // Inter-company settings
		  'Inter-company': { value: '0', pos: 489, len: 1 },
		  'System-ID-Inter-company': { value: '', pos: 490, len: 12 },
		  
		  // Banking and financial information
		  'Bank': { value: '', pos: 502, len: 20 },
		  'Bank-acct-num': { value: '', pos: 522, len: 20 },
		  'Sales-tax-exempt': { value: '', pos: 542, len: 20 },
		  'Credit-Limit': { value: '', pos: 562, len: 14 },
		  
		  // Shipping information
		  'Shipment-Method-ID': { value: '', pos: 576, len: 8 },
		  'Tax-Number': { value: '', pos: 584, len: 20 },
		  'Addl-Tax-Number': { value: '', pos: 604, len: 20 },
		//   'Industry-Code': { value: customer.accountType ? customer.accountType.toString().substring(0, 8) : '', pos: 624, len: 8 },
		  'Industry-Code': { value: '', pos: 624, len: 8 },
		  
		  // Locale and system settings
		  'Locale-ID': { value: 'USA', pos: 632, len: 6 },
		  'Prograph-Customer-Type': { value: '', pos: 638, len: 1 },
		  'Prograph-Shipper': { value: '', pos: 639, len: 1 },
		  'Prograph-Paper-Owner': { value: '', pos: 640, len: 1 },
		  'Prograph-Advertiser': { value: '', pos: 641, len: 1 },
		  'Prograph-Advertising-Agency': { value: '', pos: 642, len: 1 },
		  
		  // Web access flags
		  'Allow-PSF-Access': { value: '', pos: 643, len: 1 },
		  'PSF-Auto-Accept-Orders': { value: '', pos: 644, len: 1 },
		  'PrinterSite-Exchange': { value: '', pos: 645, len: 1 },
		  'Available-in-PrintStream': { value: '0', pos: 646, len: 1 },
		  
		  // PrinterSite settings
		  'PS-Fulfillment': { value: '', pos: 647, len: 8 },
		  'PS-Franchise-Number': { value: '', pos: 655, len: 30 },
		  'PS-Store-Number': { value: '', pos: 685, len: 30 },
		  'PS-Credit-Hold': { value: '', pos: 715, len: 1 },
		  
		  // Finance and AR settings
		  'AR-Stmt-Finance-Chrg': { value: '', pos: 716, len: 1 },
		  'Allow-OPS': { value: '', pos: 717, len: 1 },
		  'iQuote-Customer-ID': { value: '', pos: 718, len: 15 },
		  
		  // Document delivery options
		  'ARStatementDelivery': { value: 'Printer', pos: 733, len: 7 },
		  'BatchCloseInvDelivery': { value: 'None', pos: 740, len: 7 },
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
	  console.log('customers', customers);
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
	 * Process customer list ZIP file and generate Monarch import file
	 * @param {File} file - Customer list ZIP file
	 * @returns {Promise} Promise resolving to result object
	 */
	async processFile(file) {
	  try {
		// Parse the file
		await this.parseZipFile(file);
		
		// Generate and download import file
		const customerImport = this.generateCustomerImportFile();
		this.downloadTextFile(customerImport, 'monarch_customer_import.txt');
		
		// Store in localStorage for the viewer
		localStorage.setItem('monarch_customer_import', customerImport);
		
		return {
		  success: true,
		  message: 'Customer import file generated successfully!',
		  summary: {
			customers: this.customerListData.length,
			users: this.userListData.length,
			emailsMatched: this.customerListData.filter(c => 
			  c.billContactUserID && this.getUserEmail(c.billContactUserID)
			).length
		  }
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