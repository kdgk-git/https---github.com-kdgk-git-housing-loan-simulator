document.getElementById("loan-form").addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the form from submitting

    // Get user inputs
    const loanAmount = parseFloat(document.getElementById("loan-amount").value.replace(/,/g, '')); // Remove commas before parsing
    const annualInterestRate = parseFloat(document.getElementById("interest-rate").value) / 100;
    const loanTerm = parseFloat(document.getElementById("loan-term").value);
    const repricingPeriod = parseFloat(document.getElementById("repricing-period").value);
    const startDate = new Date(document.getElementById("start-date").value); // Get the start date
    const monthlyLumpsum = parseFloat(document.getElementById("monthly-lumpsum").value.replace(/,/g, ''));
    const lumpsumFrequency = parseFloat(document.getElementById("lumpsum-frequency").value);
    // const lumpsumMonth = parseInt(document.getElementById("lumpsum-month").value);

    // Validate inputs
    if (isNaN(loanAmount) || isNaN(annualInterestRate) || isNaN(loanTerm) || loanAmount <= 0 || annualInterestRate <= 0 || loanTerm <= 0 || isNaN(startDate)) {
        alert("Please fill in all fields with valid values.");
        return;
    }

    // Monthly interest rate
    const monthlyInterestRate = annualInterestRate / 12;

    // Total number of payments (months)
    const numberOfPayments = loanTerm * 12;

    // Calculate base monthly amortization using the loan formula
    const numerator = monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments);
    const denominator = Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1;
    const monthlyBaseAmortization = loanAmount * (numerator / denominator);

    // Calculate mortgage redemption insurance
    const mri = ((loanAmount / 1000) * 0.23) / 12;

    // Calculate fire insurance
    const fireInsurance = (loanAmount * 0.001686) / 12;

    // Calculate total monthly amortization
    const totalMonthlyAmortization = monthlyBaseAmortization + mri + fireInsurance;

    // Calculate target lumpsum
    const targetLumpsum = monthlyLumpsum * lumpsumFrequency;

    // Format numbers with commas and decimals
    const formattedLoanAmount = new Intl.NumberFormat('en-US').format(loanAmount.toFixed(2));
    const formattedMonthlyBaseAmortization = new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(monthlyBaseAmortization);
    const formattedMRI = new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(mri);
    const formattedFireInsurance = new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(fireInsurance);
    const formattedTotalMonthlyAmortization = new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalMonthlyAmortization);
    const formattedTargetLumpsum = new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(targetLumpsum);

    // Display the formatted result
    document.getElementById("monthlyBaseAmortization").textContent = formattedMonthlyBaseAmortization;
    document.getElementById("mri").textContent = formattedMRI;
    document.getElementById("fireInsurance").textContent = formattedFireInsurance;
    document.getElementById("totalMonthlyAmortization").textContent = formattedTotalMonthlyAmortization;
    document.getElementById("targetLumpsum").textContent = formattedTargetLumpsum;

    // Add the payment schedule to the table
    const paymentTableBody = document.getElementById("payment-table-body");
    paymentTableBody.innerHTML = ""; // Clear any previous table rows

    let remainingBalance = loanAmount;
    let finalPaymentDate = null;
    let repricingStartMonth = 0;
    let currentAnnualRate = annualInterestRate;
    let currentMonthlyInterestRate = monthlyInterestRate;
    let currentMonthlyBaseAmortization = monthlyBaseAmortization;
    let currentTotalMonthlyAmortization = totalMonthlyAmortization;

    // Logging to check the process
    console.log("Initial Loan Amount:", loanAmount);
    console.log("Initial Monthly Base Amortization:", monthlyBaseAmortization);
    console.log("Initial Monthly Interest Rate:", monthlyInterestRate);

    const formatter = new Intl.NumberFormat('en-PH', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    // Compute Total Paid from Start Date to Latest
    let totalAmortizationPaid = 0;
    let totalInsurancePremiumPaid = 0;
    let totalLumpSumPaid = 0;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;

    let i = 0;
    while (remainingBalance > 0.01) {

        // Payment Due (First row uses the start date, then add 1 month for each row)
        const paymentDue = new Date(startDate);
        if (i > 0) { // Start adding 1 month after the first row
            paymentDue.setMonth(startDate.getMonth() + i);
        }

        const paymentDueFormatted = paymentDue.toLocaleDateString('en-GB'); // Format as DD/MM/YYYY

        const monthsSinceStart = i;

        // Check if we're starting a new repricing period
        if ((monthsSinceStart - repricingStartMonth) >= (repricingPeriod * 12)) {
            repricingStartMonth = monthsSinceStart;

            // Update interest rate by 0.25% every repricing period
            currentAnnualRate += 0.0025;
            currentMonthlyInterestRate = currentAnnualRate / 12;

            console.log(`Repricing Triggered at Month: ${monthsSinceStart}`);
            console.log("New Annual Interest Rate:", currentAnnualRate * 100, "%");
            console.log("New Monthly Interest Rate:", currentMonthlyInterestRate);

            const remainingMonths = numberOfPayments - i;
            const newNumerator = currentMonthlyInterestRate * Math.pow(1 + currentMonthlyInterestRate, remainingMonths);
            const newDenominator = Math.pow(1 + currentMonthlyInterestRate, remainingMonths) - 1;
            currentMonthlyBaseAmortization = remainingBalance * (newNumerator / newDenominator);
            currentTotalMonthlyAmortization = currentMonthlyBaseAmortization + mri + fireInsurance;

            console.log("New Base Amortization after Repricing:", currentMonthlyBaseAmortization);
            console.log("New Total Monthly Payment:", currentTotalMonthlyAmortization);
        }

        // Now calculate interest using the current period's interest
        const interestPayment = remainingBalance * currentMonthlyInterestRate;

        // Calculate lump sum for this month
        let lumpsum = 0;
        if (lumpsumFrequency > 0 && i > 0 && i % lumpsumFrequency === 0) {
            lumpsum = Math.min(monthlyLumpsum * lumpsumFrequency, remainingBalance);
        }


        // Step 1: Calculate base principal (monthly amortization minus interest)
        let basePrincipal = currentMonthlyBaseAmortization - interestPayment;
        basePrincipal = Math.max(basePrincipal, 0); // Avoid negatives

        // Step 2: Determine how much total principal we can pay (base + lump sum)
        let maxPrincipalPayment = Math.min(remainingBalance, basePrincipal + lumpsum);

        // Step 3: Adjust the lump sum so that base + lumpsum = total principal
        let adjustedLumpSum = Math.max(0, maxPrincipalPayment - basePrincipal);

        // Step 4: Final total principal paid this month
        let principalPayment = basePrincipal + adjustedLumpSum;


        // Calculate Insurance Premium
        const insurancePremium = mri + fireInsurance;

        // Compute Total Paid from Start Date to Latest
        totalAmortizationPaid += currentMonthlyBaseAmortization;
        totalInsurancePremiumPaid += insurancePremium;
        totalLumpSumPaid += adjustedLumpSum;
        totalInterestPaid += interestPayment;
        totalPrincipalPaid += principalPayment;

        // Update the remaining balance
        remainingBalance -= principalPayment;

        // Save final payment date if balance hits zero
        if (remainingBalance <= 0 && !finalPaymentDate) {
            finalPaymentDate = new Date(paymentDue);
        }

        // Calculate Total Loan Cost
        const totalLoanCost = totalAmortizationPaid + totalInsurancePremiumPaid + totalLumpSumPaid;

        // Calculate Expected Total Cost (if no early payments were made)
        const expectedBaseCost = monthlyBaseAmortization * loanTerm * 12;

        // Calculate Interest Saved
        const interestSaved = expectedBaseCost - (totalPrincipalPaid + totalInterestPaid);

        document.getElementById("totalLoanCost").textContent = `${formatter.format(totalLoanCost)}`;
        document.getElementById("interestSaved").textContent = `${formatter.format(interestSaved)}`;

        // Create a new row
        const row = document.createElement("tr");

        row.innerHTML = `
        <td>${paymentDueFormatted}</td>
        <td>₱${formatter.format(currentMonthlyBaseAmortization)}</td>
        <td>₱${formatter.format(insurancePremium)}</td>
        <td>₱${formatter.format(adjustedLumpSum)}</td>
        <td>₱${formatter.format(interestPayment)}</td>
        <td>₱${formatter.format(principalPayment)}</td>
        <td>₱${formatter.format(Math.max(remainingBalance, 0))}</td>
    `;

        paymentTableBody.appendChild(row);

        if (remainingBalance <= 0) break;

        i++;
    }

    // Compute Total Paid from Start Date to Latest
    document.getElementById("totalAmortizationPaid").textContent = `${formatter.format(totalAmortizationPaid)}`;
    document.getElementById("totalInsurancePremiumPaid").textContent = `${formatter.format(totalInsurancePremiumPaid)}`;
    document.getElementById("totalLumpSumPaid").textContent = `${formatter.format(totalLumpSumPaid)}`;
    document.getElementById("totalInterestPaid").textContent = `${formatter.format(totalInterestPaid)}`;
    document.getElementById("totalPrincipalPaid").textContent = `${formatter.format(totalPrincipalPaid)}`;

    // Update the "Payable In" field
    if (finalPaymentDate) {
        const diffInMonths =
            (finalPaymentDate.getFullYear() - startDate.getFullYear()) * 12 +
            (finalPaymentDate.getMonth() - startDate.getMonth());

        const years = Math.floor(diffInMonths / 12);
        const months = diffInMonths % 12;

        let resultText = '';
        if (years > 0) resultText += `${years} year${years > 1 ? 's' : ''}`;
        if (years > 0 && months > 0) resultText += ' & ';
        if (months > 0) resultText += `${months} month${months > 1 ? 's' : ''}`;
        if (resultText === '') resultText = '0 months';

        const dateText = finalPaymentDate.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long'
        });

        document.getElementById("payableInResult").textContent = `${resultText} (until ${dateText})`;
    } else {
        document.getElementById("payableInResult").textContent = 'N/A';
    }
});

// Dynamic lump sum frequency label
document.getElementById("lumpsum-frequency").addEventListener("change", function () {
    const freqText = this.options[this.selectedIndex].text;
    document.getElementById("targetLumpSumLabel").textContent = `${freqText} Lump Sum:`;
});

// Set initial value on page load
window.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("lumpsum-frequency");
    const freqText = select.options[select.selectedIndex].text;
    document.getElementById("targetLumpSumLabel").textContent = `${freqText} Lump Sum:`;
});

// Dynamic interest saved label
document.getElementById("loan-term").addEventListener("change", function () {
    const interestSavedText = this.options[this.selectedIndex].text;
    document.getElementById("interestSavedLabel").textContent = `Interest Saved vs ${interestSavedText}:`;
});

// Set initial value on page load
window.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("loan-term");
    const interestSavedText = select.options[select.selectedIndex].text;
    document.getElementById("interestSavedLabel").textContent = `Interest Saved vs ${interestSavedText}:`;
});
