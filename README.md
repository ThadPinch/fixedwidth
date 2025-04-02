# Monarch Import Generator

This application helps you convert data from CSV files into Monarch-compatible fixed-width import files for customer and job records.

## Features

- **Customer List Import**: Convert a CSV or Excel file containing customer data into a Monarch-compatible fixed-width import file.
- **Job/Order Import**: Process a combination of customer, order, and payment data from CSV files to generate Monarch job import files.
- **ZIP File Support**: Upload a ZIP file containing multiple CSV files at once.
- **File Viewer**: Built-in viewer with color-coded field highlighting to inspect the generated import files before using them in Monarch.
- **Position Tracking**: The file viewer shows the character position as you move the cursor, helping you validate field positions.

## How to Use

### Customer Import
1. Go to the "Customer Import" tab
2. Drag and drop the customer CSV onto the dropzone (or click to browse)
3. Click "Generate Customer Import" to process the file
4. The application will create and download a fixed-width text file ready for Monarch import
5. The file viewer will automatically display the generated file with color-coded fields

### Job Import
1. Go to the "Job Import" tab
2. Either:
   - Upload a ZIP file containing customer.csv and order.csv files, or
   - Select individual CSV files for customer, order, and payment data
3. Click "Generate Job Import" to process the files
4. The application will create and download a fixed-width text file ready for Monarch import
5. The file viewer will automatically display the generated file with color-coded fields

## Technical Details

- Files are processed client-side; no data is sent to servers

## Browser Compatibility

This application works best in modern browsers with JavaScript enabled.
