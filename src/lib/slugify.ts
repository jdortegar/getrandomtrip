export function slugify(input: string | undefined | null) {
  return (input ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')        // espacios -> guiones
    .replace(/[^a-z0-9\-]/g, '') // limpia caracteres no válidos
    .replace(/\-+/g, '-');       // colapsa guiones repetidos
}
