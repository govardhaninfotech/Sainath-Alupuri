// ============================================
// GLOBAL PRINT/PDF/EXCEL SYSTEM - SIMPLE APPROACH
// Use same print design for everything!
// ============================================

import { showNotification, showConfirm } from "../notification.js";

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
 * Load jsPDF and html2canvas libraries dynamically
 */
function loadPDFLibraries() {
    return new Promise((resolve, reject) => {
        // Check if both libraries are already loaded
        if (window.jspdf && window.html2canvas) {
            resolve();
            return;
        }

        let scriptsLoaded = 0;
        const scriptsNeeded = 2;

        const checkAllLoaded = () => {
            scriptsLoaded++;
            if (scriptsLoaded === scriptsNeeded) {
                resolve();
            }
        };

        // Load html2canvas first
        if (!window.html2canvas) {
            const html2canvasScript = document.createElement('script');
            html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            html2canvasScript.onload = checkAllLoaded;
            html2canvasScript.onerror = () => reject(new Error('Failed to load html2canvas library'));
            document.head.appendChild(html2canvasScript);
        } else {
            checkAllLoaded();
        }

        // Load jsPDF
        if (!window.jspdf) {
            const jsPDFScript = document.createElement('script');
            jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            jsPDFScript.onload = checkAllLoaded;
            jsPDFScript.onerror = () => reject(new Error('Failed to load jsPDF library'));
            document.head.appendChild(jsPDFScript);
        } else {
            checkAllLoaded();
        }
    });
}

/**
 * Generate HTML for print/PDF - SINGLE DESIGN FOR BOTH
 */
function generatePrintHTML(config) {
    const {
        reportTitle = 'Report',
        headers = [],
        rows = [],
        companyName = 'Sainath Alupuri',
        companySubtitle = 'Month: 02 | Year: 2026',
        logo = 'SA',
        additionalInfo = '',
        generatedDate = new Date().toLocaleDateString('en-IN', { 
            day: '2-digit',
            month: 'short', 
            year: 'numeric'
        })
    } = config;

    // Validate data
    if (!headers.length || !rows.length) {
        console.error('No headers or rows provided');
        return '';
    }

    // Build table rows
    const tableRows = rows.map(row => {
        const cells = row.map(cell => {
            const cellValue = String(cell || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<td>${cellValue}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
    }).join('');

    const tableHeaders = headers.map(header => {
        const headerText = String(header || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<th>${headerText}</th>`;
    }).join('');

    const getLogoPath = () => {
        if (window.location.pathname.includes('/admin/')) {
            return 'images/logo.jpg';
        }
        return '../admin/images/logo.jpg';
    };
    const logoPath = getLogoPath();

    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>${reportTitle}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            @media print {
                @page {
                    margin: 15mm;
                    size: A4 landscape;
                }
                body {
                    margin: 0;
                    padding: 0;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                padding: 30px;
                color: #1f2937;
                background: white;
                font-size: 14px;
                line-height: 1.6;
            }
            
            /* HEADER SECTION */
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding-bottom: 15px;
                border-bottom: 3px solid #667eea;
                margin-bottom: 25px;
            }
            
            .logo-section {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .logo-img {
                width: 55px;
                // height: 55px;
                object-fit: contain;
            }
            
            .logo {
                width: 55px;
                height: 55px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 22px;
            }
            
            .company-info h1 {
                margin: 0;
                font-size: 22px;
                color: #1f2937;
                font-weight: 700;
                line-height: 1.2;
            }
            
            .company-info p {
                margin: 2px 0 0 0;
                color: #6b7280;
                font-size: 13px;
            }
            
            .report-title {
                text-align: right;
            }
            
            .report-title h2 {
                margin: 0;
                font-size: 18px;
                color: #1f2937;
                font-weight: 700;
                line-height: 1.3;
            }
            
            .report-title p {
                margin: 3px 0 0 0;
                color: #6b7280;
                font-size: 12px;
            }
            
            /* TABLE SECTION */
            .table-container {
                width: 100%;
                margin-top: 0;
                margin-bottom: 25px;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
                border: 1px solid #d1d5db;
            }
            
            thead {
                background-color: #f9fafb;
            }
            
            th {
                padding: 14px 16px;
                border: 1px solid #d1d5db;
                text-align: left;
                background-color: #f9fafb;
                font-weight: 700;
                color: #1f2937;
                font-size: 14px;
            }
            
            td {
                padding: 14px 16px;
                border: 1px solid #d1d5db;
                text-align: left;
                color: #374151;
                font-size: 13px;
                background-color: white;
            }
            
            tbody tr:nth-child(even) td {
                background-color: #f9fafb;
            }
            
            /* FOOTER SECTION */
            .footer {
                margin-top: 35px;
                padding-top: 18px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 11px;
            }
            
            .footer p {
                margin: 4px 0;
                line-height: 1.6;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo-section">
                <img src="${logoPath}" alt="Logo" class="logo-img" onerror="this.style.display='none';">
                <div class="company-info">
                    <h1>${companyName}</h1>
                    <p>${companySubtitle}</p>
                </div>
            </div>
            <div class="report-title">
                <h2>${reportTitle}</h2>
                <p>Generated on: ${generatedDate}</p>
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
            <p>This is an official report generated by ${companyName} Management System created by Govardhan Infotech</p>
            <p>© ${new Date().getFullYear()} All Rights Reserved</p>
        </div>
    </body>
    </html>`;
}

// ============================================
// MAIN EXPORT FUNCTIONS
// ============================================

/**
 * PRINT REPORT
 */
export async function printReport(config) {
    const { reportTitle = 'Report' } = config;

    const confirmPrint = await showConfirm(
        `📋 Print Report Confirmation\n\n${reportTitle}\n\nDo you want to print this report?`,
        "info"
    );

    if (!confirmPrint) return;

    if (!config.rows || config.rows.length === 0) {
        showNotification("No data available to print", "warning");
        return;
    }

    const printHTML = generatePrintHTML(config);

    if (!printHTML) {
        showNotification("Error generating print content", "error");
        return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHTML);
    printWindow.document.close();

    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
    }, 500);
}

/**
 * EXPORT TO PDF - LANDSCAPE FORMAT
 */
export async function exportToPDF(config) {
    const { reportTitle = 'Report' } = config;

    const confirmExport = await showConfirm(
        `📄 PDF Export Confirmation\n\n${reportTitle}\n\nPDF will be downloaded directly to your device.\n\nDo you want to continue?`,
        "info"
    );

    if (!confirmExport) return;

    if (!config.rows || config.rows.length === 0) {
        showNotification("No data available to export", "warning");
        return;
    }

    const dropdown = document.getElementById("exportDropdown");
    if (dropdown) {
        dropdown.style.display = "none";
    }

    showNotification("Loading PDF libraries... Please wait", "info");

    try {
        // Load required libraries
        await loadPDFLibraries();
        
        showNotification("Generating PDF... Please wait", "info");

        // Generate HTML content
        const printHTML = generatePrintHTML(config);

        if (!printHTML) {
            showNotification("Error generating PDF content", "error");
            return;
        }

        // Create temporary container for rendering
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = printHTML;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        tempDiv.style.width = '297mm'; // A4 landscape width
        tempDiv.style.background = 'white';
        tempDiv.style.padding = '30px';
        tempDiv.style.boxSizing = 'border-box';
        document.body.appendChild(tempDiv);

        // Wait for images to load
        const images = tempDiv.getElementsByTagName('img');
        const imagePromises = Array.from(images).map(img => {
            return new Promise((resolve) => {
                if (img.complete) {
                    resolve();
                } else {
                    img.onload = resolve;
                    img.onerror = resolve; // Continue even if image fails
                }
            });
        });
        await Promise.all(imagePromises);

        // Generate PDF using html2canvas and jsPDF
        const canvas = await html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: tempDiv.scrollWidth,
            windowHeight: tempDiv.scrollHeight
        });

        // Clean up temporary div
        document.body.removeChild(tempDiv);

        // Create PDF in LANDSCAPE mode
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 297; // A4 landscape width in mm
        const pageHeight = 210; // A4 landscape height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        const imgData = canvas.toDataURL('image/jpeg', 1.0);

        // Add first page
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if content is longer than one page
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Generate filename and save
        const filename = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(filename);

        showNotification("PDF downloaded successfully!", "success");

    } catch (err) {
        console.error('PDF export error:', err);
        showNotification("Error generating PDF. Please try again.", "error");
    }
}

/**
 * EXPORT TO EXCEL
 */
export async function exportToExcel(config) {
    const { reportTitle = 'Report', companyName = 'Sainath Alupuri', companySubtitle = 'Management System' } = config;

    const confirmExport = await showConfirm(
        `📊 Excel Export Confirmation\n\n${reportTitle}\n\nExcel file will be downloaded. Do you want to continue?`,
        "info"
    );

    if (!confirmExport) return;

    showNotification("Loading Excel library... Please wait", "info");

    try {
        await loadXLSX();
        showNotification("Generating Excel file... Please wait", "info");

        const headers = config.headers || [];
        const rows = config.rows || [];

        if (rows.length === 0) {
            showNotification("No data available to export", "warning");
            return;
        }

        const dropdown = document.getElementById("exportDropdown");
        if (dropdown) {
            dropdown.style.display = "none";
        }

        const wb = XLSX.utils.book_new();

        const wsData = [
            [companyName],
            [companySubtitle],
            [],
            ['Report Title:', reportTitle],
            ['Generated Date:', new Date().toLocaleString('en-IN')],
            [],
            headers,
            ...rows,
            [],
            [`Generated by ${companyName} Management System on ${new Date().toLocaleString('en-IN')}`]
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        const colWidths = headers.map((_, index) => {
            const maxLength = Math.max(
                headers[index]?.length || 10,
                ...rows.map(row => String(row[index] || '').length)
            );
            return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
        });
        ws['!cols'] = colWidths;

        ws['!rows'] = [
            { hpt: 20 },
            { hpt: 15 },
            { hpt: 5 },
            { hpt: 15 },
            { hpt: 15 },
            { hpt: 5 },
            { hpt: 18 },
            ...rows.map(() => ({ hpt: 15 })),
            { hpt: 5 },
            { hpt: 15 }
        ];

        const mergeRanges = [];
        if (headers.length > 0) {
            mergeRanges.push(
                { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
                { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: headers.length - 1 } }
            );
        }
        ws['!merges'] = mergeRanges;

        XLSX.utils.book_append_sheet(wb, ws, reportTitle.substring(0, 30));

        const filename = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);

        showNotification("Excel file downloaded successfully!", "success");
    } catch (err) {
        console.error('Excel export error:', err);
        showNotification("Error generating Excel file. Please try again.", "error");
    }
}

/**
 * TOGGLE EXPORT DROPDOWN
 */
export function toggleExportDropdown() {
    const dropdown = document.getElementById("exportDropdown");
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
    }
}

// Close dropdown when clicking outside
document.addEventListener("click", function (event) {
    const dropdown = document.getElementById("exportDropdown");
    const exportBtn = event.target.closest(".btn-export");

    if (dropdown && !exportBtn && !dropdown.contains(event.target)) {
        dropdown.style.display = "none";
    }
});

// Make functions globally accessible
window.printReport = printReport;
window.exportToPDF = exportToPDF;
window.exportToExcel = exportToExcel;
window.toggleExportDropdown = toggleExportDropdown;