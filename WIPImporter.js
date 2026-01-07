/**
 * WIP Import File Generator
 *
 * This script processes XLS files and generates WIP import files for Monarch.
 * Expected columns: Order ID, Customer Name, Salesperson, CSR, Project Name, Order Date, Due Date, Order Value
 */
class WIPImporter {
  constructor() {
    this.wipData = [];
    this.filteredData = [];
    this.skippedRows = [];
    this.rejectedOrders = []; // Orders where customer lookup failed
    this.customerApiService = new CustomerApiService();
  }

  /**
   * Parse an XLS file using SheetJS (xlsx)
   * @param {File} file - The XLS file to parse
   * @returns {Promise} Promise resolving to the parsed data
   */
  parseXLSFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          // Get the first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            blankrows: false
          });

          // Log the raw headers for debugging
          console.log('Raw headers from XLS:', jsonData[0]);
          console.log('First few rows:', jsonData.slice(1, 4));

          // Convert array of arrays to array of objects with headers
          if (jsonData.length > 0) {
            const headers = jsonData[0];
            this.rawHeaders = headers; // Store for debugging
            const rows = jsonData.slice(1);

            this.wipData = rows.map(row => {
              const obj = {};
              headers.forEach((header, index) => {
                // Normalize header names: trim whitespace and store both original and normalized
                const normalizedHeader = header ? header.toString().trim() : `Column${index}`;
                obj[normalizedHeader] = row[index] !== undefined ? row[index] : '';
              });
              return obj;
            });
            
            // Log a sample row to see the structure
            if (this.wipData.length > 0) {
              console.log('Sample parsed row:', this.wipData[0]);
              console.log('Available columns:', Object.keys(this.wipData[0]));
            }
          } else {
            this.wipData = [];
          }

          resolve(this.wipData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Find a column by checking multiple possible names
   * @param {Object} row - Data row object
   * @param {Array} possibleNames - Array of possible column names to check
   * @returns {any} The value found, or empty string
   */
  findColumn(row, possibleNames) {
    for (const name of possibleNames) {
      // Check exact match
      if (row[name] !== undefined && row[name] !== '') {
        return row[name];
      }
      // Check case-insensitive match
      const keys = Object.keys(row);
      for (const key of keys) {
        if (key.toLowerCase().trim() === name.toLowerCase().trim()) {
          if (row[key] !== undefined && row[key] !== '') {
            return row[key];
          }
        }
      }
    }
    return '';
  }

  /**
   * Validate Order ID is a numeric string (digits only)
   * @param {string} orderId - The order ID to validate
   * @returns {boolean} True if valid, false otherwise
   */
  isValidOrderId(orderId) {
    if (!orderId) return false;
    const orderIdStr = orderId.toString().trim();
    // Match 4-7 digits (flexible for different order number lengths)
    const pattern = /^\d{4,7}$/;
    const isValid = pattern.test(orderIdStr);
    console.log(`Checking Order ID: "${orderIdStr}" - Valid: ${isValid}`);
    return isValid;
  }

  /**
   * Filter data to only include rows with valid N##### Order IDs
   * @returns {Object} Object with filtered data and skipped rows
   */
  filterValidOrders() {
    this.filteredData = [];
    this.skippedRows = [];

    // Possible column names for Order ID
    const orderIdColumns = ['Order ID', 'OrderID', 'Order Id', 'order id', 'ORDER ID', 'Job ID', 'JobID', 'Job Number', 'Order Number', 'Order #'];
    const customerNameColumns = ['Customer Name', 'CustomerName', 'Customer', 'customer name', 'CUSTOMER NAME', 'Client Name', 'Client'];

    console.log(`Processing ${this.wipData.length} rows...`);

    this.wipData.forEach((row, index) => {
      const orderId = this.findColumn(row, orderIdColumns);
      const customerName = this.findColumn(row, customerNameColumns);
      
      if (index < 3) {
        console.log(`Row ${index + 2}:`, { orderId, customerName, fullRow: row });
      }
      
      if (this.isValidOrderId(orderId)) {
        // Store the found order ID in a normalized location
        row._orderId = orderId;
        row._customerName = customerName;
        this.filteredData.push(row);
      } else {
        this.skippedRows.push({
          rowNumber: index + 2, // +2 because index is 0-based and we skip header
          orderId: orderId || '(empty)',
          customerName: customerName || '',
          reason: orderId ? `Invalid Order ID format: ${orderId}` : 'Missing Order ID'
        });
      }
    });

    console.log(`Filtered: ${this.filteredData.length} valid, ${this.skippedRows.length} skipped`);

    return {
      validCount: this.filteredData.length,
      skippedCount: this.skippedRows.length
    };
  }

  /**
   * Format a date to mm/dd/yyyy format
   * @param {any} dateValue - Date value (could be Date object, string, or Excel serial number)
   * @returns {string} Formatted date string
   */
  formatDate(dateValue) {
    if (!dateValue) return '';
    
    try {
      let date;
      
      // Handle Excel serial date numbers
      if (typeof dateValue === 'number') {
        // Excel serial date: days since 1900-01-01 (with a leap year bug)
        // 25569 is the number of days between 1900-01-01 and 1970-01-01
        date = new Date((dateValue - 25569) * 86400 * 1000);
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        // Try parsing as string
        date = new Date(dateValue);
      }
      
      if (isNaN(date.getTime())) {
        return '';
      }
      
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch (e) {
      return '';
    }
  }

  /**
   * Format currency value
   * @param {any} value - The value to format
   * @returns {string} Formatted currency value
   */
  formatCurrency(value) {
    if (!value) return '0.00';
    
    // Remove any currency symbols and commas
    const cleanValue = value.toString().replace(/[$,]/g, '');
    const num = parseFloat(cleanValue);
    
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  }

  /**
   * Map WIP data to Monarch job format with customer API lookup
   * @returns {Promise<Array>} Array of job objects in Monarch format
   */
  async mapToMonarchFormat() {
    const jobs = [];
    this.rejectedOrders = []; // Reset rejected orders

    // Possible column names for each field
    const salespersonColumns = ['Salesperson', 'Sales Person', 'Sales Rep', 'SalesRep', 'salesperson', 'SALESPERSON', 'Rep'];
    const csrColumns = ['CSR', 'csr', 'Customer Service Rep', 'Service Rep'];
    const projectNameColumns = ['Project Name', 'ProjectName', 'Project', 'project name', 'PROJECT NAME', 'Job Name', 'Description', 'Job Description'];
    const orderDateColumns = ['Order Date', 'OrderDate', 'order date', 'ORDER DATE', 'Date Ordered', 'Created Date'];
    const dueDateColumns = ['Due Date', 'DueDate', 'due date', 'DUE DATE', 'Date Due', 'Deadline'];
    const orderValueColumns = ['Order Value', 'OrderValue', 'order value', 'ORDER VALUE', 'Value', 'Amount', 'Total', 'Price'];

    for (const row of this.filteredData) {
      const orderId = (row._orderId || '').toString().trim();
      const customerName = row._customerName || '';
      const salesperson = this.findColumn(row, salespersonColumns);
      const csr = this.findColumn(row, csrColumns);
      const projectName = this.findColumn(row, projectNameColumns);
      const orderDate = this.formatDate(this.findColumn(row, orderDateColumns));
      const dueDate = this.formatDate(this.findColumn(row, dueDateColumns));
      const orderValue = this.formatCurrency(this.findColumn(row, orderValueColumns));

      // Format job_id - add N prefix and pad to 8 chars
      const jobId = ('N' + orderId).padEnd(8, ' ').substring(0, 8);

      // Look up customer ID via API
      let monarchCustomerId = '';
      let customerFound = false;

      try {
        console.log(`Searching for customer: ${customerName}`);
        const searchResults = await this.customerApiService.searchCustomers(customerName);
        
        if (searchResults && Array.isArray(searchResults) && searchResults.length > 0) {
          monarchCustomerId = searchResults[0].customer_id;
          console.log(`Customer found in API: ${monarchCustomerId}`);
          customerFound = true;
        } else {
          console.warn(`No monarch customer found for ${customerName}`);
          
          // Add to rejected orders
          this.rejectedOrders.push({
            orderId: orderId,
            customerName: customerName,
            projectName: projectName,
            dueDate: dueDate,
            orderValue: orderValue,
            reason: 'Customer not found in Monarch database'
          });
          
          // Skip this order
          continue;
        }
      } catch (error) {
        console.error(`Error fetching monarch customer for ${customerName}:`, error);
        
        // Add to rejected orders
        this.rejectedOrders.push({
          orderId: orderId,
          customerName: customerName,
          projectName: projectName,
          dueDate: dueDate,
          orderValue: orderValue,
          reason: `API Error: ${error.message}`
        });
        
        // Skip this order
        continue;
      }

      // Ensure the customer ID is valid (max 8 chars)
      monarchCustomerId = monarchCustomerId.toString().substring(0, 8);

      jobs.push({
        'job_id': { value: jobId, pos: 1, len: 8 },
        'sub_job_id': { value: '    ', pos: 9, len: 4 }, // Blank for main job
        'job_description': { value: projectName.substring(0, 254), pos: 13, len: 254 },
        'job_type': { value: 'Production', pos: 267, len: 19 },
        'item_id': { value: '', pos: 286, len: 15 },
        'cust_ordered_by': { value: monarchCustomerId, pos: 301, len: 8 },
        'cust_billed_to': { value: monarchCustomerId, pos: 309, len: 8 },
        'sales_class_id': { value: '113', pos: 317, len: 8 },
        'po_number': { value: '', pos: 325, len: 20 },
        'date_promised': { value: dueDate, pos: 345, len: 10 },
        'ship_date': { value: '', pos: 355, len: 10 },
        'qty_ordered': { value: '1', pos: 365, len: 11 },
        'priority': { value: '', pos: 376, len: 10 },
        'contact_name': { value: '', pos: 386, len: 30 },
        'expense_code': { value: '', pos: 416, len: 24 },
        'shop_floor_active': { value: '0', pos: 440, len: 1 },
        'form_number': { value: '', pos: 441, len: 20 },
        'quotation_amount': { value: orderValue, pos: 461, len: 15 },
        'unit_of_measure_id': { value: 'Each', pos: 476, len: 4 },
        'unit_price': { value: orderValue, pos: 480, len: 16 },
        'job_title': { value: projectName.substring(0, 50), pos: 496, len: 50 },
        'forest_type_id': { value: '', pos: 546, len: 15 },
        // Store additional fields as metadata (not in fixed width output but useful for reference)
        '_metadata': {
          customerName: customerName,
          salesperson: salesperson,
          csr: csr,
          orderDate: orderDate
        }
      });
    }

    return jobs;
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
        // Skip metadata field
        if (field === '_metadata') continue;
        
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
   * Process the XLS file and generate WIP import file
   * @param {File} file - The XLS file to process
   * @returns {Promise} Promise with success/error status
   */
  async processFile(file) {
    try {
      // Parse the XLS file
      await this.parseXLSFile(file);

      if (this.wipData.length === 0) {
        return {
          success: false,
          message: 'No data found in XLS file'
        };
      }

      // Filter valid orders (N##### pattern)
      const filterResult = this.filterValidOrders();

      if (this.filteredData.length === 0) {
        // Provide helpful debug info about what columns were found
        const columnsFound = this.rawHeaders ? this.rawHeaders.join(', ') : 'unknown';
        const sampleValues = this.wipData.length > 0 ? 
          `First row values: ${JSON.stringify(this.wipData[0])}` : 
          'No data rows found';
        
        console.log('Columns found in file:', columnsFound);
        console.log('Sample data:', sampleValues);
        
        return {
          success: false,
          message: `No valid orders found. All ${filterResult.skippedCount} rows were skipped (Order ID must be 4-7 digits).\n\nColumns found: ${columnsFound}\n\nCheck browser console (F12) for more details.`
        };
      }

      // Generate the WIP import file (includes customer API lookups)
      const wipImportData = await this.generateWIPImportFile();

      // Store in localStorage for the file viewer
      localStorage.setItem('wipImportData', wipImportData);

      // Calculate successful records (filtered minus rejected)
      const successfulRecords = filterResult.validCount - this.rejectedOrders.length;

      // Build result message
      let message = `WIP import file generated successfully with ${successfulRecords} records`;
      if (filterResult.skippedCount > 0) {
        message += ` (${filterResult.skippedCount} rows skipped - invalid Order ID format)`;
      }
      if (this.rejectedOrders.length > 0) {
        message += ` (${this.rejectedOrders.length} orders rejected - customer not found)`;
      }

      return {
        success: true,
        message: message,
        recordCount: successfulRecords,
        skippedCount: filterResult.skippedCount,
        skippedRows: this.skippedRows,
        rejectedCount: this.rejectedOrders.length,
        rejectedOrders: this.rejectedOrders
      };
    } catch (error) {
      return {
        success: false,
        message: `Error processing XLS file: ${error.message}`
      };
    }
  }

  /**
   * Generate WIP import file content in Monarch fixed-width format
   * @returns {Promise<string>} The formatted WIP import data
   */
  async generateWIPImportFile() {
    // Map data to Monarch format (with customer API lookups)
    const jobs = await this.mapToMonarchFormat();
    
    // Generate fixed-width file
    return this.generateFixedWidthFile(jobs);
  }

  /**
   * Get a summary of skipped rows for display
   * @returns {string} Summary of skipped rows
   */
  getSkippedRowsSummary() {
    if (this.skippedRows.length === 0) {
      return '';
    }

    let summary = `\n\nSkipped Rows (${this.skippedRows.length}):\n`;
    summary += '─'.repeat(60) + '\n';
    
    this.skippedRows.forEach(row => {
      summary += `Row ${row.rowNumber}: ${row.reason}`;
      if (row.customerName) {
        summary += ` (Customer: ${row.customerName})`;
      }
      summary += '\n';
    });

    return summary;
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
      "Order ID",
      "Customer Name",
      "Project Name",
      "Due Date",
      "Order Value",
      "Rejection Reason"
    ];
    
    // Create CSV content
    let csvContent = headers.join(",") + "\n";
    
    // Add each rejected order as a row
    this.rejectedOrders.forEach(order => {
      // Escape fields that might contain commas
      const escapedCustomerName = `"${(order.customerName || '').replace(/"/g, '""')}"`;
      const escapedProjectName = `"${(order.projectName || '').replace(/"/g, '""')}"`;
      const escapedReason = `"${(order.reason || '').replace(/"/g, '""')}"`;
      
      const row = [
        order.orderId,
        escapedCustomerName,
        escapedProjectName,
        order.dueDate,
        order.orderValue,
        escapedReason
      ];
      
      csvContent += row.join(",") + "\n";
    });
    
    return csvContent;
  }

  /**
   * Download the WIP import file
   */
  downloadWIPFile() {
    const wipImportData = localStorage.getItem('wipImportData');

    if (!wipImportData) {
      throw new Error('No WIP import data available. Please generate the file first.');
    }

    // Create blob and download
    const blob = new Blob([wipImportData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WIP_Import_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
