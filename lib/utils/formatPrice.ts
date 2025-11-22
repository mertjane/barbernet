export default function formatPriceInput (v: string) {
  const digits = v.replace(/[^\d]/g, "");
  if (!digits) return "";
  return `£${Number(digits).toLocaleString("en-GB")}`;
}