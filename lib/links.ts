// The private link each client gets for their booking. One home, so emails never build it differently.
export const bookingUrl = (row: { public_token?: string | null }, siteUrl: string) =>
  row.public_token ? `${siteUrl.replace(/\/+$/, "")}/booking/${row.public_token}` : null;

// A line for the email body, or nothing when the job has no token.
export const bookingLine = (row: { public_token?: string | null }, siteUrl: string, label = "Your booking, any time") => {
  const url = bookingUrl(row, siteUrl);
  return url ? [`${label}: ${url}`, ""] : [];
};
