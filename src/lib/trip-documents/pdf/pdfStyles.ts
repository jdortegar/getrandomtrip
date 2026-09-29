import { StyleSheet } from "@react-pdf/renderer";
export const colors = {
  ink: "#16313c",
  dark: "#163641",
  cyan: "#4ca6d0",
  muted: "#5c8495",
  border: "#d2e4ea",
  pale: "#e9f5fa",
};
export const pdfStyles = StyleSheet.create({
  page: {
    color: colors.ink,
    fontFamily: "Barlow",
    fontSize: 8,
    lineHeight: 1.35,
    padding: 30,
    paddingBottom: 36,
  },
  header: {
    backgroundColor: colors.dark,
    color: "white",
    marginHorizontal: -30,
    marginTop: -30,
    marginBottom: 13,
    minHeight: 106,
    paddingHorizontal: 30,
    paddingVertical: 14,
  },
  headerTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  logo: { width: 104, height: 26 },
  headerTitle: {
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.15,
    marginBottom: 5,
  },
  label: {
    color: colors.cyan,
    fontSize: 7,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  muted: { color: colors.muted, fontSize: 7.5 },
  row: { flexDirection: "row", gap: 10, marginBottom: 8 },
  card: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 9,
    padding: 11,
  },
  section: { marginBottom: 8 },
  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    marginBottom: 8,
  },
  iconPuck: {
    alignItems: "center",
    backgroundColor: colors.pale,
    borderRadius: 6,
    height: 19,
    justifyContent: "center",
    width: 19,
  },
  footer: {
    bottom: 14,
    color: colors.muted,
    fontSize: 6.5,
    left: 30,
    position: "absolute",
    right: 30,
  },
});
export function pdfDate(value: string, locale: string, weekday = false) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(weekday ? { weekday: "long" as const } : {}),
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
