// CustomerApiService.js
class CustomerApiService {
	constructor(baseUrl = 'https://internal2.ps-az-int.us/api') {
	  this.baseUrl = baseUrl;
	  // Basic auth credentials - replace with your actual credentials
	  this.username = 'internal2';
	  this.password = 'fip982$4y5typh%whrg9';
	}
	
	/**
	 * Get the authorization headers for API requests
	 * @returns {Object} Headers object with authorization
	 */
	getHeaders() {
	  const headers = new Headers();
	  const auth = btoa(`${this.username}:${this.password}`);
	  headers.append('Authorization', `Basic ${auth}`);
	  headers.append('Content-Type', 'application/json');
	  return headers;
	}
	
	/**
	 * Get all customers from the API
	 * @returns {Promise} Promise that resolves to customer data
	 */
	async getAllCustomers() {
	  try {
		const response = await fetch(`${this.baseUrl}/customers`, {
		  method: 'GET',
		  headers: this.getHeaders()
		});
		
		if (!response.ok) {
		  throw new Error(`API error: ${response.status}`);
		}
		
		return await response.json();
	  } catch (error) {
		console.error('Error fetching customers:', error);
		throw error;
	  }
	}
	
	/**
	 * Search customers by name or ID
	 * @param {string} query - Search query
	 * @returns {Promise} Promise that resolves to customer data
	 */
	async searchCustomers(query) {
	  try {
		const response = await fetch(`${this.baseUrl}/customers/search?query=${encodeURIComponent(query)}`, {
		  method: 'GET',
		  headers: this.getHeaders()
		});
		
		if (!response.ok) {
		  throw new Error(`API error: ${response.status}`);
		}
		
		return await response.json();
	  } catch (error) {
		console.error('Error searching customers:', error);
		throw error;
	  }
	}
	
	/**
	 * Get a customer by ID
	 * @param {number} id - Customer ID
	 * @returns {Promise} Promise that resolves to customer data
	 */
	async getCustomerById(id) {
	  try {
		const response = await fetch(`${this.baseUrl}/customers/${id}`, {
		  method: 'GET',
		  headers: this.getHeaders()
		});
		
		if (!response.ok) {
		  throw new Error(`API error: ${response.status}`);
		}
		
		return await response.json();
	  } catch (error) {
		console.error('Error fetching customer:', error);
		throw error;
	  }
	}
  }