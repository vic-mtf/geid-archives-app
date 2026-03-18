export default function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  const langue = navigator.language;
  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  };

  if (date < oneYearAgo) options.year = "numeric";

  const dtf = new Intl.DateTimeFormat(langue, options);
  return dtf.format(date);
}
