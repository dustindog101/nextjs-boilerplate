<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crypto Payment Gateway</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #111827; /* bg-gray-900 */
        }
        .payment-box-shadow {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
        }
        .status-pill, .coin-select-btn {
            transition: all 0.3s ease-in-out;
        }
        .coin-select-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }
        .loader {
            border-top-color: #3b82f6; /* blue-500 */
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .fade-in {
            animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body class="text-white flex items-center justify-center min-h-screen p-4 sm:p-6">

    <div class="w-full max-w-md mx-auto bg-gray-800 rounded-2xl payment-box-shadow overflow-hidden">

        <!-- View 1: Selection Screen -->
        <div id="selectionView" class="fade-in">
            <div class="p-6 md:p-8">
                <div class="text-center mb-8">
                    <h1 class="text-2xl sm:text-3xl font-bold text-white">Choose Payment Method</h1>
                    <p class="text-gray-400 text-sm mt-2">Select the crypto you want to pay with to see payment details.</p>
                </div>
                <div class="space-y-4">
                    <button onclick="chooseCoin('BTC')" class="coin-select-btn w-full flex items-center bg-gray-700/80 hover:bg-gray-700 p-4 rounded-lg">
                        <svg class="w-8 h-8 mr-4" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M21.928 25.132C21.356 25.708 20.72 26.22 20.02 26.668C18.244 27.824 16.12 28.34 13.996 28.202C10.156 27.956 6.944 25.62 5.86 22.012C4.776 18.404 5.92 14.332 8.98 11.9C10.516 10.684 12.348 9.94 14.236 9.79C16.124 9.64 18.012 10.06 19.644 11.052C20.46 11.548 21.212 12.164 21.84 12.88" stroke="#f7931a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M14.932 19.832V24.332" stroke="#f7931a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.432 17.582V26.582" stroke="#f7931a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.432 15.332C18.432 14.5626 17.8014 13.932 17.032 13.932H13.432C12.6626 13.932 12.032 14.5626 12.032 15.332V19.832C12.032 20.6014 12.6626 21.232 13.432 21.232H17.032C17.8014 21.232 18.432 20.6014 18.432 19.832V15.332Z" stroke="#f7931a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M14.932 13.932V11.582" stroke="#f7931a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M25.416 21.284C26.564 20.936 27.56 20.24 28.316 19.34C30.68 16.712 30.524 12.716 28.024 10.132C25.524 7.548 21.544 7.42 19.18 10.048" stroke="#f7931a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>
                        <span class="font-semibold text-lg">Bitcoin</span>
                        <span class="ml-auto text-gray-400 text-sm">BTC</span>
                    </button>
                    <button onclick="chooseCoin('LTC')" class="coin-select-btn w-full flex items-center bg-gray-700/80 hover:bg-gray-700 p-4 rounded-lg">
                         <svg class="w-8 h-8 mr-4" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><circle cx="16" cy="16" r="14" fill="#BEBEBE"></circle><path fill="#fff" d="M14.4 22.3V9.8h8.7v2.6h-5.9v2.8h5.3v2.6h-5.3v4.5z"></path></g></svg>
                        <span class="font-semibold text-lg">Litecoin</span>
                        <span class="ml-auto text-gray-400 text-sm">LTC</span>
                    </button>
                    <button onclick="chooseCoin('USDT')" class="coin-select-btn w-full flex items-center bg-gray-700/80 hover:bg-gray-700 p-4 rounded-lg">
                        <svg class="w-8 h-8 mr-4" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><circle cx="16" cy="16" r="14" fill="#26A17B"></circle><path fill="#fff" d="M16.3 9.3h8v3h-3.2v10.1h-2.1V12.3H16v-3h.3zM7.7 9.3h8v3h-3.2v10.1H10.4V12.3H7.7v-3z"></path></g></svg>
                        <span class="font-semibold text-lg">USDT <span class="text-sm text-gray-400">(TRC20)</span></span>
                        <span class="ml-auto text-gray-400 text-sm">USDT</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- View 2: Payment Screen -->
        <div id="paymentView" class="hidden">
            <div class="p-6 md:p-8">
                <button onclick="goBack()" class="flex items-center text-sm text-blue-400 hover:text-blue-300 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                    Change Crypto
                </button>
                <div class="text-center mb-6">
                    <h1 id="paymentHeader" class="text-2xl font-bold text-white">Complete Your Payment</h1>
                </div>

                <div class="bg-gray-700/50 rounded-lg p-4 mb-6">
                    <div class="flex justify-between items-center text-sm mb-2">
                        <span class="text-gray-400">Order Number:</span>
                        <span id="orderNumber" class="font-mono text-gray-200">ORD-20240729-A4B1</span>
                    </div>
                    <div class="flex justify-between items-center text-sm mb-2">
                        <span class="text-gray-400">Amount Due:</span>
                        <span class="font-semibold text-lg text-white">$150.00 USD</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-400">Created Date:</span>
                        <span id="createdDate" class="font-mono text-gray-200"></span>
                    </div>
                </div>

                <div class="flex justify-between items-center mb-6">
                    <span class="text-gray-400 text-sm">Payment Status:</span>
                    <div id="paymentStatus" class="status-pill flex items-center bg-yellow-500/20 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full">
                        <span class="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
                        <span id="statusText">Waiting for Payment</span>
                    </div>
                </div>
                
                <div id="paymentDetails" class="text-center">
                    <div id="loader" class="flex justify-center items-center h-48">
                        <div class="loader ease-linear rounded-full border-4 border-t-4 border-gray-600 h-12 w-12"></div>
                    </div>
                    <div id="qrCodeContainer" class="hidden">
                        <p class="text-sm text-gray-400 mb-2">Send <strong id="paymentAmount" class="text-white"></strong> to the address below</p>
                        <canvas id="qrCodeCanvas" class="mx-auto rounded-lg bg-white p-2"></canvas>
                        <div class="relative mt-4">
                            <input id="paymentAddress" type="text" class="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-4 pr-12 text-sm text-center font-mono" readonly>
                            <button onclick="copyToClipboard()" class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white transition">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </button>
                        </div>
                        <div id="copy-feedback" class="text-green-400 text-xs mt-2 h-4"></div>
                    </div>
                </div>

                <div class="text-center text-xs text-gray-500 mt-6">
                    <p>This payment link will expire in <strong id="timer" class="text-gray-400">--:--</strong></p>
                </div>
            </div>
        </div>
        
        <div class="bg-gray-900/50 px-6 py-4 text-center text-xs border-t border-gray-700/50">
            <p class="text-gray-500 mb-2">Powered by a secure swap service. <a href="#" class="text-blue-400 hover:underline">Learn more</a>.</p>
            <p class="text-gray-500">New to crypto? <a href="#" class="text-blue-400 hover:underline">Learn how to get some</a>.</p>
        </div>
    </div>

    <script>
        // --- CONFIGURATION ---
        const YOUR_USDT_WALLET = "TYourPersonalUSDTWalletAddressHere";
        const ORDER_AMOUNT_USD = 150.00;
        const API_BASE_URL = "https://api.trocador.app/v2";

        // --- STATE ---
        let selectedCoin = null;
        let currentTrade = null;
        let statusInterval = null;
        let countdownInterval = null;

        // --- UI ELEMENTS ---
        const ui = {
            selectionView: document.getElementById('selectionView'),
            paymentView: document.getElementById('paymentView'),
            paymentHeader: document.getElementById('paymentHeader'),
            loader: document.getElementById('loader'),
            qrCodeContainer: document.getElementById('qrCodeContainer'),
            qrCodeCanvas: document.getElementById('qrCodeCanvas'),
            paymentAddress: document.getElementById('paymentAddress'),
            paymentAmount: document.getElementById('paymentAmount'),
            copyFeedback: document.getElementById('copy-feedback'),
            timer: document.getElementById('timer'),
            paymentStatus: document.getElementById('paymentStatus'),
            statusText: document.getElementById('statusText'),
            createdDate: document.getElementById('createdDate'),
        };

        // --- MOCK API DATA ---
        const mockApiData = {
            BTC: { id: "trade_btc_123", address_in: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", amount_in: "0.00250000" },
            LTC: { id: "trade_ltc_456", address_in: "ltc1q3h2n67zgs6rdta8w40p9wz8t8w8w8w8w8w8w8w", amount_in: "1.50000000" },
            USDT: { id: "trade_usdt_789", address_in: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", amount_in: "150.000000" }
        };

        // --- FUNCTIONS ---

        function chooseCoin(coin) {
            selectedCoin = coin;
            ui.selectionView.classList.add('hidden');
            ui.paymentView.classList.remove('hidden');
            ui.paymentView.classList.add('fade-in');
            
            const coinName = { BTC: 'Bitcoin', LTC: 'Litecoin', USDT: 'USDT' }[coin];
            ui.paymentHeader.textContent = `Pay with ${coinName}`;

            createTrade(coin);
        }

        function goBack() {
            ui.paymentView.classList.add('hidden');
            ui.selectionView.classList.remove('hidden');
            ui.selectionView.classList.add('fade-in');
            
            // Clean up intervals and state
            clearInterval(statusInterval);
            clearInterval(countdownInterval);
            currentTrade = null;
            selectedCoin = null;
            ui.timer.textContent = "--:--";
        }

        async function createTrade(coin) {
            showLoader();
            await new Promise(resolve => setTimeout(resolve, 1000));
            currentTrade = mockApiData[coin];
            
            if (currentTrade) {
                updatePaymentUI(currentTrade);
                startStatusChecker(currentTrade.id);
                startTimer(15 * 60);
            } else {
                console.error("Could not create trade for", coin);
                goBack();
                alert("Error creating payment. Please try again.");
            }
        }
        
        async function checkTradeStatus(tradeId) {
            const currentStatusText = ui.statusText.textContent;
            let nextStatus = currentStatusText;

            if (currentStatusText === 'Waiting for Payment' && Math.random() < 0.2) {
                nextStatus = 'Confirming...';
            } else if (currentStatusText === 'Confirming...' && Math.random() < 0.5) {
                nextStatus = 'Paid';
            }
            
            if (nextStatus !== currentStatusText) {
                updateStatus(nextStatus);
            }
        }

        function updateStatus(apiStatus) {
            const statusPill = ui.paymentStatus;
            const statusTextEl = ui.statusText;
            const pulseEl = statusPill.querySelector('span:first-child');

            statusPill.className = 'status-pill flex items-center text-xs font-semibold px-3 py-1 rounded-full';
            pulseEl.className = 'w-2 h-2 rounded-full mr-2';

            switch (apiStatus) {
                case 'Confirming...':
                    statusPill.classList.add('bg-blue-500/20', 'text-blue-400');
                    pulseEl.classList.add('bg-blue-400', 'animate-pulse');
                    statusTextEl.textContent = 'Confirming...';
                    break;
                case 'Paid':
                    statusPill.classList.add('bg-green-500/20', 'text-green-400');
                    pulseEl.classList.add('bg-green-400');
                    pulseEl.classList.remove('animate-pulse');
                    statusTextEl.textContent = 'Paid';
                    clearInterval(statusInterval);
                    clearInterval(countdownInterval);
                    ui.timer.textContent = "00:00";
                    break;
                case 'Expired':
                    statusPill.classList.add('bg-red-500/20', 'text-red-400');
                    pulseEl.classList.add('bg-red-400');
                    pulseEl.classList.remove('animate-pulse');
                    statusTextEl.textContent = 'Expired';
                    clearInterval(statusInterval);
                    clearInterval(countdownInterval);
                    break;
                default:
                    statusPill.classList.add('bg-yellow-500/20', 'text-yellow-400');
                    pulseEl.classList.add('bg-yellow-400', 'animate-pulse');
                    statusTextEl.textContent = 'Waiting for Payment';
                    break;
            }
        }

        function showLoader() {
            ui.loader.classList.remove('hidden');
            ui.qrCodeContainer.classList.add('hidden');
            clearInterval(statusInterval);
            clearInterval(countdownInterval);
            ui.timer.textContent = "--:--";
            updateStatus('Waiting for Payment');
        }

        function updatePaymentUI(data) {
            ui.loader.classList.add('hidden');
            ui.qrCodeContainer.classList.remove('hidden');
            ui.qrCodeContainer.classList.add('fade-in');

            ui.paymentAddress.value = data.address_in;
            ui.paymentAmount.innerHTML = `${data.amount_in} ${selectedCoin}`;
            
            new QRious({
                element: ui.qrCodeCanvas,
                value: `${selectedCoin.toLowerCase()}:${data.address_in}?amount=${data.amount_in}`,
                size: 180,
                padding: 10,
                level: 'H'
            });
        }

        function startStatusChecker(tradeId) {
            clearInterval(statusInterval);
            statusInterval = setInterval(() => checkTradeStatus(tradeId), 10000);
        }

        function startTimer(duration) {
            clearInterval(countdownInterval);
            let timer = duration;
            countdownInterval = setInterval(() => {
                const minutes = Math.floor(timer / 60);
                const seconds = timer % 60;
                ui.timer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                if (--timer < 0) {
                    clearInterval(countdownInterval);
                    updateStatus('Expired');
                }
            }, 1000);
        }

        function copyToClipboard() {
            ui.paymentAddress.select();
            document.execCommand('copy');
            ui.copyFeedback.textContent = 'Copied!';
            setTimeout(() => { ui.copyFeedback.textContent = ''; }, 2000);
        }
        
        function setInitialDate() {
            const now = new Date();
            ui.createdDate.textContent = now.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
        }

        // --- INITIALIZATION ---
        window.onload = () => {
            setInitialDate();
        };

    </script>
</body>
</html>
