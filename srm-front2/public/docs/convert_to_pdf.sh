#!/bin/bash

# Convert HTML forms to PDF using wkhtmltopdf
echo "Converting registration form..."
wkhtmltopdf ICIUS_2026_Registration_Form.html ICIUS_2026_Registration_Form.pdf

echo "Converting copyright form..."
wkhtmltopdf ICIUS_2026_Copyright_Form.html ICIUS_2026_Copyright_Form.pdf

echo "Done! PDFs are ready."
