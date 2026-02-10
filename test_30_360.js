function getPreciseDateDiff(startDate, endDate) {
    let start = new Date(startDate);
    let end = new Date(endDate);

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    const totalDays = (years * 360) + (months * 30) + days;

    let displayYears = years;
    let displayMonths = months;
    let displayDays = days;

    if (displayDays < 0) {
        displayMonths -= 1;
        displayDays += 30;
    }
    if (displayMonths < 0) {
        displayYears -= 1;
        displayMonths += 12;
    }

    return { years: displayYears, months: displayMonths, days: displayDays, totalDays };
}

const start = "2025-11-06";
const end = "2026-02-03";
const diff = getPreciseDateDiff(start, end);

console.log('Start:', start);
console.log('End:', end);
console.log('Days Diff (30/360):', diff.totalDays);
console.log('Display:', diff.years + 'y ' + diff.months + 'm ' + diff.days + 'd');

let totalMonths = diff.totalDays / 30;
console.log('Total Months:', totalMonths);

let P = 40000;
let R = 3;
let interest = (P * R * totalMonths) / 100;
console.log('Interest:', interest);
