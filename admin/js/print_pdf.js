// ============================================
// PRINT FULL PAGE AS PDF
// File: print_pdf.js
// ============================================

export function printKitchenSummaryPDF() {
    // Set document title (used as PDF filename)
    const date =
        document.getElementById("btnDate")?.value ||
        new Date().toISOString().split("T")[0];

    const originalTitle = document.title;
    document.title = `Kitchen_Summary_${date}`;

    // Small delay to ensure title update before print
    setTimeout(() => {
        window.print();

        // Restore original title after print
        document.title = originalTitle;
    }, 300);
}

// Make global
window.printKitchenSummaryPDF = printKitchenSummaryPDF;
