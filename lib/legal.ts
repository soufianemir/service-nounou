export type LegalInfo = {
  publisherName: string;
  publisherStatus: string;
  publisherAddress: string;
  contactEmail: string;
  hostName: string;
  hostAddress: string;
};

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

export const LEGAL: LegalInfo = {
  publisherName: env("NEXT_PUBLIC_LEGAL_PUBLISHER_NAME"),
  publisherStatus: env("NEXT_PUBLIC_LEGAL_PUBLISHER_STATUS"),
  publisherAddress: env("NEXT_PUBLIC_LEGAL_PUBLISHER_ADDRESS"),
  contactEmail: env("NEXT_PUBLIC_LEGAL_CONTACT_EMAIL"),
  hostName: env("NEXT_PUBLIC_LEGAL_HOST_NAME"),
  hostAddress: env("NEXT_PUBLIC_LEGAL_HOST_ADDRESS")
};

export function displayOrDash(value: string): string {
  return value ? value : "—";
}
