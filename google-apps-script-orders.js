// Google Apps Script for Order Processing
// This script handles both writing orders to a sheet and sending emails
//
// SETUP INSTRUCTIONS:
// 1. Create a new Google Sheet for orders
// 2. Go to Extensions → Apps Script
// 3. Paste this entire code
// 4. Update the configuration below
// 5. Deploy → New Deployment → Web app → Execute as: Me, Access: Anyone

// ===== CONFIGURATION =====
const CONFIG = {
  // Your Orders Sheet ID (create a new sheet for orders)
  ORDERS_SHEET_ID: '1D7FbAN5luoNn1lFmVpX-HEK1eL5dg0cqastdh2wq7Eo',

  // Email settings
  ORDER_PROCESSING_EMAIL: 'dukeofbeef@gmail.com', // Your business email
  BUSINESS_NAME: 'Duke of Beef',

  // Sheet configuration
  SHEET_NAME: 'Orders',

  // Set to true to enable email notifications
  SEND_EMAILS: true
};

// ===== MAIN FUNCTION =====
function doPost(e) {
  try {
    // Parse the incoming order data
    const orderData = JSON.parse(e.postData.contents);

    // Write to Google Sheet
    const orderId = writeOrderToSheet(orderData);

    // Send emails if enabled
    if (CONFIG.SEND_EMAILS) {
      sendOrderEmails(orderData, orderId);
    }

    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        orderId: orderId,
        message: 'Order submitted successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(error) {
    console.error('Error processing order:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== WRITE ORDER TO SHEET =====
function writeOrderToSheet(orderData) {
  const sheet = SpreadsheetApp.openById(CONFIG.ORDERS_SHEET_ID)
    .getSheetByName(CONFIG.SHEET_NAME);

  // Create sheet with headers if it doesn't exist
  if (!sheet) {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.ORDERS_SHEET_ID);
    const newSheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);

    // Add headers
    const headers = [
      'Order ID',
      'Date/Time',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Delivery Method',
      'Item Name',
      'Quantity',
      'Price Each',
      'Item Total',
      'Subtotal',
      'Delivery Fee',
      'Total',
      'Status'
    ];
    newSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    newSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

    sheet = newSheet;
  }

  // Generate sequential order ID with delivery/shipping prefix
  const lastRow = sheet.getLastRow();
  let orderNumber = 1;

  // If there are existing orders, find the highest order number
  if (lastRow > 1) {
    const lastOrderData = sheet.getRange(lastRow, 1).getValue(); // Get last Order ID
    if (lastOrderData && typeof lastOrderData === 'string') {
      // Extract number from both D- and S- prefixed orders
      const match = lastOrderData.match(/[DS]-(\d+)/);
      if (match) {
        const lastNumber = parseInt(match[1]);
        if (!isNaN(lastNumber)) {
          orderNumber = lastNumber + 1;
        }
      }
    }
  }

  // Use D- for delivery, S- for shipping
  const prefix = orderData.deliveryMethod === 'delivery' ? 'D-' : 'S-';
  const orderId = prefix + orderNumber.toString().padStart(4, '0'); // D-0001, S-0002, etc.
  const timestamp = new Date().toLocaleString();

  // Split customer name into first and last name
  const nameParts = orderData.customerName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Calculate totals
  const subtotal = orderData.items.reduce((sum, item) =>
    sum + (item.quantity * item.price), 0
  );
  const deliveryFee = orderData.deliveryMethod === 'delivery' ? 20 : 0;
  const total = subtotal + deliveryFee;

  // Add one row for each item
  orderData.items.forEach((item, index) => {
    const itemTotal = item.quantity * item.price;

    const itemRow = [
      orderId,
      timestamp,
      firstName,
      lastName,
      orderData.customerEmail,
      orderData.customerPhone,
      orderData.deliveryMethod,
      item.name,
      item.quantity,
      item.price.toFixed(2),
      itemTotal.toFixed(2),
      '', // Subtotal - empty for item rows
      '', // Delivery Fee - empty for item rows
      '', // Total - empty for item rows
      'New' // Status for all item rows
    ];

    sheet.appendRow(itemRow);
  });

  // Add summary row
  const summaryRow = [
    orderId,
    timestamp,
    firstName,
    lastName,
    orderData.customerEmail,
    orderData.customerPhone,
    orderData.deliveryMethod,
    'ORDER TOTAL', // Item Name
    '', // Quantity - empty for summary row
    '', // Price Each - empty for summary row
    '', // Item Total - empty for summary row
    subtotal.toFixed(2), // Subtotal
    deliveryFee.toFixed(2), // Delivery Fee
    total.toFixed(2), // Total
    'New' // Status for summary row
  ];

  sheet.appendRow(summaryRow);

  return orderId;
}

// ===== SEND EMAIL NOTIFICATIONS =====
function sendOrderEmails(orderData, orderId) {
  // Format order details for email
  const itemsHtml = orderData.items.map(item =>
    `<tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${(item.quantity * item.price).toFixed(2)}</td>
    </tr>`
  ).join('');

  const subtotal = orderData.items.reduce((sum, item) =>
    sum + (item.quantity * item.price), 0
  );
  const deliveryFee = orderData.deliveryMethod === 'delivery' ? 20 : 0;
  const total = subtotal + deliveryFee;

  // Email template
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #b8860b;">${CONFIG.BUSINESS_NAME} - Order Confirmation</h2>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>

      <h3>Customer Information</h3>
      <p>
        <strong>Name:</strong> ${orderData.customerName}<br>
        <strong>Email:</strong> ${orderData.customerEmail}<br>
        <strong>Phone:</strong> ${orderData.customerPhone}<br>
        <strong>Delivery Method:</strong> ${orderData.deliveryMethod === 'delivery' ? 'Delivery ($20.00)' : 'Shipping (Call for Cost)'}
      </p>

      <h3>Order Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Item</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Quantity</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Price</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="margin-top: 20px; text-align: right;">
        <p><strong>Subtotal:</strong> $${subtotal.toFixed(2)}</p>
        ${deliveryFee > 0 ? `<p><strong>Delivery Fee:</strong> $${deliveryFee.toFixed(2)}</p>` : ''}
        <p style="font-size: 1.2em;"><strong>Total:</strong> $${total.toFixed(2)}</p>
      </div>

      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        Thank you for your order! We will contact you shortly to confirm delivery/shipping details.
      </p>
    </div>
  `;

  // Send to customer
  MailApp.sendEmail({
    to: orderData.customerEmail,
    subject: `Order Confirmation #${orderId} - ${CONFIG.BUSINESS_NAME}`,
    htmlBody: emailHtml
  });

  // Send to business
  MailApp.sendEmail({
    to: CONFIG.ORDER_PROCESSING_EMAIL,
    subject: `New Order #${orderId} from ${orderData.customerName}`,
    htmlBody: emailHtml + `
      <div style="background-color: #fffacd; padding: 10px; margin-top: 20px; border: 1px solid #b8860b;">
        <p><strong>INTERNAL NOTE:</strong> This is a new order requiring processing.</p>
      </div>
    `
  });
}

// ===== TEST FUNCTION =====
function testOrder() {
  // Test function to verify the script works
  const testData = {
    customerName: "Test Customer",
    customerEmail: "test@example.com",
    customerPhone: "555-1234",
    deliveryMethod: "delivery",
    items: [
      {name: "Ribeye", quantity: 2, price: 32.50},
      {name: "Filet", quantity: 1, price: 28.00}
    ]
  };

  const orderId = writeOrderToSheet(testData);
  console.log("Test order created with ID:", orderId);
}