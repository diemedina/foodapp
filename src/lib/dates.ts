/**
 * Fechas como texto ISO (YYYY-MM-DD) para no depender de la zona horaria del servidor.
 * La semana empieza el lunes. `dow` devuelve 0 = lunes ... 6 = domingo.
 */
import { DAYS } from "./meals";

export const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const MONTHS_LONG = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function appTimeZone(): string {
  return process.env.APP_TIME_ZONE || "America/Argentina/Buenos_Aires";
}

/** Fecha de hoy en la zona horaria de la app. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: appTimeZone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Hora actual (0-23) en la zona horaria de la app. */
export function hourNow(now: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: appTimeZone(), hour: "numeric", hourCycle: "h23" }).format(now),
  );
}

function toUTC(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = toUTC(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUTC(d);
}

export function dow(iso: string): number {
  return (toUTC(iso).getUTCDay() + 6) % 7;
}

/** Lunes de la semana de `iso`, desplazado `offset` semanas. */
export function mondayOf(iso: string, offset = 0): string {
  return addDays(iso, -dow(iso) + offset * 7);
}

export function dayOfMonth(iso: string): number {
  return Number(iso.slice(8, 10));
}

export function weeksBetween(fromMonday: string, toMonday: string): number {
  return Math.round((toUTC(toMonday).getTime() - toUTC(fromMonday).getTime()) / (7 * 864e5));
}

/** "12–18 oct" o "28 sep – 4 oct" */
export function rangeText(monday: string): string {
  const sunday = addDays(monday, 6);
  const m1 = Number(monday.slice(5, 7)) - 1;
  const m2 = Number(sunday.slice(5, 7)) - 1;
  if (m1 === m2) return `${dayOfMonth(monday)}–${dayOfMonth(sunday)} ${MONTHS[m2]}`;
  return `${dayOfMonth(monday)} ${MONTHS[m1]} – ${dayOfMonth(sunday)} ${MONTHS[m2]}`;
}

/** "domingo 11 de octubre" */
export function longDate(iso: string): string {
  return `${DAYS[dow(iso)].toLowerCase()} ${dayOfMonth(iso)} de ${MONTHS_LONG[Number(iso.slice(5, 7)) - 1]}`;
}

export function isISODate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
