<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ID Pirate - Invoice Manager</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Pirata+One&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
        .font-pirate {
            font-family: 'Pirata One', cursive;
        }
        #invoice-display {
            display: none;
        }
        @media print {
            body * {
                visibility: hidden;
            }
            #invoice-container, #invoice-container * {
                visibility: visible;
            }
            #invoice-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
            }
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body class="bg-gray-900 text-gray-200 p-4 sm:p-8">

    <div class="max-w-4xl mx-auto">
        <!-- MANAGER SECTION -->
        <div id="manager-section" class="bg-gray-800 shadow-lg rounded-xl p-8 md:p-12 mb-8">
            <header class="text-center mb-8">
                <h1 class="font-pirate text-5xl md:text-6xl text-white tracking-wider">Invoice Generator</h1>
                <p class="text-gray-400">Create a new invoice</p>
            </header>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Customer Info -->
                <div>
                    <label for="customer" class="block text-sm font-medium text-gray-400 mb-2">Customer Info (Phone Number)</label>
                    <input type="text" id="customer" name="customer" placeholder="e.g., 5712347562" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
                <!-- Batch -->
                <div>
                    <label for="batch" class="block text-sm font-medium text-gray-400 mb-2">Batch Number</label>
                    <input type="text" id="batch" name="batch" placeholder="e.g., B7" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
                <!-- ID Type -->
                <div>
                    <label for="id-type" class="block text-sm font-medium text-gray-400 mb-2">Type of ID</label>
                    <select id="id-type" name="id-type" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option data-price="100">New Jersey (New Version)</option>
                        <option data-price="85">Old Maine</option>
                        <option data-price="85">Washington (Old Version)</option>
                        <option data-price="85">Oregon (Old Version)</option>
                        <option data-price="85">South Carolina (Old Version)</option>
                        <option data-price="90">Pennsylvania</option>
                        <option data-price="85">Missouri (Old Version)</option>
                        <option data-price="90">Illinois</option>
                        <option data-price="90">Connecticut</option>
                        <option data-price="90">Arizona</option>
                    </select>
                </div>
                 <!-- Unit Price -->
                <div>
                    <label for="unit-price" class="block text-sm font-medium text-gray-400 mb-2">Unit Price ($)</label>
                    <input type="number" id="unit-price" name="unit-price" step="0.01" min="0" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
                <!-- Quantity -->
                <div>
                    <label for="quantity" class="block text-sm font-medium text-gray-400 mb-2">Quantity</label>
                    <input type="number" id="quantity" name="quantity" value="1" min="1" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
                 <!-- Payment Method -->
                <div>
                    <label for="payment-method" class="block text-sm font-medium text-gray-400 mb-2">Payment Method</label>
                    <select id="payment-method" name="payment-method" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option>Apple Pay</option>
                        <option>Crypto</option>
                        <option>Zelle</option>
                        <option>Card</option>
                        <option>Venmo</option>
                        <option>Cash App</option>
                    </select>
                </div>
            </div>
             <div class="mt-6">
                <label for="handling-fee" class="block text-sm font-medium text-gray-400 mb-2">Processing & Handling ($)</label>
                <input type="number" id="handling-fee" name="handling-fee" value="5.00" step="0.01" min="0" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>

            <div class="mt-8 text-center">
                <button onclick="generateInvoice()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg">
                    Generate Invoice
                </button>
            </div>
        </div>

        <!-- INVOICE DISPLAY SECTION -->
        <div id="invoice-display">
            <!-- The generated invoice will be injected here -->
        </div>
    </div>

    <script>
        const idTypeSelect = document.getElementById('id-type');
        const unitPriceInput = document.getElementById('unit-price');

        function updatePrice() {
            const selectedOption = idTypeSelect.options[idTypeSelect.selectedIndex];
            const price = selectedOption.getAttribute('data-price');
            unitPriceInput.value = parseFloat(price).toFixed(2);
        }

        idTypeSelect.addEventListener('change', updatePrice);
        
        // Set initial price on page load
        document.addEventListener('DOMContentLoaded', updatePrice);

        function generateInvoice() {
            // --- 1. Get values from the form ---
            const customer = document.getElementById('customer').value || 'N/A';
            const batch = document.getElementById('batch').value || 'B0';
            const idType = idTypeSelect.value;
            const quantity = parseFloat(document.getElementById('quantity').value) || 0;
            const unitPrice = parseFloat(unitPriceInput.value) || 0;
            const handlingFee = parseFloat(document.getElementById('handling-fee').value) || 0;
            const paymentMethod = document.getElementById('payment-method').value;

            // --- 2. Calculations ---
            const subtotal = quantity * unitPrice;
            const total = subtotal + handlingFee;

            // --- 3. Generate dynamic data ---
            const customerLastFour = customer.slice(-4);
            const orderNumber = `IDP${batch}${customerLastFour}`;
            const today = new Date();
            const formattedDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

            // --- 4. Create Invoice HTML ---
            const invoiceHTML = `
                <div id="invoice-container" class="max-w-4xl mx-auto bg-gray-800 shadow-lg rounded-xl overflow-hidden">
                    <div class="p-8 md:p-12">
                        <header class="flex justify-between items-start mb-12">
                            <div>
                                <h1 class="font-pirate text-5xl md:text-6xl text-white tracking-wider">ID Pirate</h1>
                                <p class="text-gray-400">idpirate.com</p>
                            </div>
                            <div class="text-right">
                                <h2 class="text-3xl md:text-4xl font-bold text-white">INVOICE</h2>
                            </div>
                        </header>
                        <section class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                            <div class="space-y-2">
                                <div class="flex items-center"><span class="font-semibold text-gray-400 w-32">Order Number:</span><span class="ml-2 text-white">${orderNumber}</span></div>
                                <div class="flex items-center"><span class="font-semibold text-gray-400 w-32">Date:</span><span class="ml-2 text-white">${formattedDate}</span></div>
                            </div>
                            <div class="bg-gray-700/50 p-4 rounded-lg"><div class="flex items-center"><span class="font-semibold text-gray-400 w-20">Customer:</span><span class="ml-2 text-white">${customer}</span></div></div>
                        </section>
                        <section class="mb-12">
                            <table class="w-full text-left">
                                <thead>
                                    <tr class="border-b-2 border-gray-600">
                                        <th class="p-3 text-sm font-semibold uppercase text-gray-400">Item</th>
                                        <th class="p-3 text-center text-sm font-semibold uppercase text-gray-400">Quantity</th>
                                        <th class="p-3 text-right text-sm font-semibold uppercase text-gray-400">Unit Price</th>
                                        <th class="p-3 text-right text-sm font-semibold uppercase text-gray-400">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr class="border-b border-gray-700">
                                        <td class="p-3">${idType}</td>
                                        <td class="p-3 text-center">${quantity}</td>
                                        <td class="p-3 text-right">$${unitPrice.toFixed(2)}</td>
                                        <td class="p-3 text-right">$${subtotal.toFixed(2)}</td>
                                    </tr>
                                    <tr class="border-b border-gray-700">
                                        <td class="p-3">Processing & Handling</td>
                                        <td class="p-3 text-center"></td>
                                        <td class="p-3 text-right"></td>
                                        <td class="p-3 text-right">$${handlingFee.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>
                        <section class="mb-12 border-t border-gray-700 pt-8">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 class="font-semibold text-gray-400 mb-2 uppercase text-sm">Payment Method</h3>
                                    <div class="flex items-center space-x-3 bg-black/20 p-3 rounded-lg w-fit">
                                        <span class="text-white font-medium">${paymentMethod}</span>
                                    </div>
                                </div>
                                <div class="flex items-center justify-start md:justify-end md:pt-6">
                                    <div class="flex items-center space-x-3"><input type="checkbox" id="crypto-discount" class="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 rounded"><label for="crypto-discount" class="text-lg font-semibold text-white">Crypto Discount</label></div>
                                </div>
                            </div>
                        </section>
                        <section class="flex justify-between items-start">
                            <div class="flex items-center space-x-3"><input type="checkbox" id="paid-status" class="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 rounded"><label for="paid-status" class="text-lg font-semibold text-white">Paid?</label></div>
                            <div class="text-right"><div class="text-gray-400 mb-1">Total</div><div class="text-4xl font-bold text-white">$${total.toFixed(2)}</div></div>
                        </section>
                    </div>
                    <footer class="p-4 bg-gray-900/50 text-center no-print mt-8">
                        <button onclick="window.print()" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">Print Invoice</button>
                    </footer>
                </div>
            `;
            
            // --- 5. Display the invoice ---
            const invoiceDisplay = document.getElementById('invoice-display');
            invoiceDisplay.innerHTML = invoiceHTML;
            invoiceDisplay.style.display = 'block';

            // --- 6. Scroll to the new invoice ---
            invoiceDisplay.scrollIntoView({ behavior: 'smooth' });
        }
    </script>
</body>
</html>
