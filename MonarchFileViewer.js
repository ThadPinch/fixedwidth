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
	  
	  this.  displayFile();
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
	  // Return empty string instead of sample data
	  return '';
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
	  // Adjusted calculation to fix position accuracy
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
}

export default MonarchFileViewer;