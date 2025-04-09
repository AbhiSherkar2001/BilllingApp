// Utility function to add item
function addItem(containerId = 'items') {
    const container = document.getElementById(containerId);
    const newItem = document.createElement('div');
    newItem.className = 'item';
    newItem.innerHTML = `
        <input type="text" class="item-name" placeholder="Item Name">
        <input type="text" class="item-hsn" placeholder="HSN/SAC">
        <input type="number" class="item-quantity" placeholder="Quantity" step="0.01" oninput="updateTotal()">
        <select class="item-unit" onchange="updateTotal()">
            <option value="Kg">Kg</option>
            <option value="Qtl">Qtl</option>
        </select>
        <input type="number" class="item-price" placeholder="Price/Unit" step="0.01" oninput="updateTotal()">
        <input type="number" class="item-gst" value="5" placeholder="GST %" step="0.1" oninput="updateTotal()">
        <input type="number" class="item-amount" placeholder="Amount" readonly>
        <button class="remove-btn" onclick="this.parentElement.remove(); updateTotal()">Remove</button>
    `;
    container.appendChild(newItem);
    updateTotal();
}

// Update totals dynamically
function updateTotal() {
    const activeTab = document.querySelector('.tab-content[style*="display: block"]');
    let itemsContainer = activeTab.querySelector('#items');
    let sgstRateInput = activeTab.querySelector('#sgstRate') || activeTab.querySelector('#creditSgstRate');
    let cgstRateInput = activeTab.querySelector('#cgstRate') || activeTab.querySelector('#creditCgstRate');
    let totalsDiv = activeTab.querySelector('#totals') || activeTab.querySelector('#creditTotals') || activeTab.querySelector('#billTotals') || activeTab.querySelector('#receiptTotals');

    if (!itemsContainer || !totalsDiv) return;

    let subtotal = 0;
    const items = itemsContainer.getElementsByClassName('item');
    for (let item of items) {
        const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        const gstRate = parseFloat(item.querySelector('.item-gst').value) || 0;
        const amount = quantity * price;
        item.querySelector('.item-amount').value = amount.toFixed(2);
        subtotal += amount;
    }

    const sgstRate = parseFloat(sgstRateInput?.value) || 0;
    const cgstRate = parseFloat(cgstRateInput?.value) || 0;
    const sgstAmount = subtotal * (sgstRate / 100);
    const cgstAmount = subtotal * (cgstRate / 100);
    const total = subtotal + sgstAmount + cgstAmount;

    let html = `
        <strong>Totals:</strong><br>
        Sub Total: ₹${subtotal.toFixed(2)}<br>
        SGST @${sgstRate}%: ₹${sgstAmount.toFixed(2)}<br>
        CGST @${cgstRate}%: ₹${cgstAmount.toFixed(2)}<br>
        Total: ₹${total.toFixed(2)}<br>
        Amount in Words: ${numberToWords(Math.round(total))} Rupees Only<br>
    `;
    if (activeTab.id === 'paymentReceipt') {
        const received = parseFloat(document.getElementById('receiptAmount').value) || 0;
        html = `
            <strong>Totals:</strong><br>
            Received: ₹${received.toFixed(2)}<br>
            Amount in Words: ${numberToWords(Math.round(received))} Rupees Only<br>
        `;
    } else if (activeTab.id === 'bill') {
        html = `
            <strong>Totals:</strong><br>
            Sub Total: ₹${subtotal.toFixed(2)}<br>
            Total: ₹${subtotal.toFixed(2)}<br>
            Amount in Words: ${numberToWords(Math.round(subtotal))} Rupees Only<br>
        `;
    }
    totalsDiv.innerHTML = html;
}

// Convert number to words
function numberToWords(num) {
    const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const thousands = ["", "Thousand", "Lakh", "Crore"];

    if (num === 0) return "Zero";

    let words = "";
    let chunkCount = 0;
    while (num > 0) {
        let chunk = num % 1000;
        if (chunk) {
            let chunkWords = "";
            if (chunk >= 100) {
                chunkWords += units[Math.floor(chunk / 100)] + " Hundred ";
                chunk %= 100;
            }
            if (chunk >= 20) {
                chunkWords += tens[Math.floor(chunk / 10)] + " ";
                chunk %= 10;
            }
            if (chunk > 0 && chunk < 10) {
                chunkWords += units[chunk] + " ";
            } else if (chunk >= 10 && chunk < 20) {
                chunkWords += teens[chunk - 10] + " ";
            }
            words = chunkWords + (thousands[chunkCount] ? thousands[chunkCount] + " " : "") + words;
        }
        num = Math.floor(num / 1000);
        chunkCount++;
    }
    return words.trim();
}

// Generate Tax Invoice
function generateTaxInvoice() {
    const doc = new window.jspdf.jsPDF();
    const companyName = document.getElementById('companyName').value;
    const companyAddress = document.getElementById('companyAddress').value;
    const companyGSTIN = document.getElementById('companyGSTIN').value;
    const billToName = document.getElementById('billToName').value;
    const billToAddress = document.getElementById('billToAddress').value;
    const billToGSTIN = document.getElementById('billToGSTIN').value;
    const shipToName = document.getElementById('shipToName').value;
    const shipToAddress = document.getElementById('shipToAddress').value;
    const invoiceNo = document.getElementById('invoiceNo').value;
    const invoiceDate = document.getElementById('invoiceDate').value;
    const items = document.getElementById('items').getElementsByClassName('item');
    const sgstRate = parseFloat(document.getElementById('sgstRate').value) || 0;
    const cgstRate = parseFloat(document.getElementById('cgstRate').value) || 0;

    let y = 10;
    doc.setFontSize(16);
    doc.text("Tax Invoice", 105, y, { align: "center" });
    y += 10;
    doc.setFontSize(10);
    doc.text(`${companyName}`, 10, y);
    y += 5;
    doc.text(`${companyAddress}`, 10, y);
    y += 5;
    doc.text(`GSTIN: ${companyGSTIN}`, 10, y);
    y += 10;
    doc.text(`Bill To: ${billToName}`, 10, y);
    y += 5;
    doc.text(`${billToAddress}`, 10, y);
    y += 5;
    doc.text(`GSTIN: ${billToGSTIN}`, 10, y);
    y += 5;
    doc.text(`Ship To: ${shipToName}`, 150, 30);
    doc.text(`${shipToAddress}`, 150, 35);
    y += 10;
    doc.text(`Invoice No: ${invoiceNo} | Date: ${invoiceDate}`, 10, y);
    y += 10;

    const tableData = [];
    let subtotal = 0;
    for (let item of items) {
        const name = item.querySelector('.item-name').value || '';
        const hsn = item.querySelector('.item-hsn').value || '';
        const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
        const unit = item.querySelector('.item-unit').value || '';
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        const gst = parseFloat(item.querySelector('.item-gst').value) || 0;
        const amount = quantity * price;
        subtotal += amount;
        tableData.push([name, hsn, quantity, unit, `₹${price.toFixed(2)}`, `${gst}%`, `₹${amount.toFixed(2)}`]);
    }

    doc.autoTable({
        startY: y,
        head: [['#', 'Item Name', 'HSN/SAC', 'Quantity', 'Unit', 'Price/Unit', 'GST', 'Amount']],
        body: tableData.map((row, index) => [index + 1, ...row]),
        theme: 'striped',
        headStyles: { fillColor: [128, 0, 128] },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 40 },
            2: { cellWidth: 20 },
            3: { cellWidth: 20 },
            4: { cellWidth: 20 },
            5: { cellWidth: 20 },
            6: { cellWidth: 20 },
            7: { cellWidth: 30, halign: 'right' },
        },
    });

    y = doc.lastAutoTable.finalY + 10;
    const sgstAmount = subtotal * (sgstRate / 100);
    const cgstAmount = subtotal * (cgstRate / 100);
    const total = subtotal + sgstAmount + cgstAmount;
    doc.text(`Sub Total: ₹${subtotal.toFixed(2)}`, 140, y, { align: "right" });
    y += 5;
    doc.text(`SGST @${sgstRate}%: ₹${sgstAmount.toFixed(2)}`, 140, y, { align: "right" });
    y += 5;
    doc.text(`CGST @${cgstRate}%: ₹${cgstAmount.toFixed(2)}`, 140, y, { align: "right" });
    y += 5;
    doc.text(`Total: ₹${total.toFixed(2)}`, 140, y, { align: "right" });
    y += 10;
    doc.text(`Invoice Amount In Words: ${numberToWords(Math.round(total))} Rupees Only`, 10, y);
    y += 10;
    doc.text("Terms and Conditions: Thanks for doing business with us!", 10, y);
    y += 10;
    doc.text("Pay To: Bank Name: HDFC BANK, PARNER", 10, y);
    y += 5;
    doc.text("Bank Account No.: 50200084833344", 10, y);
    y += 5;
    doc.text("Bank IFSC Code: HDFC0003005", 10, y);
    y += 5;
    doc.text("Account holder's name: Prospera Solutions", 10, y);
    doc.save(`tax_invoice_${invoiceNo}.pdf`);
    generateExcelReport('taxInvoice', tableData.map((row, index) => ({ '#': index + 1, ...row })));
    linkTransaction('invoice', billToName, total);
}

// Generate Payment Receipt
function generatePaymentReceipt() {
    const doc = new window.jspdf.jsPDF();
    const companyName = document.getElementById('companyName').value;
    const companyAddress = document.getElementById('companyAddress').value;
    const companyGSTIN = document.getElementById('companyGSTIN').value;
    const receivedFromName = document.getElementById('receivedFromName').value;
    const receivedFromAddress = document.getElementById('receivedFromAddress').value;
    const receivedFromContact = document.getElementById('receivedFromContact').value;
    const receiptAmount = parseFloat(document.getElementById('receiptAmount').value) || 0;
    const receiptNo = document.getElementById('receiptNo').value;
    const receiptDate = document.getElementById('receiptDate').value;

    let y = 10;
    doc.setFontSize(16);
    doc.text("Payment Receipt", 105, y, { align: "center" });
    y += 10;
    doc.setFontSize(10);
    doc.text(`${companyName}`, 10, y);
    y += 5;
    doc.text(`${companyAddress}`, 10, y);
    y += 5;
    doc.text(`GSTIN: ${companyGSTIN}`, 10, y);
    y += 10;
    doc.text(`Received From: ${receivedFromName}`, 10, y);
    y += 5;
    doc.text(`${receivedFromAddress}`, 10, y);
    y += 5;
    doc.text(`Contact No: ${receivedFromContact}`, 10, y);
    y += 10;
    doc.text(`Receipt No: ${receiptNo} | Date: ${receiptDate}`, 10, y);
    y += 10;
    doc.text(`Amount: ₹${receiptAmount.toFixed(2)}`, 140, y, { align: "right" });
    y += 10;
    doc.text(`Amount in Words: ${numberToWords(Math.round(receiptAmount))} Rupees Only`, 10, y);
    y += 10;
    doc.text("For: Prospera Solutions", 140, y, { align: "right" });
    doc.text("Authorized Signatory", 140, y + 10, { align: "right" });

    doc.save(`payment_receipt_${receiptNo}.pdf`);
    generateExcelReport('paymentReceipt', [{ Amount: receiptAmount }]);
    linkTransaction('receipt', receivedFromName, receiptAmount);
}

// Generate Credit Note
function generateCreditNote() {
    const doc = new window.jspdf.jsPDF();
    const companyName = document.getElementById('companyName').value;
    const companyAddress = document.getElementById('companyAddress').value;
    const companyGSTIN = document.getElementById('companyGSTIN').value;
    const returnFromName = document.getElementById('returnFromName').value;
    const returnFromAddress = document.getElementById('returnFromAddress').value;
    const returnFromGSTIN = document.getElementById('returnFromGSTIN').value;
    const creditNoteNo = document.getElementById('creditNoteNo').value;
    const creditNoteDate = document.getElementById('creditNoteDate').value;
    const items = document.getElementById('creditItems').getElementsByClassName('item');
    const sgstRate = parseFloat(document.getElementById('creditSgstRate').value) || 0;
    const cgstRate = parseFloat(document.getElementById('creditCgstRate').value) || 0;

    let y = 10;
    doc.setFontSize(16);
    doc.text("Credit Note", 105, y, { align: "center" });
    y += 10;
    doc.setFontSize(10);
    doc.text(`${companyName}`, 10, y);
    y += 5;
    doc.text(`${companyAddress}`, 10, y);
    y += 5;
    doc.text(`GSTIN: ${companyGSTIN}`, 10, y);
    y += 10;
    doc.text(`Return From: ${returnFromName}`, 10, y);
    y += 5;
    doc.text(`${returnFromAddress}`, 10, y);
    y += 5;
    doc.text(`GSTIN: ${returnFromGSTIN}`, 10, y);
    y += 10;
    doc.text(`Credit Note No: ${creditNoteNo} | Date: ${creditNoteDate}`, 10, y);
    y += 10;

    const tableData = [];
    let subtotal = 0;
    for (let item of items) {
        const name = item.querySelector('.item-name').value || '';
        const hsn = item.querySelector('.item-hsn').value || '';
        const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
        const unit = item.querySelector('.item-unit').value || '';
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        const gst = parseFloat(item.querySelector('.item-gst').value) || 0;
        const amount = quantity * price;
        subtotal += amount;
        tableData.push([name, hsn, quantity, unit, `₹${price.toFixed(2)}`, `${gst}%`, `₹${amount.toFixed(2)}`]);
    }

    doc.autoTable({
        startY: y,
        head: [['#', 'Item Name', 'HSN/SAC', 'Quantity', 'Unit', 'Price/Unit', 'GST', 'Amount']],
        body: tableData.map((row, index) => [index + 1, ...row]),
        theme: 'striped',
        headStyles: { fillColor: [128, 0, 128] },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 40 },
            2: { cellWidth: 20 },
            3: { cellWidth: 20 },
            4: { cellWidth: 20 },
            5: { cellWidth: 20 },
            6: { cellWidth: 20 },
            7: { cellWidth: 30, halign: 'right' },
        },
    });

    y = doc.lastAutoTable.finalY + 10;
    const sgstAmount = subtotal * (sgstRate / 100);
    const cgstAmount = subtotal * (cgstRate / 100);
    const total = subtotal + sgstAmount + cgstAmount;
    doc.text(`Sub Total: ₹${subtotal.toFixed(2)}`, 140, y, { align: "right" });
    y += 5;
    doc.text(`SGST @${sgstRate}%: ₹${sgstAmount.toFixed(2)}`, 140, y, { align: "right" });
    y += 5;
    doc.text(`CGST @${cgstRate}%: ₹${cgstAmount.toFixed(2)}`, 140, y, { align: "right" });
    y += 5;
    doc.text(`Total: ₹${total.toFixed(2)}`, 140, y, { align: "right" });
    y += 10;
    doc.text(`Amount in Words: ${numberToWords(Math.round(total))} Rupees Only`, 10, y);
    y += 10;
    doc.text("For: Prospera Solutions", 140, y, { align: "right" });
    doc.text("Authorized Signatory", 140, y + 10, { align: "right" });

    doc.save(`credit_note_${creditNoteNo}.pdf`);
    generateExcelReport('creditNote', tableData.map((row, index) => ({ '#': index + 1, ...row })));
    linkTransaction('credit', returnFromName, total);
}

// Generate Bill
function generateBill() {
    const doc = new window.jspdf.jsPDF();
    const companyName = document.getElementById('companyName').value;
    const companyAddress = document.getElementById('companyAddress').value;
    const companyGSTIN = document.getElementById('companyGSTIN').value;
    const billFromName = document.getElementById('billFromName').value;
    const billFromAddress = document.getElementById('billFromAddress').value;
    const billFromContact = document.getElementById('billFromContact').value;
    const billNo = document.getElementById('billNo').value;
    const billDate = document.getElementById('billDate').value;
    const items = document.getElementById('billItems').getElementsByClassName('item');

    let y = 10;
    doc.setFontSize(16);
    doc.text("Bill", 105, y, { align: "center" });
    y += 10;
    doc.setFontSize(10);
    doc.text(`${companyName}`, 10, y);
    y += 5;
    doc.text(`${companyAddress}`, 10, y);
    y += 5;
    doc.text(`GSTIN: ${companyGSTIN}`, 10, y);
    y += 10;
    doc.text(`Bill From: ${billFromName}`, 10, y);
    y += 5;
    doc.text(`${billFromAddress}`, 10, y);
    y += 5;
    doc.text(`Contact No: ${billFromContact}`, 10, y);
    y += 10;
    doc.text(`Bill No: ${billNo} | Date: ${billDate}`, 10, y);
    y += 10;

    const tableData = [];
    let subtotal = 0;
    for (let item of items) {
        const name = item.querySelector('.item-name').value || '';
        const hsn = item.querySelector('.item-hsn').value || '';
        const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
        const unit = item.querySelector('.item-unit').value || '';
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        const amount = quantity * price;
        subtotal += amount;
        tableData.push([name, hsn, quantity, unit, `₹${price.toFixed(2)}`, `₹${amount.toFixed(2)}`]);
    }

    doc.autoTable({
        startY: y,
        head: [['#', 'Item Name', 'HSN/SAC', 'Quantity', 'Unit', 'Price/Unit', 'Amount']],
        body: tableData.map((row, index) => [index + 1, ...row]),
        theme: 'striped',
        headStyles: { fillColor: [128, 0, 128] },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 40 },
            2: { cellWidth: 20 },
            3: { cellWidth: 20 },
            4: { cellWidth: 20 },
            5: { cellWidth: 30 },
            6: { cellWidth: 30, halign: 'right' },
        },
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.text(`Sub Total: ₹${subtotal.toFixed(2)}`, 140, y, { align: "right" });
    y += 5;
    doc.text(`Total: ₹${subtotal.toFixed(2)}`, 140, y, { align: "right" });
    y += 10;
    doc.text(`Bill Amount In Words: ${numberToWords(Math.round(subtotal))} Rupees Only`, 10, y);
    y += 10;
    doc.text("Terms and Conditions: Thanks for doing business with us!", 10, y);
    y += 10;
    doc.text("For: Prospera Solutions", 140, y, { align: "right" });
    doc.text("Authorized Signatory", 140, y + 10, { align: "right" });

    doc.save(`bill_${billNo}.pdf`);
    generateExcelReport('bill', tableData.map((row, index) => ({ '#': index + 1, ...row })));
    linkTransaction('bill', billFromName, subtotal);
}

// Generate WhatsApp text
function generateWhatsApp(type) {
    const companyName = document.getElementById('companyName').value;
    let text = `*${companyName}*\n`;
    switch (type) {
        case 'taxInvoice':
            const billToName = document.getElementById('billToName').value;
            const invoiceNo = document.getElementById('invoiceNo').value;
            const invoiceDate = document.getElementById('invoiceDate').value;
            const total = parseFloat(document.getElementById('totals').innerHTML.match(/Total: ₹([\d.]+)/)[1]) || 0;
            text += `*Tax Invoice*\nBill To: ${billToName}\nInvoice No: ${invoiceNo}\nDate: ${invoiceDate}\nTotal: ₹${total.toFixed(2)}`;
            break;
        case 'paymentReceipt':
            const receivedFromName = document.getElementById('receivedFromName').value;
            const receiptNo = document.getElementById('receiptNo').value;
            const receiptDate = document.getElementById('receiptDate').value;
            const receiptAmount = parseFloat(document.getElementById('receiptAmount').value) || 0;
            text += `*Payment Receipt*\nReceived From: ${receivedFromName}\nReceipt No: ${receiptNo}\nDate: ${receiptDate}\nAmount: ₹${receiptAmount.toFixed(2)}`;
            break;
        case 'creditNote':
            const returnFromName = document.getElementById('returnFromName').value;
            const creditNoteNo = document.getElementById('creditNoteNo').value;
            const creditNoteDate = document.getElementById('creditNoteDate').value;
            const creditTotal = parseFloat(document.getElementById('creditTotals').innerHTML.match(/Total: ₹([\d.]+)/)[1]) || 0;
            text += `*Credit Note*\nReturn From: ${returnFromName}\nCredit Note No: ${creditNoteNo}\nDate: ${creditNoteDate}\nTotal: ₹${creditTotal.toFixed(2)}`;
            break;
        case 'bill':
            const billFromName = document.getElementById('billFromName').value;
            const billNo = document.getElementById('billNo').value;
            const billDate = document.getElementById('billDate').value;
            const billTotal = parseFloat(document.getElementById('billTotals').innerHTML.match(/Total: ₹([\d.]+)/)[1]) || 0;
            text += `*Bill*\nBill From: ${billFromName}\nBill No: ${billNo}\nDate: ${billDate}\nTotal: ₹${billTotal.toFixed(2)}`;
            break;
    }
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
}

// Generate Excel report
function generateExcelReport(type, data) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type);
    XLSX.writeFile(wb, `${type}_report.xlsx`);
}

// Link transactions
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
function linkTransaction(type, name, amount) {
    const transactionId = `TXN-${Date.now()}`;
    transactions.push({ id: transactionId, type, name, amount, date: new Date().toISOString() });
    localStorage.setItem('transactions', JSON.stringify(transactions));
    alert(`Transaction linked with ID: ${transactionId}`);
}