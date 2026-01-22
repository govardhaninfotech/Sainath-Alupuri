// Global Print System - Reusable for any data type
// Data is passed via localStorage or URL parameters

let printData = null;
let config = {
    companyName: 'Sainath Alupuri',
    companySubtitle: 'Professional Report',
    logo: 'SA',
    reportTitle: 'Report'
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    loadPrintData();
    renderTable();
    updateReportInfo();
});

/**
 * Load print data from localStorage or URL parameters
 */
function loadPrintData() {
    // Try to get from localStorage first
    const storedData = localStorage.getItem('printData');
    const storedConfig = localStorage.getItem('printConfig');

    if (storedData) {
        try {
            printData = JSON.parse(storedData);
            if (storedConfig) {
                config = { ...config, ...JSON.parse(storedConfig) };
            }
        } catch (e) {
            console.error('Error parsing print data:', e);
            printData = getDefaultData();
        }
    } else {
        // Fallback to URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const dataParam = urlParams.get('data');
        if (dataParam) {
            try {
                printData = JSON.parse(decodeURIComponent(dataParam));
            } catch (e) {
                console.error('Error parsing URL data:', e);
                printData = getDefaultData();
            }
        } else {
            printData = getDefaultData();
        }
    }

    // Clean up localStorage after loading
    if (storedData) {
        localStorage.removeItem('printData');
        localStorage.removeItem('printConfig');
    }
}

/**
 * Default data if nothing is provided
 */
function getDefaultData() {
    return {
        headers: ['ID', 'Product', 'Price', 'Status'],
        rows: [
            { ID: 'A101', Product: 'Sample Product', Price: '$100', Status: 'Active' }
        ],
        title: 'Sample Report'
    };
}

/**
 * Update report information in header
 */
function updateReportInfo() {
    document.getElementById('companyName').textContent = config.companyName || 'Sainath Alupuri';
    document.getElementById('companySubtitle').textContent = config.companySubtitle || 'Professional Report';
    document.getElementById('companyLogo').textContent = config.logo || 'SA';
    document.getElementById('reportTitle').textContent = printData?.title || config.reportTitle || 'Report';
    document.getElementById('reportDate').textContent = `Generated on ${new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}`;
}

/**
 * Render table from print data
 */
function renderTable() {
    const container = document.getElementById('reportContainer');
    if (!container || !printData) return;

    // Build headers
    const headers = printData.headers || [];

    // Build rows
    const rows = printData.rows || [];

    // Build table HTML
    let tableHtml = '';

    if (printData.title) {
        tableHtml += `<h2>${printData.title}</h2>`;
    }

    if (rows.length === 0) {
        tableHtml += '<p style="padding: 20px; text-align: center; color: #999;">No data available</p>';
    } else {
        tableHtml += `
            <table id="printableTable">
                <thead>
                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${rows.map(row => {
            if (Array.isArray(row)) {
                return `<tr>${row.map(cell => `<td>${cell || ''}</td>`).join('')}</tr>`;
            } else if (typeof row === 'object') {
                return `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`;
            }
            return '';
        }).join('')}
                </tbody>
            </table>
        `;
    }

    container.innerHTML = tableHtml;
}

/**
 * Export to PDF - Make globally accessible
 */
window.exportToPDF = function exportToPDF() {
    const element = document.getElementById('reportContainer');
    if (!element) {
        alert('No data available to export');
        return;
    }

    const opt = {
        margin: [5, 5, 5, 5],
        filename: `${config.reportTitle || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 1.5,
            scrollY: 0,
            windowWidth: document.body.scrollWidth
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };


    // Include header in PDF
    const headerHtml = `
        <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1 style="font-size: 20px; margin: 0; color: #1f2937;">${config.companyName}</h1>
                    <p style="font-size: 12px; color: #6b7280; margin: 5px 0 0 0;">${config.companySubtitle}</p>
                </div>
                <div style="text-align: right;">
                    <h2 style="font-size: 18px; margin: 0; color: #1f2937;">${printData?.title || config.reportTitle}</h2>
                    <p style="font-size: 10px; color: #6b7280; margin: 5px 0 0 0;">Generated on ${new Date().toLocaleDateString('en-IN')}</p>
                </div>
            </div>
        </div>
    `;

    html2pdf()
        .set(opt)
        .from(headerHtml + element.innerHTML)
        .save()
        .catch(err => {
            console.error('PDF export error:', err);
            alert('Error generating PDF. Please try again.');
        });
}

/**
 * Export to Excel - Make globally accessible
 */
window.exportToExcel = function exportToExcel() {
    const table = document.getElementById('printableTable');
    if (!table) {
        alert('No data available to export');
        return;
    }

    try {
        // Get headers and rows
        const headers = printData?.headers || [];
        const rows = printData?.rows || [];

        // Create worksheet data
        const wsData = [
            [config.companyName],
            [config.companySubtitle],
            [`Report: ${printData?.title || config.reportTitle}`],
            [`Generated: ${new Date().toLocaleString('en-IN')}`],
            [], // Empty row
            headers, // Header row
            ...rows // Data rows
        ];

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Report');

        // Save file
        const filename = `${(config.reportTitle || 'Report').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
    } catch (err) {
        console.error('Excel export error:', err);
        alert('Error generating Excel file. Please try again.');
    }
}