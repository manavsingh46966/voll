import type { EventItem } from "../types";

/**
 * Capitalize the first letter of a string.
 *
 * @param {string} str - The input string.
 * @returns {string} The capitalized string.
 */
export function capitalizeFirst(str?: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format an ISO date string into a human-readable short format.
 *
 * @param {string} dateStr - ISO date string.
 * @returns {string} Formatted date like "Feb 23, 2026, 10:00 AM".
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Extract a location display string from the EventItem's locationAddress field.
 * Handles both string and object shapes from the backend.
 *
 * @param {EventItem["locationAddress"]} loc - The raw locationAddress value.
 * @returns {string} The human-readable location string.
 */
export function getLocationString(loc: EventItem["locationAddress"]): string {
  if (typeof loc === "string") return loc.trim();
  if (typeof loc === "object" && loc) return (loc.address ?? "").trim();
  return "";
}

/**
 * Format a date range for event display.
 *
 * @param {string} from - ISO start date string.
 * @param {string} to - ISO end date string.
 * @returns {string} Formatted range like "Feb 23 – Feb 24, 2026".
 */
export function formatDateRange(from?: string, to?: string): string {
  if (!from) return "";
  const start = new Date(from);
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  const startStr = start.toLocaleDateString("en-US", opts);
  if (!to) return `${startStr}, ${start.getFullYear()}`;

  const end = new Date(to);
  const endStr = end.toLocaleDateString("en-US", {
    ...opts,
    year: "numeric",
  });
  return `${startStr} – ${endStr}`;
}

/**
 * Format a time string from an ISO date.
 *
 * @param {string} dateStr - ISO date string.
 * @returns {string} Formatted time like "10:00 AM".
 */
export function formatTime(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
