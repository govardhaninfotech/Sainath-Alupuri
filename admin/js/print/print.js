import { preparePrintDatainclient } from "../user.js";

/**
 * Print the staff expense report with confirmation - Direct Print Dialog
 */
export async function printReportclient() {

    // const staffSelect = "viken"
    // const monthSelect = 12

    // if (!staffSelect || !monthSelect) {
    //     showNotification("Please select Staff and Month to print report", "warning");
    //     return;
    // }

    const staffName = "viken"
    const monthYear = 18;

    const confirmPrint = await showConfirm(
        `📋 Print Report Confirmation\n\nStaff: ${staffName}\nPeriod: ${monthYear}\n\nDo you want to print this report?`,
        "info"
    );

    if (!confirmPrint) return;

    // Prepare data for print
    const printData = preparePrintDatainclient();

    // Generate print HTML with proper table format
    const printHTML = generatePrintHTML(staffName, monthYear, printData);

    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHTML);
    printWindow.document.close();

    // Trigger print after content loads
    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
    }, 500);
};

/**
 * Generate HTML for print/PDF with proper table format
 */
function generatePrintHTML(staffName, monthYear, printData) {
    const headers = printData.headers || [];
    const rows = printData.rows || [];

    // Build table rows - ensure we escape HTML properly and add word-wrap
    const tableRows = rows.length > 0 ? rows.map(row => {
        const cells = row.map(cell => {
            const cellValue = String(cell || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<td style="padding: 8px; border: 1px solid #ddd; text-align: left; word-wrap: break-word; max-width: 150px;">${cellValue}</td>`;
        }).join('');
        return `<tr style="page-break-inside: avoid;">${cells}</tr>`;
    }).join('') : '<tr><td colspan="' + headers.length + '" style="padding: 20px; text-align: center;">No data available</td></tr>';

    const tableHeaders = headers.map(header => {
        const headerText = String(header || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<th style="padding: 10px; border: 1px solid #ddd; background-color: #f3f4f6; font-weight: 600; text-align: left;">${headerText}</th>`;
    }).join('');

    // Get logo path - will be converted to absolute path in PDF export function
    // Try to get the base path from current location
    const getLogoPath = () => {
        // If we're in admin folder, use relative path
        if (window.location.pathname.includes('/admin/')) {
            return 'images/logo.jpg';
        }
        // Otherwise, try to construct absolute path
        return '../admin/images/logo.jpg';
    };
    const logoPath = getLogoPath();

    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Staff Expense Report - ${staffName}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            @media print {
                @page {
                    margin: 1cm;
                    size: A4;
                }
                body {
                    margin: 0;
                    padding: 15px;
                }
                .header {
                    page-break-after: avoid;
                }
                table {
                    page-break-inside: auto;
                }
                tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                }
                thead {
                    display: table-header-group;
                }
                tfoot {
                    display: table-footer-group;
                }
            }
            body {
                font-family: Arial, sans-serif;
                padding: 15px;
                color: #333;
                background: white;
                font-size: 12px;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding-bottom: 15px;
                border-bottom: 2px solid #667eea;
                margin-bottom: 20px;
                page-break-after: avoid;
            }
            .logo-section {
                display: flex;
                align-items: center;
                gap: 15px;
                flex: 1;
            }
            .logo-img {
                width: 70px;
                height: 70px;
                object-fit: contain;
                border-radius: 8px;
                flex-shrink: 0;
            }
            .logo {
                width: 70px;
                height: 70px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 28px;
                flex-shrink: 0;
            }
            .company-info {
                flex: 1;
            }
            .company-info h1 {
                margin: 0;
                font-size: 22px;
                color: #1f2937;
                line-height: 1.2;
            }
            .company-info p {
                margin: 5px 0 0 0;
                color: #6b7280;
                font-size: 13px;
                line-height: 1.3;
            }
            .report-title {
                text-align: right;
                flex-shrink: 0;
                margin-left: 20px;
            }
            .report-title h2 {
                margin: 0;
                font-size: 18px;
                color: #1f2937;
                line-height: 1.2;
            }
            .report-title p {
                margin: 4px 0 0 0;
                color: #6b7280;
                font-size: 11px;
                line-height: 1.4;
            }
            .table-container {
                width: 100%;
                overflow: visible;
                margin-top: 15px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 0;
                font-size: 11px;
                page-break-inside: auto;
            }
            thead {
                display: table-header-group;
            }
            tbody {
                display: table-row-group;
            }
            th, td {
                padding: 8px 6px;
                border: 1px solid #ddd;
                text-align: left;
                word-wrap: break-word;
                max-width: 150px;
            }
            th {
                background-color: #f3f4f6;
                font-weight: 600;
                color: #374151;
                font-size: 11px;
            }
            td {
                font-size: 11px;
                vertical-align: top;
            }
            tr:nth-child(even) {
                background-color: #f9fafb;
            }
            tr {
                page-break-inside: avoid;
            }
            .footer {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 10px;
                page-break-inside: avoid;
            }
            .footer p {
                margin: 3px 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo-section">
                <img src="${logoPath}" alt="Logo" class="logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="logo" style="display: none;">SA</div>
                <div class="company-info">
                    <h1>Sainath Alupuri</h1>
                    <!-- <p>Staff Expense Management System</p> -->
                </div>
            </div>
            <div class="report-title">
               <!--  <h2>Staff Expense Report</h2> 
                <p>Staff: ${staffName}</p>
                <p>Period: ${monthYear}</p>-->
                <p style="font-size:15px">Generated on: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
        </div>
        
        <div class="table-container">
            <table>
                <thead>
                    <tr>${tableHeaders}</tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>This is an official report generated by Sainath Alupuri Management System created by Govardhan Infotech</p>
            <p>© ${new Date().getFullYear()} All Rights Reserved</p>
        </div>
    </body>
    </html>`;
}

/**
 * Load html2pdf library dynamically
 */
function loadHtml2Pdf() {
    return new Promise((resolve, reject) => {
        if (window.html2pdf) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.integrity = 'sha512-GsLlZN/3F2ErC5ifS5QtgpiJtWd43JWSuIgh7mbzZ8zBps+dvLusV+eNQATqgA/HdeKFVgA5v3S/cIrLF7QnIg==';
        script.crossOrigin = 'anonymous';
        script.referrerPolicy = 'no-referrer';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load html2pdf library'));
        document.head.appendChild(script);
    });
}

/**
 * Load XLSX library dynamically
 */
function loadXLSX() {
    return new Promise((resolve, reject) => {
        if (window.XLSX) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load XLSX library'));
        document.head.appendChild(script);
    });
}

/**
 * Export to PDF with confirmation - Direct PDF Download
 */
export async function exportToPDFmain() {
 

    const staffName = "viken";
    const monthYear = 12;

    const confirmExport = await showConfirm(
        `📄 PDF Export Confirmation\nPDF will be generated and downloaded. Do you want to continue?`,
        "info"
    );

    if (!confirmExport) return;

    showNotification("Loading PDF library... Please wait", "info");

    try {
        // Load library if not already loaded
        await loadHtml2Pdf();

        showNotification("Generating PDF... Please wait", "info");

        // Close dropdown
        const dropdown = document.getElementById("exportDropdown");
        if (dropdown) {
            dropdown.classList.remove("show");
        }

        // Prepare data for print
        const printData = preparePrintDatainclient();

        // Check if we have data
        if (!printData || !printData.rows || printData.rows.length === 0) {
            showNotification("No data available to export. Please select staff and month with expenses.", "warning");
            return;
        }

        console.log("Print data:", printData); // Debug log
        console.log("Rows count:", printData.rows.length); // Debug log

        // Generate complete HTML
        const printHTML = generatePrintHTML(staffName, monthYear, printData);
        console.log("Generated HTML length:", printHTML.length); // Debug log

        // Extract body and style content
        const bodyMatch = printHTML.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const styleMatch = printHTML.match(/<style[^>]*>([\s\S]*?)<\/style>/i);

        if (!bodyMatch || !bodyMatch[1]) {
            console.error("Could not extract body content from HTML");
            showNotification("Error: Could not extract content for PDF", "error");
            return;
        }

        // Create a visible container div (positioned off-screen but still renderable)
        const wrapper = document.createElement('div');
        wrapper.id = 'pdf-export-wrapper';
        wrapper.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 210mm;
                padding: 15px;
                background: white;
                font-family: Arial, sans-serif;
                color: #333;
                box-sizing: border-box;
                z-index: -1;
                overflow: visible;
            `;

        // Create style element and add to head
        if (styleMatch && styleMatch[1]) {
            const styleEl = document.createElement('style');
            styleEl.id = 'pdf-export-styles';
            // Remove @media print queries as they won't work in canvas, but keep other styles
            const styles = styleMatch[1].replace(/@media\s+print\s*\{[^}]*\}/g, '');
            styleEl.textContent = styles;
            document.head.appendChild(styleEl);
        }

        // Add body content to wrapper
        wrapper.innerHTML = bodyMatch[1];

        // Fix image paths - convert relative paths to absolute
        const images = wrapper.querySelectorAll('img');
        images.forEach(img => {
            const src = img.getAttribute('src');
            if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                // Convert relative path to absolute
                let absolutePath;
                if (src.startsWith('/')) {
                    absolutePath = window.location.origin + src;
                } else {
                    // Get base path - try to find admin folder
                    const pathParts = window.location.pathname.split('/');
                    let basePath = window.location.origin;

                    // If we're in admin folder or its subfolders
                    const adminIndex = pathParts.indexOf('admin');
                    if (adminIndex !== -1) {
                        basePath += '/' + pathParts.slice(0, adminIndex + 1).join('/');
                    } else {
                        // Fallback: use current directory
                        basePath += window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
                    }

                    // Handle relative paths
                    if (src.startsWith('../')) {
                        // Go up one level from base
                        const upLevel = basePath.substring(0, basePath.lastIndexOf('/'));
                        absolutePath = upLevel + '/' + src.substring(3);
                    } else {
                        absolutePath = basePath + '/' + src;
                    }
                }
                img.src = absolutePath;
                console.log("Updated image path from", src, "to", absolutePath);
            }
        });

        // Append to body
        document.body.appendChild(wrapper);

        // Wait for images to load and force layout calculation
        let imagesLoaded = 0;
        const totalImages = images.length;

        const checkImagesAndGenerate = () => {
            imagesLoaded++;
            if (imagesLoaded >= totalImages) {
                setTimeout(generatePDF, 200); // Small delay to ensure rendering
            }
        };

        if (totalImages > 0) {
            images.forEach(img => {
                if (img.complete && img.naturalHeight !== 0) {
                    checkImagesAndGenerate();
                } else {
                    img.onload = () => {
                        checkImagesAndGenerate();
                    };
                    img.onerror = () => {
                        console.warn("Image failed to load:", img.src);
                        checkImagesAndGenerate(); // Continue even if image fails
                    };
                    // Timeout fallback
                    setTimeout(() => {
                        if (!img.complete) {
                            checkImagesAndGenerate();
                        }
                    }, 2000);
                }
            });
        } else {
            setTimeout(generatePDF, 300);
        }

        function generatePDF() {
            // Force reflow to ensure all content is rendered
            wrapper.offsetHeight;

            // Calculate proper dimensions - use scrollHeight to get full content height
            const contentHeight = wrapper.scrollHeight;
            const contentWidth = wrapper.scrollWidth || 210 * 3.779527559; // A4 width in pixels (210mm)

            // For A4: 210mm x 297mm = 794px x 1123px at 96 DPI
            // But we need to account for margins, so use actual content height
            const maxHeight = Math.max(contentHeight, 1123); // Minimum A4 height
            const width = Math.min(contentWidth, 794); // Maximum A4 width

            console.log("Content dimensions:", contentWidth, "x", contentHeight);
            console.log("PDF dimensions:", width, "x", maxHeight);

            const opt = {
                margin: [8, 8, 8, 8],
                filename: `Staff_Expense_Report_${staffName.replace(/\s+/g, '_')}_${monthYear.replace('/', '-')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    width: width,
                    height: maxHeight,
                    windowWidth: width,
                    windowHeight: maxHeight,
                    allowTaint: true,
                    letterRendering: true,
                    scrollX: 0,
                    scrollY: 0
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait',
                    compress: true
                },
                pagebreak: {
                    mode: ['avoid-all', 'css', 'legacy'],
                    before: '.header',
                    after: '.footer',
                    avoid: ['tr', 'thead', 'tfoot']
                }
            };

            html2pdf()
                .set(opt)
                .from(wrapper)
                .save()
                .then(() => {
                    // Cleanup
                    if (wrapper.parentNode) {
                        document.body.removeChild(wrapper);
                    }
                    const styleEl = document.getElementById('pdf-export-styles');
                    if (styleEl && styleEl.parentNode) {
                        styleEl.remove();
                    }
                    showNotification("PDF downloaded successfully!", "success");
                })
                .catch(err => {
                    // Cleanup
                    if (wrapper.parentNode) {
                        document.body.removeChild(wrapper);
                    }
                    const styleEl = document.getElementById('pdf-export-styles');
                    if (styleEl && styleEl.parentNode) {
                        styleEl.remove();
                    }
                    console.error('PDF export error:', err);
                    console.error('Error details:', JSON.stringify(err, null, 2));
                    showNotification("Error generating PDF: " + (err.message || 'Unknown error'), "error");
                });
        }
    } catch (err) {
        console.error('Error loading PDF library:', err);
        showNotification("Error loading PDF library. Please refresh and try again.", "error");
    }
};

/**
 * Export to Excel with confirmation - Direct Excel Download with Professional Formatting
 */
export async function exportToExcelmain() {

    const staffSelect = document.getElementById("invStaffSelect");
    const monthSelect = document.getElementById("invMonthSelect");

    if (!staffSelect.value || !monthSelect.value) {
        showNotification("Please select Staff and Month to export", "warning");
        return;
    }

    const staffName = staffSelect.options[staffSelect.selectedIndex].text;
    const monthYear = monthSelect.value;

    const confirmExport = await showConfirm(
        `📊 Excel Export Confirmation\n\nStaff: ${staffName}\nPeriod: ${monthYear}\n\nExcel file will be downloaded. Do you want to continue?`,
        "info"
    );

    if (!confirmExport) return;

    showNotification("Loading Excel library... Please wait", "info");

    try {
        // Load library if not already loaded
        await loadXLSX();

        showNotification("Generating Excel file... Please wait", "info");

        // Close dropdown
        const dropdown = document.getElementById("exportDropdown");
        if (dropdown) {
            dropdown.classList.remove("show");
        }

        // Prepare data for print
        const printData = preparePrintDatainclient();
        const headers = printData.headers || [];
        const rows = printData.rows || [];

        // Config for Excel
        const config = {
            companyName: 'Sainath Alupuri',
            companySubtitle: 'Staff Expense Management System',
            logo: 'SA',
            reportTitle: `Staff Expense Report - ${staffName}`
        };

        // Get additional summary data
        const salary = document.getElementById("invStaffSalary")?.textContent || "₹0.00";
        const totalExpense = document.getElementById("invTotalExpense")?.textContent || "₹0.00";
        const balanceElement = document.getElementById("staffBalanceCard");
        const balance = balanceElement?.textContent.trim() || "₹0.00";

        try {
            // Create workbook
            const wb = XLSX.utils.book_new();

            // Build worksheet data with professional structure
            const wsData = [
                // Company Header (Row 1-2) - Will merge across all columns
                [config.companyName || 'Sainath Alupuri'],
                [config.companySubtitle || 'Staff Expense Management System'],
                [], // Empty row
                // Report Info (Row 4-7)
                ['Report Title:', `Staff Expense Report - ${staffName}`],
                ['Reporting Period:', monthYear],
                ['Generated Date:', new Date().toLocaleString('en-IN')],
                [], // Empty row
                // Summary Section (Row 9-11)
                ['SUMMARY INFORMATION'],
                ['Monthly Salary:', salary],
                ['Total Expenses:', totalExpense],
                ['Balance:', balance],
                [], // Empty row
                // Table Header (Row 13)
                headers,
                // Table Data (Row 14+)
                ...rows,
                [], // Empty row
                // Footer (Row at bottom)
                [`Generated by Sainath Alupuri Management System on ${new Date().toLocaleString('en-IN')}`]
            ];

            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Set column widths for better formatting
            const colWidths = headers.map((_, index) => {
                // Set width based on header length
                const maxLength = Math.max(
                    headers[index]?.length || 10,
                    ...rows.map(row => String(row[index] || '').length)
                );
                return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
            });
            ws['!cols'] = colWidths;

            // Set row heights
            ws['!rows'] = [
                { hpt: 20 }, // Company name row
                { hpt: 15 }, // Subtitle row
                { hpt: 5 },  // Empty row
                { hpt: 15 }, // Report info rows
                { hpt: 15 },
                { hpt: 15 },
                { hpt: 5 },  // Empty row
                { hpt: 18 }, // Summary header
                { hpt: 15 }, // Summary rows
                { hpt: 15 },
                { hpt: 15 },
                { hpt: 5 },  // Empty row
                { hpt: 18 }, // Table header
                ...rows.map(() => ({ hpt: 15 })), // Data rows
                { hpt: 5 },  // Empty row
                { hpt: 15 }  // Footer
            ];

            // Merge cells for headers and summary sections
            const mergeRanges = [];

            // Merge company name across all columns (Row 1, Cols 0 to headers.length-1)
            if (headers.length > 0) {
                mergeRanges.push({
                    s: { r: 0, c: 0 },
                    e: { r: 0, c: headers.length - 1 }
                });
                // Merge subtitle (Row 2)
                mergeRanges.push({
                    s: { r: 1, c: 0 },
                    e: { r: 1, c: headers.length - 1 }
                });
                // Merge summary header (Row 9)
                mergeRanges.push({
                    s: { r: 8, c: 0 },
                    e: { r: 8, c: headers.length - 1 }
                });
                // Merge footer (last row)
                mergeRanges.push({
                    s: { r: wsData.length - 1, c: 0 },
                    e: { r: wsData.length - 1, c: headers.length - 1 }
                });
            }

            ws['!merges'] = mergeRanges;

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Expense Report');

            // Save file
            const filename = `Staff_Expense_Report_${staffName.replace(/\s+/g, '_')}_${monthYear.replace('/', '-')}.xlsx`;
            XLSX.writeFile(wb, filename);

            showNotification("Excel file downloaded successfully!", "success");
        } catch (err) {
            console.error('Excel export error:', err);
            showNotification("Error generating Excel file. Please try again.", "error");
        }
    } catch (err) {
        console.error('Error loading Excel library:', err);
        showNotification("Error loading Excel library. Please refresh and try again.", "error");
    }
};

window.printReportclient = printReportclient;
window.exportToExcelmain = exportToExcelmain;
window.exportToPDFmain = exportToPDFmain;