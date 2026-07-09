/**
 * Public marketplace is off until launch. Set VITE_MARKETPLACE_PUBLIC=true in .env for local dev.
 */
export const MARKETPLACE_PUBLIC = import.meta.env.VITE_MARKETPLACE_PUBLIC === "true";
