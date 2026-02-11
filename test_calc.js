function getPreciseDateDiff(startDate, endDate) {
    let start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    let end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const oneDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.round(Math.abs((end - start) / oneDay));

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
        months -= 1;
        let lastDayPrevMonth = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
        days += lastDayPrevMonth;
    }

    if (months < 0) {
        years -= 1;
        months += 12;
    }

    return { years, months, days, totalDays };
}

const start = "2025-11-06";
const end = "2026-02-03";
const diff = getPreciseDateDiff(start, end);

console.log('Start:', start);
console.log('End:', end);
console.log('Days Diff:', diff.totalDays);
console.log('Calendar Diff:', diff.years + 'y ' + diff.months + 'm ' + diff.days + 'd');

let totalMonths = diff.totalDays / 30;
console.log('Total Months (Days/30):', totalMonths);

let P = 40000;
let R = 3;
let interest = (P * R * totalMonths) / 100;
console.log('Interest:', interest);
