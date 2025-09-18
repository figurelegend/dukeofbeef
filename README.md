# Order Form Website

A simple, static website with an order form that loads product data from Google Sheets and submits orders via email.

## Features

- ✅ Loads product catalog from Google Sheets
- ✅ Validates customer information (name, email, phone)
- ✅ Dynamic quantity controls with minimum order requirements
- ✅ Real-time order total calculation
- ✅ Floating order total and submit button
- ✅ Email order submission via EmailJS
- ✅ Fallback CSV download if email fails
- ✅ Responsive design for mobile devices
- ✅ Image support (URLs or local files)

## Private Google Sheets Option

If you want to keep your Google Sheet private, use Google Apps Script as a proxy:

### Setting Up Private Sheet Access

1. **Open your Google Sheet**
2. **Extensions → Apps Script**
3. **Copy the code from `google-apps-script.js`**
4. **Update the SHEET_ID in the script**
5. **Deploy → New Deployment**:
   - Type: Web app
   - Execute as: Me (your account)
   - Who has access: Anyone
6. **Copy the Web App URL**
7. **Use `script-private-sheets.js` instead of `script.js`**
8. **Update GOOGLE_SCRIPT_URL with your Web App URL**

This method allows your Sheet to remain private while still being accessible to the website.

## Setup Instructions (Public Sheet Method)

### 1. Google Sheets Setup

1. Create a Google Sheet with your product data
2. Format with these column headers (exact names):
   - `Item Description`
   - `Price`
   - `Minimum Order Quantity`
   - `image`

3. Publish your Google Sheet:
   - File → Share → Publish to web
   - Choose "Entire Document" and "CSV" format
   - Click "Publish"

4. Get your Sheet ID from the URL:
   - Sheet URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
   - Copy the `SHEET_ID_HERE` part

### 2. Google Sheets API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Sheets API:
   - APIs & Services → Enable APIs → Search "Google Sheets API" → Enable
4. Create API credentials:
   - APIs & Services → Credentials → Create Credentials → API Key
5. Restrict the API key (recommended):
   - Edit API key → API restrictions → Restrict key → Google Sheets API
   - Application restrictions → HTTP referrers → Add your GitHub Pages URL

### 3. EmailJS Setup (for email submissions)

1. Sign up at [EmailJS](https://www.emailjs.com/)
2. Add your email service (Gmail, Outlook, etc.)
3. Create an email template with these variables:
   - `{{from_name}}`
   - `{{from_email}}`
   - `{{phone}}`
   - `{{order_details}}`
   - `{{total}}`
4. Get your credentials:
   - Public Key (User ID)
   - Service ID
   - Template ID

### 4. Configure the Website

Edit `script.js` and update these values:

```javascript
// Line 4-5: Google Sheets configuration
const GOOGLE_SHEET_ID = 'your-sheet-id-here';
const GOOGLE_SHEET_RANGE = 'Sheet1!A:D'; // Adjust if needed

// Line 8: EmailJS Public Key
emailjs.init("your-emailjs-public-key");

// Line 22: Google Sheets API Key
const url = `...?key=YOUR_API_KEY_HERE`;

// Line 355: EmailJS Service and Template IDs
emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', emailParams)
```

### 5. Add Product Images

Place product images in the `/images` directory. Images can be:
- Direct URLs in the Google Sheet (starts with http:// or https://)
- Image tags (e.g., "brisket" looks for `images/brisket.jpg` or `images/brisket.png`)
- Case-insensitive matching

### 6. Deploy to GitHub Pages

1. Push all files to your GitHub repository
2. Go to Settings → Pages
3. Source: Deploy from branch
4. Branch: main (or master), folder: / (root)
5. Save and wait for deployment

## File Structure

```
/
├── index.html          # Main HTML structure
├── styles.css          # All styling
├── script.js           # Application logic
├── README.md           # This file
└── images/            # Product images directory
    └── placeholder.png # Default image
```

## Google Sheet Format Example

| Item Description | Price | Minimum Order Quantity | image |
|-----------------|-------|----------------------|-------|
| Premium Beef Brisket | 45.99 | 1 | brisket |
| BBQ Ribs | 28.00 | 1 | https://example.com/ribs.jpg |
| Chicken Wings | 16.99 | 2 | wings |

## Features in Detail

### Order Validation
- Name: Minimum 2 characters
- Email: Valid email format
- Phone: At least 10 digits
- Submit button disabled until all fields valid and items selected

### Order Submission
1. Primary: Sends email via EmailJS to customer and admin
2. Fallback: Downloads CSV file if email fails

### Responsive Design
- Desktop: Floating sidebar on right
- Mobile: Fixed bottom bar with order total and submit

## Troubleshooting

### Products not loading?
- Check Google Sheet is published
- Verify Sheet ID and API key are correct
- Check browser console for errors
- Ensure API key restrictions allow your domain

### Emails not sending?
- Verify EmailJS credentials
- Check email template variables match
- Review EmailJS dashboard for errors
- Falls back to CSV download automatically

### Images not showing?
- Check image file exists in `/images` directory
- Verify file extension (.jpg or .png)
- Use full URLs for external images
- Placeholder shows if image not found

## Security Notes

⚠️ **Important**: This is a client-side application. API keys are visible in the source code.

For production use:
- Restrict API keys to your domain
- Use a backend server for sensitive operations
- Consider implementing rate limiting
- Add CAPTCHA for spam prevention

## Support

For issues or questions, please check:
- Browser console for error messages
- Network tab for failed requests
- EmailJS dashboard for email logs
- Google Cloud Console for API usage