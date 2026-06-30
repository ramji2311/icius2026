// A simple script to create a basic PDF file using JavaScript
// You can run this with Node.js: node create_simple_pdf.js

const fs = require('fs');

// Simple PDF structure
const createSimplePdf = (title) => {
  return `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 6 0 R >> >>
endobj
5 0 obj
<< /Length 68 >>
stream
BT
/F1 24 Tf
100 700 Td
(${title}) Tj
ET
stream
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 7
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000210 00000 n
0000000251 00000 n
0000000369 00000 n
trailer
<< /Size 7 /Root 1 0 R >>
startxref
439
%%EOF`;
};

// Create Registration Form PDF
fs.writeFileSync('ICIUS_2026_Registration_Form.pdf', createSimplePdf('ICIUS 2026 Registration Form (Placeholder)'));
console.log('Registration Form PDF created.');

// Create Copyright Form PDF
fs.writeFileSync('ICIUS_2026_Copyright_Form.pdf', createSimplePdf('ICIUS 2026 Copyright Form (Placeholder)'));
console.log('Copyright Form PDF created.');
