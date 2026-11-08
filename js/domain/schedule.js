export const validDay = day => Number.isInteger(day) && day >= 1 && day <= 7;
export const availableToday = (task, day) => (task.scheduledDay ?? 1) <= day;

/** Local fallback understands explicit demo days and relative days, never clamps. */
export function inferDay(text, currentDay, defaultDay = currentDay) {
  const explicit = text.match(/\bday\s*(\d+)\b|第\s*([一二三四五六七八九十\d]+)\s*天/i);
  if (explicit) {
    const value = explicit[1] || explicit[2];
    const chinese = '一二三四五六七八九十';
    const day = /^\d+$/.test(value) ? Number(value) : chinese.indexOf(value) + 1;
    return validDay(day) ? day : null;
  }
  if (/后天|day after tomorrow/i.test(text)) return validDay(currentDay + 2) ? currentDay + 2 : null;
  if (/明天|\btomorrow\b/i.test(text)) return validDay(currentDay + 1) ? currentDay + 1 : null;
  if (/今天|今晚|\btoday\b|\btonight\b/i.test(text)) return currentDay;
  const relative = text.match(/(?:in\s+(\d+)\s+days?\b)|(\d+)\s*天后/i);
  if (relative) {
    const day = currentDay + Number(relative[1] || relative[2]);
    return validDay(day) ? day : null;
  }
  if (/昨天|下周|下星期|周[一二三四五六日天]|星期|\byesterday\b|\bnext week\b|\b(?:mon|tues|wednes|thurs|fri|satur|sun)day\b|\d{4}-\d{2}-\d{2}|\d+月\d+日/i.test(text)) return null;
  return defaultDay;
}
