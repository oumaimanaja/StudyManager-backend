function generateDates(startDate, periodicity, numberOfOccurrences) {
  const dates = [];
  let currentDate = new Date(startDate);

  for (let i = 0; i < numberOfOccurrences; i++) {
    dates.push(new Date(currentDate));

    switch (periodicity) {
      case "Quotidienne": // Daily
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case "Hebdomadaire": // Weekly
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case "Mensuelle": // Monthly
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case "Annuelle": // Yearly
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
      default:
        throw new Error("Périodicité invalide");
    }
  }

  return dates;
}

module.exports = { generateDates };
