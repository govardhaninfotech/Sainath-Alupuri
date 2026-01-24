// ============================================
// GLOBAL PRINT/PDF/EXCEL SYSTEM - FINAL VERSION
// EXACT MATCH BETWEEN PRINT AND PDF
// ============================================

import { showNotification, showConfirm } from "../notification.js";

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
 * Generate HTML for print/PDF - EXACT MATCH DESIGN
 */
function generatePrintHTML(config) {
    const {
        reportTitle = 'Report',
        headers = [],
        rows = [],
        companyName = 'Sainath Alupuri',
        companySubtitle = 'Management System',
        logo = 'SA',
        additionalInfo = '',
        generatedDate = new Date().toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
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
                    size: A4;
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
                padding: 20px;
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
                padding-bottom: 12px;
                border-bottom: 3px solid #667eea;
                margin-bottom: 20px;
            }
            .logo-section {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .logo-img {
                width: 55px;
                height: 55px;
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
            
            /* ADDITIONAL INFO SECTION */
            .additional-info {
                background: #f3f4f6;
                padding: 15px 18px;
                border-radius: 4px;
                margin-bottom: 20px;
                border-left: 4px solid #667eea;
            }
            .additional-info p {
                margin: 5px 0;
                font-size: 14px;
                color: #1f2937;
                font-weight: 700;
            }
            
            /* TABLE SECTION */
            .table-container {
                width: 100%;
                margin-top: 0;
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
                padding: 12px 15px;
                border: 1px solid #d1d5db;
                text-align: left;
                background-color: #f9fafb;
                font-weight: 700;
                color: #1f2937;
                font-size: 14px;
            }
            td {
                padding: 12px 15px;
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
                margin-top: 30px;
                padding-top: 15px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 11px;
            }
            .footer p {
                margin: 3px 0;
                line-height: 1.5;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo-section">
                <img src="${logoPath}" alt="Logo" class="logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="logo" style="display: none;">${logo}</div>
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
        
        ${additionalInfo ? `
        <div class="additional-info">
            ${additionalInfo}
        </div>
        ` : ''}
        
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
 * EXPORT TO PDF - FINAL FIXED VERSION
 */
export async function exportToPDF(config) {
    const { reportTitle = 'Report' } = config;

    const confirmExport = await showConfirm(
        `📄 PDF Export Confirmation\n\n${reportTitle}\n\nPDF will be generated and downloaded. Do you want to continue?`,
        "info"
    );

    if (!confirmExport) return;

    if (!config.rows || config.rows.length === 0) {
        showNotification("No data available to export", "warning");
        return;
    }

    showNotification("Loading PDF library... Please wait", "info");

    try {
        await loadHtml2Pdf();
        showNotification("Generating PDF... Please wait", "info");

        const dropdown = document.getElementById("exportDropdown");
        if (dropdown) {
            dropdown.style.display = "none";
        }

        // Generate complete HTML
        const printHTML = generatePrintHTML(config);

        if (!printHTML) {
            showNotification("Error: Could not generate PDF content", "error");
            return;
        }

        // Create a temporary container
        const container = document.createElement('div');
        container.id = 'pdf-container';
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '210mm';
        container.style.backgroundColor = 'white';
        container.innerHTML = printHTML.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];
        
        // Add styles
        const styleMatch = printHTML.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        if (styleMatch) {
            const style = document.createElement('style');
            style.textContent = styleMatch[1];
            document.head.appendChild(style);
            style.id = 'pdf-temp-style';
        }
        
        document.body.appendChild(container);

        // Wait for rendering
        setTimeout(() => {
            const opt = {
                margin: [15, 15, 15, 15],
                filename: `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { 
                    type: 'jpeg', 
                    quality: 0.98 
                },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    letterRendering: true,
                    windowWidth: 794,
                    windowHeight: container.scrollHeight
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait',
                    compress: true
                },
                pagebreak: { 
                    mode: ['avoid-all', 'css', 'legacy']
                }
            };

            html2pdf()
                .set(opt)
                .from(container)
                .save()
                .then(() => {
                    document.body.removeChild(container);
                    const tempStyle = document.getElementById('pdf-temp-style');
                    if (tempStyle) tempStyle.remove();
                    showNotification("PDF downloaded successfully!", "success");
                })
                .catch(err => {
                    document.body.removeChild(container);
                    const tempStyle = document.getElementById('pdf-temp-style');
                    if (tempStyle) tempStyle.remove();
                    console.error('PDF export error:', err);
                    showNotification("Error generating PDF: " + (err.message || 'Unknown error'), "error");
                });
        }, 800);

    } catch (err) {
        console.error('Error loading PDF library:', err);
        showNotification("Error loading PDF library. Please refresh and try again.", "error");
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