export default function timeElapsed(dateString: string | Date): string {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const secondes = Math.floor(diff / 1000);
  const minutes = Math.floor(secondes / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const moths = Math.floor(days / 30);
  const years = Math.floor(moths / 12);

  const langue = navigator.language;
  const rtf = new Intl.RelativeTimeFormat(langue, { numeric: "auto" });

  if (years > 0) return rtf.format(-years, "year");
  else if (moths > 0) return rtf.format(-moths, "month");
  else if (weeks > 0) return rtf.format(-weeks, "week");
  else if (days > 0) return rtf.format(-days, "day");
  else if (hours > 0) return rtf.format(-hours, "hour");
  else if (minutes > 0) return rtf.format(-minutes, "minute");
  else return rtf.format(-secondes, "second");
}
