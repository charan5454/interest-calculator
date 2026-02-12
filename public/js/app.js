document.addEventListener('DOMContentLoaded', () => {
    // Initialize Animations
    AOS.init({
        duration: 1000,
        easing: 'ease-out-cubic',
        once: true
    });

    VanillaTilt.init(document.querySelectorAll(".glass-card"), {
        max: 5,
        speed: 400,
        glare: true,
        "max-glare": 0.2,
    });

    // Create Background Floating Elements
    createFloatingOrbs();

    function createFloatingOrbs() {
        const bg = document.querySelector('.bg-gradient-custom');
        const colors = ['rgba(14, 165, 233, 0.2)', 'rgba(99, 102, 241, 0.2)', 'rgba(139, 92, 246, 0.2)'];
        for (let i = 0; i < 4; i++) {
            const orb = document.createElement('div');
            orb.className = 'floating-orb';
            orb.style.width = Math.random() * 300 + 200 + 'px';
            orb.style.height = orb.style.width;
            orb.style.background = colors[i % colors.length];
            orb.style.top = Math.random() * 80 + '%';
            orb.style.left = Math.random() * 80 + '%';
            orb.style.animationDelay = (Math.random() * 10) + 's';
            orb.style.animationDuration = (Math.random() * 20 + 20) + 's';
            bg.appendChild(orb);
        }
    }

    // Modal Objects
    const form = document.getElementById('calcForm');
    const typeSelect = document.getElementById('type');
    const compoundingGroup = document.getElementById('compoundingGroup');
    const resetBtn = document.getElementById('resetBtn');

    // Results Elements
    const resultsContent = document.getElementById('resultsContent');
    const initialState = document.getElementById('initialState');
    const resInterest = document.getElementById('resInterest');
    const resTotal = document.getElementById('resTotal');
    const resEMI = document.getElementById('resEMI');
    const emiResultBox = document.getElementById('emiResultBox');

    // Auth Elements
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    const downloadPdf = document.getElementById('downloadPdf');
    const downloadBorrowerPdf = document.getElementById('downloadBorrowerPdf');
    const authForm = document.getElementById('authForm');
    const toggleAuth = document.getElementById('toggleAuth');
    const authTitle = document.getElementById('authTitle');
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');

    const navHistory = document.getElementById('nav-history');
    const navBorrowers = document.getElementById('nav-borrowers');
    const navStatusContainer = document.getElementById('nav-status-container');
    let currentStatusFilter = 'all';

    const bId = document.getElementById('bId');
    const bSubmitBtn = document.getElementById('bSubmitBtn');
    const bCancelBtn = document.getElementById('bCancelBtn');

    // Borrower Elements
    const borrowerModal = new bootstrap.Modal(document.getElementById('borrowerModal'));
    const addBorrowerForm = document.getElementById('addBorrowerForm');
    const borrowerTable = document.querySelector('#borrowerTable tbody');

    // Chart Instance
    let currentBorrower = null;
    let growthChart = null;
    let currentUser = null; // Store JWT or User Object if logged in
    let isLoginMode = true;

    downloadBorrowerPdf.addEventListener('click', () => {
        if (!currentBorrower) return;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const diff = getPreciseDateDiff(currentBorrower.given_at, new Date());
        let totalMonths = diff.totalDays / 30;
        let pAmount = parseFloat(currentBorrower.amount);
        let rVal = parseFloat(currentBorrower.rate);
        if (currentBorrower.rate_unit === 'year') {
            rVal = rVal / 12;
        }
        let interest = (pAmount * rVal * totalMonths) / 100;
        let total = pAmount + interest;

        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        const bDateStr = new Date(currentBorrower.given_at).toLocaleDateString(undefined, options);
        const todayStr = new Date().toLocaleDateString(undefined, options);

        doc.setFontSize(22);
        doc.setTextColor(40, 44, 52);
        doc.text("Kanamoni's Interest Calculator", 20, 20);

        doc.setFontSize(16);
        doc.text("Borrower Settlement Report", 20, 35);

        doc.setLineWidth(0.5);
        doc.line(20, 40, 190, 40);

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Borrower Name: ${currentBorrower.name}`, 20, 50);
        doc.text(`Village: ${currentBorrower.village || '-'}`, 20, 60);
        doc.text(`Age: ${currentBorrower.age || '-'}`, 20, 70);
        doc.text(`Date Range: ${bDateStr} to ${todayStr}`, 20, 80);
        doc.text(`Time Period: ${diff.years}y ${diff.months}m ${diff.days}d (${diff.totalDays} Days)`, 20, 90);

        doc.setFontSize(14);
        doc.text("Calculation Summary:", 20, 110);
        doc.setFontSize(12);
        doc.text(`Principal Amount: Rs. ${pAmount.toLocaleString()}`, 30, 120);
        doc.text(`Interest Rate: ${currentBorrower.rate} (${currentBorrower.rate_unit === 'month' ? 'Rs./Mo' : '%/Yr'})`, 30, 130);
        doc.text(`Total Interest: Rs. ${interest.toFixed(2)}`, 30, 140);

        doc.setFontSize(16);
        doc.setTextColor(0, 102, 204);
        doc.text(`Net Total: Rs. ${total.toFixed(2)}`, 20, 160);

        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Report generated on: ${new Date().toLocaleString()}`, 20, 280);

        doc.save(`${currentBorrower.name}_settlement.pdf`);
    });

    // --- Calculator Logic ---

    // Toggle Compounding Frequency visibility based on type
    typeSelect.addEventListener('change', () => {
        if (typeSelect.value === 'compound') {
            compoundingGroup.style.display = 'block';
        } else {
            compoundingGroup.style.display = 'none';
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        calculate();
    });

    resetBtn.addEventListener('click', () => {
        form.reset();
        typeSelect.dispatchEvent(new Event('change'));
        showResults(false);
    });

    async function calculate() {
        // Inputs
        const type = typeSelect.value;
        const P = document.getElementById('principal').value;
        const R = document.getElementById('rate').value;
        const T = document.getElementById('time').value;
        const timeUnit = document.getElementById('timeUnit').value;
        const frequency = document.getElementById('frequency').value;
        const currencyKey = document.getElementById('currency').value;
        const rateUnit = document.getElementById('rateUnit').value;

        try {
            const res = await fetch('/api/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, principal: P, rate: R, time: T, timeUnit, frequency, currency: currencyKey, rateUnit })
            });

            if (!res.ok) throw new Error('Calculation failed');

            const data = await res.json();
            const { interest, total, emi, labels, chartData } = data;

            // Display Results
            resInterest.textContent = `${currencyKey}${interest.toFixed(2)}`;
            resTotal.textContent = `${currencyKey}${total.toFixed(2)}`;

            // Add Pulse Animation
            [resInterest, resTotal].forEach(el => {
                el.classList.remove('pulse-animation');
                void el.offsetWidth; // Trigger reflow
                el.classList.add('pulse-animation');
            });

            if (type === 'emi') {
                emiResultBox.style.display = 'block';
                resEMI.textContent = `${currencyKey}${emi.toFixed(2)}`;
            } else {
                emiResultBox.style.display = 'none';
            }

            showResults(true);
            renderChart(labels, chartData, type);
            saveHistory(type, P, R, T, { total, interest, emi }); // Save if logged in

        } catch (err) {
            console.error(err);
            alert('Error performing calculation. Please try again.');
        }
    }

    function showResults(show) {
        if (show) {
            initialState.classList.add('d-none');
            resultsContent.classList.remove('d-none');
        } else {
            initialState.classList.remove('d-none');
            resultsContent.classList.add('d-none');
        }
    }

    function renderChart(labels, data, type) {
        const ctx = document.getElementById('growthChart').getContext('2d');

        if (growthChart) {
            growthChart.destroy();
        }

        growthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: type === 'emi' ? 'Loan Balance' : 'Investment Value',
                    data: data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: 'white' } }
                },
                scales: {
                    x: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    y: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                }
            }
        });
    }

    // --- PDF Download ---
    document.getElementById('downloadPdf').addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text("Interest Calculation Report", 20, 20);

        doc.setFontSize(12);
        doc.text(`Type: ${typeSelect.options[typeSelect.selectedIndex].text}`, 20, 40);
        doc.text(`Principal: ${document.getElementById('principal').value}`, 20, 50);
        const rateUnit = document.getElementById('rateUnit').value;
        const rateLabel = rateUnit === 'month' ? 'Rupees / Month' : '% / Yr';
        doc.text(`Rate: ${document.getElementById('rate').value} (${rateLabel})`, 20, 60);
        doc.text(`Time: ${document.getElementById('time').value} ${document.getElementById('timeUnit').value}`, 20, 70);

        doc.text("------------------------------------------------", 20, 80);
        doc.text(`Total Interest: ${resInterest.textContent}`, 20, 90);
        doc.text(`Total Amount: ${resTotal.textContent}`, 20, 100);
        if (typeSelect.value === 'emi') {
            doc.text(`Monthly EMI: ${resEMI.textContent}`, 20, 110);
        }

        doc.save("calculation-report.pdf");
    });

    // --- Auth & API (Mock / Real) ---

    // Check if user is already logged in (check localStorage)
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
        currentUser = true;
        updateAuthUI();
    }

    toggleAuth.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        authTitle.textContent = isLoginMode ? 'Login' : 'Register';
        authForm.querySelector('button').textContent = isLoginMode ? 'Login' : 'Register';
        toggleAuth.textContent = isLoginMode ? "Don't have an account? Register" : "Already have an account? Login";
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('authUsername').value;
        const password = document.getElementById('authPassword').value;
        const endpoint = isLoginMode ? '/api/login' : '/api/register';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok) {
                if (isLoginMode) {
                    localStorage.setItem('token', data.token);
                    currentUser = true;
                    updateAuthUI();
                    loginModal.hide();
                } else {
                    alert('Registration successful! Please login.');
                    // Switch to login
                    toggleAuth.click();
                }
            } else {
                alert(data.error || 'Authentication failed');
            }
        } catch (err) {
            console.error(err);
            alert('Server error. Ensure backend is running.');
        }
    });

    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('token');
        currentUser = null;
        updateAuthUI();
    });

    function updateAuthUI() {
        if (currentUser) {
            btnLogin.style.display = 'none';
            btnLogout.style.display = 'block';
            if (navHistory) navHistory.style.display = 'block';
            navBorrowers.style.display = 'block';
            if (navStatusContainer) navStatusContainer.style.display = 'block';
        } else {
            btnLogin.style.display = 'block';
            btnLogout.style.display = 'none';
            if (navHistory) navHistory.style.display = 'none';
            navBorrowers.style.display = 'none';
            if (navStatusContainer) navStatusContainer.style.display = 'none';
        }
    }

    async function saveHistory(type, principal, rate, time, result) {
        if (!currentUser) return;

        try {
            await fetch('/api/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ type, principal, rate, time, result })
            });
        } catch (err) {
            console.error('Failed to save history', err);
        }
    }

    // Fetch History
    if (navHistory) {
        navHistory.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!currentUser) return;

            const historyModal = new bootstrap.Modal(document.getElementById('historyModal'));
            historyModal.show();

            const tbody = document.querySelector('#historyTable tbody');
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';

            try {
                const res = await fetch('/api/history', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await res.json();

                tbody.innerHTML = '';
                if (data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" class="text-center">No history found</td></tr>';
                    return;
                }

                data.forEach(item => {
                    const row = `<tr>
                    <td>${new Date(item.created_at).toLocaleDateString()}</td>
                    <td>${item.type}</td>
                    <td>${item.principal}</td>
                    <td>${JSON.parse(item.result).total.toFixed(2)}</td>
                </tr>`;
                    tbody.innerHTML += row;
                });

            } catch (err) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Failed to load history</td></tr>';
            }
        });
    }

    // --- Borrower Logic ---

    navBorrowers.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        if (!currentUser) return;

        borrowerModal.show();
        loadBorrowers();
    });

    bCancelBtn.addEventListener('click', () => {
        cancelEdit();
    });

    function cancelEdit() {
        addBorrowerForm.reset();
        bId.value = '';
        bSubmitBtn.textContent = 'Add';
        bCancelBtn.classList.add('d-none');
        document.querySelector('#borrowerModal h6').innerHTML = '<i class="fas fa-user-plus me-2"></i>Add New Borrower';
    }

    window.editBorrower = (id, name, village, age, amount, rate, rateUnit, givenAt) => {
        bId.value = id;
        document.getElementById('bName').value = name;
        document.getElementById('bVillage').value = (village !== 'undefined' && village !== 'null') ? village : '';
        document.getElementById('bAge').value = (age !== 'undefined' && age !== 'null') ? age : '';
        document.getElementById('bAmount').value = amount;
        document.getElementById('bRate').value = rate;
        document.getElementById('bRateUnit').value = rateUnit;

        const date = new Date(givenAt);
        const formattedDate = date.toISOString().split('T')[0];
        document.getElementById('bDate').value = formattedDate;

        bSubmitBtn.textContent = 'Update';
        bCancelBtn.classList.remove('d-none');
        document.querySelector('#borrowerModal h6').innerHTML = '<i class="fas fa-edit me-2"></i>Edit Borrower';
    };

    addBorrowerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addBorrowerForm);
        const id = bId.value;
        const url = id ? `/api/borrowers/${id}` : '/api/borrowers';
        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: formData
            });
            if (res.ok) {
                alert(id ? 'Borrower updated!' : 'Borrower added!');
                cancelEdit();
                loadBorrowers();
            } else {
                const data = await res.json();
                alert(data.error || 'Operation failed');
            }
        } catch (err) {
            console.error(err);
        }
    });

    function getPreciseDateDiff(startDate, endDate) {
        let start = new Date(startDate);
        let end = new Date(endDate);

        // 30/360 Day Count Convention (Standard for Local Finance/Vaddi)
        // Treats every month as 30 days.
        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();
        let days = end.getDate() - start.getDate();

        // Calculate total days using the convention
        const totalDays = (years * 360) + (months * 30) + days;

        // For display purposes (Years, Months, Days)
        let displayYears = years;
        let displayMonths = months;
        let displayDays = days;

        if (displayDays < 0) {
            displayMonths -= 1;
            displayDays += 30; // Standard 30 days
        }
        if (displayMonths < 0) {
            displayYears -= 1;
            displayMonths += 12;
        }

        return { years: displayYears, months: displayMonths, days: displayDays, totalDays };
    }

    // Status Filtering Logic
    document.querySelectorAll('.status-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            currentStatusFilter = e.target.getAttribute('data-status');
            loadBorrowers();
        });
    });

    window.toggleBorrowerStatus = async (id, isRepaid) => {
        try {
            const res = await fetch(`/api/borrowers/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ isRepaid })
            });
            if (res.ok) {
                loadBorrowers();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update status');
            }
        } catch (err) {
            console.error(err);
        }
    };

    async function loadBorrowers() {
        borrowerTable.innerHTML = '<tr><td colspan="8" class="text-center">Loading...</td></tr>';
        try {
            const res = await fetch('/api/borrowers', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('token');
                currentUser = null;
                updateAuthUI();
                borrowerTable.innerHTML = '<tr><td colspan="7" class="text-center text-warning">Session expired. Please login again.</td></tr>';
                return;
            }

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Server error');
            }

            const data = await res.json();
            borrowerTable.innerHTML = '';
            if (data.length === 0) {
                borrowerTable.innerHTML = '<tr><td colspan="8" class="text-center">No borrowers found</td></tr>';
                return;
            }

            if (data.error) throw new Error(data.error);

            // Apply filtering
            const filteredData = data.filter(b => {
                if (currentStatusFilter === 'all') return true;
                if (currentStatusFilter === 'repaid') return b.is_repaid === true;
                if (currentStatusFilter === 'unpaid') return b.is_repaid === false;
                return true;
            });

            if (filteredData.length === 0) {
                borrowerTable.innerHTML = '<tr><td colspan="8" class="text-center">No borrowers match this filter</td></tr>';
                return;
            }

            filteredData.forEach(b => {
                // Use a more verbose date to avoid confusion
                const dateObj = new Date(b.given_at);
                const options = { year: 'numeric', month: 'short', day: 'numeric' };
                const displayDate = dateObj.toLocaleDateString(undefined, options);

                const row = document.createElement('tr');
                row.style.cursor = 'pointer';
                row.innerHTML = `
                    <td>${b.name}</td>
                    <td>${b.village || '-'}</td>
                    <td>${b.age || '-'}</td>
                    <td>₹${parseFloat(b.amount).toLocaleString()}</td>
                    <td>${b.rate} (${b.rate_unit === 'month' ? '₹/Mo' : '%/Yr'})</td>
                    <td>${displayDate}</td>
                    <td class="text-center d-flex gap-2 justify-content-center">
                        <button class="btn btn-sm btn-info calc-btn" title="Calculate"><i class="fas fa-calculator"></i></button>
                        <button class="btn btn-sm btn-warning edit-btn" title="Edit" onclick="event.stopPropagation(); editBorrower('${b.id}', '${(b.name || '').replace(/'/g, "\\'")}', '${(b.village || '').replace(/'/g, "\\'")}', '${b.age || ''}', '${b.amount}', '${b.rate}', '${b.rate_unit}', '${b.given_at}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                    <td>
                        <select class="form-select form-select-sm bg-dark-input text-white border-0" 
                                onclick="event.stopPropagation();" 
                                onchange="toggleBorrowerStatus('${b.id}', this.value === 'yes')">
                            <option value="no" ${!b.is_repaid ? 'selected' : ''}>NO</option>
                            <option value="yes" ${b.is_repaid ? 'selected' : ''}>YES</option>
                        </select>
                    </td>
                `;
                row.addEventListener('click', () => populateCalculator(b));
                borrowerTable.appendChild(row);
            });

        } catch (err) {
            console.error('Load Borrowers Error:', err);
            borrowerTable.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Failed to load: ${err.message}</td></tr>`;
        }
    }

    function populateCalculator(borrower) {
        currentBorrower = borrower;
        const resArea = document.getElementById('borrowerCalcResult');
        const bResTime = document.getElementById('bResTime');
        const bResPrincipal = document.getElementById('bResPrincipal');
        const bResInterest = document.getElementById('bResInterest');
        const bResTotal = document.getElementById('bResTotal');
        const bEvidencePreview = document.getElementById('bEvidencePreview');
        const bEvidenceImg = document.getElementById('bEvidenceImg');

        // Results Area
        resArea.classList.remove('d-none');

        // Handle Evidence Display
        if (borrower.evidence_path) {
            bEvidencePreview.classList.remove('d-none');
            bEvidenceImg.src = '/' + borrower.evidence_path;
            bEvidenceImg.onclick = () => window.open('/' + borrower.evidence_path, '_blank');
        } else {
            bEvidencePreview.classList.add('d-none');
        }

        // Fill Main Form (Optional but helpful)
        document.getElementById('principal').value = borrower.amount;
        document.getElementById('rate').value = borrower.rate;
        document.getElementById('rateUnit').value = borrower.rate_unit;
        document.getElementById('currency').value = '₹';

        // Result Label
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        const bDateStr = new Date(borrower.given_at).toLocaleDateString(undefined, options);
        const todayStr = new Date().toLocaleDateString(undefined, options);

        document.querySelector('#borrowerCalcResult h5').innerHTML =
            `<i class="fas fa-file-invoice-dollar me-2"></i>Settlement for ${borrower.name} <br>
             <span style="font-size: 0.8rem; opacity: 0.8;">(${bDateStr} to ${todayStr})</span>`;

        // Calculate Precise Time Difference
        const diff = getPreciseDateDiff(borrower.given_at, new Date());
        let timeStr = "";
        if (diff.years > 0) timeStr += `${diff.years}y `;
        if (diff.months > 0) timeStr += `${diff.months}m `;
        timeStr += `${diff.days}d (${diff.totalDays} days)`;
        bResTime.textContent = timeStr;

        // Interest Calculation Logic
        // Local standard: Interest = (Principal * Rate * totalMonths) / 100
        // We use totalDays / 30 for the most consistent "monthly" calculation
        let P = parseFloat(borrower.amount);
        let R = parseFloat(borrower.rate);
        let totalMonths = diff.totalDays / 30;

        // If rate is per year, convert to monthly for the formula
        if (borrower.rate_unit === 'year') {
            R = R / 12;
        }

        let interest = (P * R * totalMonths) / 100;
        let total = P + interest;

        // Update UI
        bResPrincipal.textContent = `₹${P.toLocaleString()}`;
        bResInterest.textContent = `₹${interest.toFixed(2)}`;
        bResTotal.textContent = `₹${total.toFixed(2)}`;

        // Also update the main calculator inputs just in case they want to play with it
        document.getElementById('time').value = totalMonths.toFixed(2);
        document.getElementById('timeUnit').value = 'months';
        typeSelect.value = 'simple';
        typeSelect.dispatchEvent(new Event('change'));

        // Scroll to the result
        resArea.scrollIntoView({ behavior: 'smooth' });
    }

});
