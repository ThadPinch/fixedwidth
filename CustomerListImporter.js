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
  
  // Export the class
  export default CustomerListImporter;