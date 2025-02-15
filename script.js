let growthChart = null;

function calculateCompoundInterest(principal, rate, time) {
    const amount = principal * Math.pow(1 + rate / 100, time);
    return amount;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
    }).format(amount);
}

function calculateCompoundInterestWithContributions(principal, rate, time, contribution, isMonthly) {
    let amount = principal;
    const monthlyRate = rate / 100 / 12;
    const annualRate = rate / 100;
    
    if (isMonthly) {
        // Calculate monthly contributions compound interest
        for (let i = 0; i < time * 12; i++) {
            amount = amount * (1 + monthlyRate) + contribution;
        }
    } else {
        // Calculate annual contributions compound interest
        for (let i = 0; i < time; i++) {
            amount = amount * (1 + annualRate) + contribution;
        }
    }
    
    return amount;
}

function calculateMonthlyData(principal, rate, years, contribution, isMonthly) {
    const monthlyRate = rate / 100 / 12;
    const totalMonths = years * 12;
    const data = [];
    let amount = principal;
    let totalContributions = principal; // Start with initial investment

    for (let month = 0; month <= totalMonths; month++) {
        data.push({
            month,
            amount: amount,
            contributions: totalContributions,
            interest: amount - totalContributions,
            label: `Month ${month}`
        });
        amount = amount * (1 + monthlyRate);
        if (contribution > 0) {
            amount += isMonthly ? contribution : (month % 12 === 0 ? contribution : 0);
            totalContributions += isMonthly ? contribution : (month % 12 === 0 ? contribution : 0);
        }
    }
    return data;
}

function updateChart(principal, rate, contribution, isMonthly) {
    const ctx = document.getElementById('growthChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (growthChart) {
        growthChart.destroy();
    }

    const years = 10; // Using the maximum time period
    const monthlyData = calculateMonthlyData(principal, rate, years, contribution, isMonthly);
    const yearlyData = monthlyData.filter(d => d.month % 12 === 0);

    growthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: years + 1}, (_, i) => `Year ${i}`),
            datasets: [{
                label: 'Total Amount',
                data: yearlyData.map(d => d.amount),
                borderColor: 'rgb(0, 164, 233)',
                backgroundColor: 'rgba(0, 164, 233, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Principal + Contributions',
                data: yearlyData.map(d => d.contributions),
                borderColor: 'rgb(45, 55, 72)',
                backgroundColor: 'rgba(45, 55, 72, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const dataPoint = yearlyData[context.dataIndex];
                            if (context.dataset.label === 'Total Amount') {
                                return [
                                    `Total: ${formatCurrency(dataPoint.amount)}`,
                                    `Interest: ${formatCurrency(dataPoint.interest)}`
                                ];
                            }
                            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: true,
                        drawBorder: true,
                    },
                    ticks: {
                        autoSkip: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function calculateInterest() {
    const principal = parseFloat(document.getElementById('principal').value);
    const rate = parseFloat(document.getElementById('rate').value);
    const contribution = parseFloat(document.getElementById('contribution').value) || 0;
    const isMonthly = document.getElementById('contributionFrequency').value === 'monthly';
    
    // Check for valid inputs
    if (isNaN(principal) || isNaN(rate)) {
        alert('Please enter valid numbers for principal and rate');
        return;
    }

    const timePeriods = [3, 5, 10];
    const resultsBody = document.getElementById('resultsBody');
    resultsBody.innerHTML = '';

    timePeriods.forEach(years => {
        const finalAmount = calculateCompoundInterestWithContributions(principal, rate, years, contribution, isMonthly);
        const totalContributions = contribution * (isMonthly ? years * 12 : years);
        const interestEarned = finalAmount - principal - totalContributions;

        const row = `
            <tr>
                <td>${years} years</td>
                <td>${formatCurrency(finalAmount)}</td>
                <td>${formatCurrency(interestEarned)}</td>
            </tr>
        `;
        resultsBody.innerHTML += row;
    });

    // Update the chart
    updateChart(principal, rate, contribution, isMonthly);
}

function calculateDelayedScenario() {
    const principal = parseFloat(document.getElementById('principal').value);
    const rate = parseFloat(document.getElementById('rate').value);
    const delayMonths = parseInt(document.getElementById('delayMonths').value);
    const contribution = parseFloat(document.getElementById('contribution').value) || 0;
    const isMonthly = document.getElementById('contributionFrequency').value === 'monthly';
    
    if (isNaN(principal) || isNaN(rate) || isNaN(delayMonths)) {
        alert('Please enter valid numbers');
        return;
    }

    const delayYears = delayMonths / 12;
    const timePeriods = [3, 5, 10];
    const comparisonBody = document.getElementById('comparisonBody');
    comparisonBody.innerHTML = '';

    timePeriods.forEach(years => {
        const immediateAmount = calculateCompoundInterestWithContributions(principal, rate, years, contribution, isMonthly);
        const delayedAmount = calculateCompoundInterestWithContributions(principal, rate, years - delayYears, contribution, isMonthly);
        
        const row = `
            <tr>
                <td>${years} years</td>
                <td>${formatCurrency(immediateAmount)}</td>
                <td>${formatCurrency(delayedAmount)}</td>
            </tr>
        `;
        comparisonBody.innerHTML += row;
    });

    // Calculate the total lost interest
    const finalYear = Math.max(...timePeriods);
    const lostAmount = calculateCompoundInterestWithContributions(principal, rate, finalYear, contribution, isMonthly) - 
                      calculateCompoundInterestWithContributions(principal, rate, finalYear - delayYears, contribution, isMonthly);

    const lostInterestDiv = document.getElementById('lostInterest');
    lostInterestDiv.innerHTML = `
        By waiting ${delayMonths} months to start saving, you could miss out on 
        <strong>${formatCurrency(Math.abs(lostAmount))}</strong> after ${finalYear} years
    `;

    // Show the results section
    document.getElementById('delayedResults').style.display = 'block';
}

function calculateTargetScenario(principal, rate, targetAmount, currentContribution, isMonthly) {
    if (!targetAmount || targetAmount <= principal) return null;

    const monthlyRate = rate / 100 / 12;
    const annualRate = rate / 100;
    
    // Calculate time to reach target with current contributions
    let timeToTarget = null;
    let requiredMonthlyContribution = null;
    let amount = principal;
    let months = 0;
    const maxMonths = 600; // 50 years maximum

    // First calculate time to reach target with current contributions
    if (currentContribution > 0) {
        while (amount < targetAmount && months < maxMonths) {
            amount = amount * (1 + monthlyRate);
            if (isMonthly) {
                amount += currentContribution;
            } else if (months % 12 === 0) {
                amount += currentContribution;
            }
            months++;
        }
        if (months < maxMonths) {
            timeToTarget = months;
        }
    }

    // Calculate required monthly contribution to reach target in 10 years
    amount = principal;
    const targetMonths = 120; // 10 years
    const pmt = PMT(monthlyRate, targetMonths, -principal, targetAmount);
    if (pmt > 0) {
        requiredMonthlyContribution = pmt;
    }

    return {
        timeToTarget,
        requiredMonthlyContribution,
        targetAmount
    };
}

// Helper function to calculate monthly payment needed
function PMT(rate, nper, pv, fv) {
    return ((-pv * Math.pow(1 + rate, nper)) - fv) / 
           ((Math.pow(1 + rate, nper) - 1) / rate);
}

function updateTargetResults(targetData) {
    const targetResults = document.getElementById('targetResults');
    const targetInfo = targetResults.querySelector('.target-info');
    
    if (!targetData) {
        targetResults.style.display = 'none';
        return;
    }

    let html = '';
    if (targetData.timeToTarget) {
        const years = Math.floor(targetData.timeToTarget / 12);
        const months = targetData.timeToTarget % 12;
        html += `<p>With your current contributions, you'll reach your target of ${formatCurrency(targetData.targetAmount)} in `;
        if (years > 0) html += `${years} years `;
        if (months > 0) html += `${months} months`;
        html += `.</p>`;
    } else {
        html += `<p>With your current contributions, you won't reach your target of ${formatCurrency(targetData.targetAmount)}.</p>`;
    }

    if (targetData.requiredMonthlyContribution) {
        html += `<p>To reach your target in 10 years, you would need to contribute ${formatCurrency(targetData.requiredMonthlyContribution)} monthly.</p>`;
    }

    targetInfo.innerHTML = html;
    targetResults.style.display = 'block';
}

function calculateAll() {
    calculateInterest();
    
    // Calculate target scenario
    const principal = parseFloat(document.getElementById('principal').value);
    const rate = parseFloat(document.getElementById('rate').value);
    const targetAmount = parseFloat(document.getElementById('targetAmount').value);
    const contribution = parseFloat(document.getElementById('contribution').value) || 0;
    const isMonthly = document.getElementById('contributionFrequency').value === 'monthly';

    if (targetAmount && !isNaN(targetAmount)) {
        const targetData = calculateTargetScenario(principal, rate, targetAmount, contribution, isMonthly);
        updateTargetResults(targetData);
    } else {
        document.getElementById('targetResults').style.display = 'none';
    }
    
    // Calculate delay scenario if months value is entered
    const delayMonths = document.getElementById('delayMonths').value;
    if (delayMonths && delayMonths > 0) {
        calculateDelayedScenario();
        document.getElementById('delayedResults').style.display = 'block';
    } else {
        document.getElementById('delayedResults').style.display = 'none';
    }
}

// Update the initial calculation to also show the delayed scenario
document.addEventListener('DOMContentLoaded', calculateAll); 