function generateReport() {
    const staffName = document.getElementById('staffName').value;
    const period = document.getElementById('period').value;
    const salary = parseFloat(document.getElementById('salary').value) || 0;
    const expenses = parseFloat(document.getElementById('expenses').value) || 0;
    const presentDays = parseInt(document.getElementById('presentDays').value) || 0;
    const absentDays = parseInt(document.getElementById('absentDays').value) || 0;
    const leaveDays = parseInt(document.getElementById('leaveDays').value) || 0;
    const capCount = parseInt(document.getElementById('capCount').value) || 0;
    const remarks = document.getElementById('remarks').value;

    if (!staffName || !period) {
        alert('Please fill in Staff Name and Report Period');
        return;
    }

    const balance = salary - expenses;
    const totalDays = presentDays + absentDays + leaveDays;

    const reportHTML = `
        <div id="pdfContent" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 900px; margin: 0 auto;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; color: white; text-align: center; border-radius: 8px; margin-bottom: 30px;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px;">
                    <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold;">SA</div>
                    <div style="text-align: left;">
                        <h1 style="margin: 0 0 5px 0; font-size: 28px;">Sainath Alupuri</h1>
                        <p style="margin: 0; opacity: 0.9;">Staff Management System</p>
                    </div>
                </div>
                <h2 style="margin: 15px 0 5px 0; font-size: 24px;">Staff Report</h2>
                <p style="margin: 0; opacity: 0.9;">Generated on ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <!-- Staff Information -->
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">👤 Staff Information</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 3px solid #667eea;">
                        <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">Staff Name</div>
                        <div style="font-size: 18px; font-weight: 700; color: #1f2937;">${staffName}</div>
                    </div>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 3px solid #667eea;">
                        <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">Report Period</div>
                        <div style="font-size: 18px; font-weight: 700; color: #1f2937;">${period}</div>
                    </div>
                </div>
            </div>

            <!-- Financial Summary -->
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">💰 Financial Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                    <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 3px solid #667eea;">
                        <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">Monthly Salary</div>
                        <div style="font-size: 18px; font-weight: 700; color: #1f2937;">₹${salary.toFixed(2)}</div>
                    </div>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 3px solid #667eea;">
                        <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">Total Expenses</div>
                        <div style="font-size: 18px; font-weight: 700; color: #ef4444;">₹${expenses.toFixed(2)}</div>
                    </div>
                    <div style="background: #f0f4ff; padding: 15px; border-radius: 6px; border-left: 3px solid #667eea;">
                        <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">Balance</div>
                        <div style="font-size: 18px; font-weight: 700; color: ${balance >= 0 ? '#10b981' : '#ef4444'};">₹${balance.toFixed(2)}</div>
                    </div>
                    <div style="background: #f0f4ff; padding: 15px; border-radius: 6px; border-left: 3px solid #667eea;">
                        <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">Balance Status</div>
                        <div style="font-size: 18px; font-weight: 700; color: ${balance >= 0 ? '#10b981' : '#ef4444'};">${balance >= 0 ? 'Positive' : 'Negative'}</div>
                    </div>
                </div>
            </div>

            <!-- Attendance Summary -->
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">📊 Attendance Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
                    <div style="background: #f0f4ff; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #dbeafe;">
                        <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 8px;">Present Days</div>
                        <div style="font-size: 24px; font-weight: 700; color: #10b981;">${presentDays}</div>
                    </div>
                    <div style="background: #f0f4ff; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #dbeafe;">
                        <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 8px;">Absent Days</div>
                        <div style="font-size: 24px; font-weight: 700; color: #ef4444;">${absentDays}</div>
                    </div>
                    <div style="background: #f0f4ff; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #dbeafe;">
                        <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 8px;">Leaves</div>
                        <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${leaveDays}</div>
                    </div>
                    <div style="background: #f0f4ff; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #dbeafe;">
                        <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 8px;">Total Days</div>
                        <div style="font-size: 24px; font-weight: 700; color: #667eea;">${totalDays}</div>
                    </div>
                </div>
            </div>

            <!-- Other Details -->
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">👕 Other Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 3px solid #667eea;">
                        <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">Cap Count</div>
                        <div style="font-size: 18px; font-weight: 700; color: #1f2937;">${capCount}</div>
                    </div>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 3px solid #667eea;">
                        <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">Attendance Rate</div>
                        <div style="font-size: 18px; font-weight: 700; color: #1f2937;">${totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0}%</div>
                    </div>
                </div>
            </div>

            ${remarks ? `
            <!-- Remarks -->
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">📝 Remarks</h3>
                <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 3px solid #667eea;">
                    <p style="color: #374151; line-height: 1.6; margin: 0;">${remarks}</p>
                </div>
            </div>
            ` : ''}

            <!-- Signature Area -->
            <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                <div style="text-align: center;">
                    <div style="border-top: 1px solid #1f2937; padding-top: 10px; font-size: 12px; color: #374151;">Staff Signature</div>
                </div>
                <div style="text-align: center;">
                    <div style="border-top: 1px solid #1f2937; padding-top: 10px; font-size: 12px; color: #374151;">Manager Signature</div>
                </div>
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 11px;">
                <p style="margin: 0;">This is an official report generated by Sainath Alupuri Management System</p>
                <p style="margin: 5px 0 0 0;">© 2026 All Rights Reserved | Confidential</p>
            </div>
        </div>
    `;

    document.getElementById('reportContainer').innerHTML = reportHTML;
}

function printReport() {
    const content = document.getElementById('pdfContent');
    if (!content) {
        alert('Please generate the report first!');
        return;
    }
    window.print();
}

function exportPDF() {
    const content = document.getElementById('pdfContent');
    if (!content) {
        alert('Please generate the report first!');
        return;
    }

    const staffName = document.getElementById('staffName').value || 'Staff_Report';
    const period = document.getElementById('period').value || 'Report';
    
    const options = {
        margin: 10,
        filename: `${staffName}_${period}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(options).from(content).save();
}

function exportExcel() {
    const staffName = document.getElementById('staffName').value || 'Staff';
    const period = document.getElementById('period').value || 'Report';
    const salary = parseFloat(document.getElementById('salary').value) || 0;
    const expenses = parseFloat(document.getElementById('expenses').value) || 0;
    const presentDays = parseInt(document.getElementById('presentDays').value) || 0;
    const absentDays = parseInt(document.getElementById('absentDays').value) || 0;
    const leaveDays = parseInt(document.getElementById('leaveDays').value) || 0;
    const capCount = parseInt(document.getElementById('capCount').value) || 0;

    if (!staffName || !period) {
        alert('Please generate the report first!');
        return;
    }

    const balance = salary - expenses;
    const totalDays = presentDays + absentDays + leaveDays;
    const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

    const data = [
        ['SAINATH ALUPURI - STAFF REPORT'],
        [],
        ['STAFF INFORMATION'],
        ['Staff Name', staffName],
        ['Report Period', period],
        [],
        ['FINANCIAL SUMMARY'],
        ['Monthly Salary', salary],
        ['Total Expenses', expenses],
        ['Balance', balance],
        ['Balance Status', balance >= 0 ? 'Positive' : 'Negative'],
        [],
        ['ATTENDANCE SUMMARY'],
        ['Present Days', presentDays],
        ['Absent Days', absentDays],
        ['Leaves', leaveDays],
        ['Total Days', totalDays],
        ['Attendance Rate (%)', attendanceRate],
        [],
        ['OTHER DETAILS'],
        ['Cap Count', capCount],
        [],
        ['Generated Date', new Date().toLocaleString('en-IN')],
        ['© 2026 Sainath Alupuri Management System']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    worksheet['A1'].s = { font: { bold: true, size: 14 }, fill: { fgColor: { rgb: 'FF667eea' } } };
    
    XLSX.writeFile(workbook, `${staffName}_${period}.xlsx`);
}

function clearForm() {
    document.getElementById('staffName').value = '';
    document.getElementById('period').value = '';
    document.getElementById('salary').value = '';
    document.getElementById('expenses').value = '';
    document.getElementById('presentDays').value = '';
    document.getElementById('absentDays').value = '';
    document.getElementById('leaveDays').value = '';
    document.getElementById('capCount').value = '';
    document.getElementById('remarks').value = '';
    document.getElementById('reportContainer').innerHTML = '';
}
