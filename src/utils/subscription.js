function getExpiryDate(type) {
  const now = new Date();

  switch (type) {
    case "daily":
      now.setDate(now.getDate() + 1);
      break;

    case "weekly":
      now.setDate(now.getDate() + 7);
      break;

    case "monthly":
      now.setMonth(now.getMonth() + 1);
      break;

    default:
      return null;
  }

  return now;
}

module.exports = { getExpiryDate };
