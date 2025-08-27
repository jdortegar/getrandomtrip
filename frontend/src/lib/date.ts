export const toDateOnly = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
export const addDays = (d: Date, n: number) => toDateOnly(new Date(d.getTime() + n*86400000));
export const fmtISO = (d?: Date) => d ? toDateOnly(d).toISOString().slice(0,10) : undefined; // YYYY-MM-DD