## Goal
Add a "Share report as PDF" button to the Reports tab so users can download their financial statements (Income Statement + Balance Statement of Financial Position) for the selected period.

## Why the Reports tab
The `accounts.jsx` screen shows cash balances and transactions. The actual financial statements (Income Statement, Balance Sheet) already live on the **Reports** tab (`reports.jsx`). That is the natural place for a report download button.

## Steps

### 1. Install `expo-print`
`expo-print` is the Expo SDK 56 API for generating PDFs from HTML strings.
```bash
cd expo-app && npx expo install expo-print
```

### 2. Create `expo-app/src/lib/reports.js`
A new utility module that:
- Accepts a date range and business profile
- Runs `incomeStatement(start, end)` and `balanceSheet(end)`
- Builds a clean, printable HTML document with:
  - Business name and report period
  - Income Statement section (revenue, expenses, net profit/loss)
  - Balance Sheet section (assets, liabilities, equity)
- Calls `Print.printToFileAsync({ html })` to generate a temporary PDF
- Calls `Sharing.shareAsync(uri)` to open the native share sheet (same pattern already used in `backup.jsx`)

### 3. Update `expo-app/app/(tabs)/reports.jsx`
- Import the new utility and `expo-sharing`
- Add a "Share PDF" button at the top of the screen, next to the period selector
- Pass the current `range` and `profile` into the utility when pressed
- Show a loading state while the PDF is being generated

### 4. PDF styling
Use inline CSS in the HTML to keep the PDF clean and professional:
- Navy (`#0F1F3D`) headers
- Clean table layout for line items
- Right-aligned amounts in GHS format
- Signature/date footer area

## Result
Users open Reports → pick Month/Quarter/Year → tap "Share PDF" → native share sheet opens → they can save to Files, email, WhatsApp, etc.