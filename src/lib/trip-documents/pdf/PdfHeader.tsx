import { Image as PdfImage, Text, View } from "@react-pdf/renderer";
import type { PdfIconProps } from "./PdfIcon";
import { PdfIcon } from "./PdfIcon";
import { colors, pdfStyles as s } from "./pdfStyles";
import { estimatedPdfLines } from "./pdfTextLayout";
interface Props {
  logo?: Buffer;
  eyebrow: string;
  title: string;
  subtitle?: string;
  status: string;
  reference?: string;
  referenceLabel: string;
  icon?: PdfIconProps["name"];
  xsed?: string;
  traveler?: string;
  experience?: string;
  experienceLabel?: string;
  getLost?: string;
  roadmap?: boolean;
  route?: string;
}
export function PdfHeader({
  logo,
  eyebrow,
  title,
  subtitle,
  status,
  reference,
  referenceLabel,
  icon,
  xsed,
  traveler,
  experience,
  experienceLabel,
  getLost,
  roadmap,
  route,
}: Props) {
  const compactMetadata =
    [status, reference, route].every(
      (value) => !value || (!/[\r\n]/.test(value) && value.length <= 90),
    ) && status.length <= 40;
  const compactHeading =
    estimatedPdfLines(
      [title, subtitle, traveler, experience].filter(Boolean).join("\n"),
      45,
    ) <= 12;
  return (
    <>
      <View
        style={[s.header, { flexDirection: "row", gap: 12 }]}
        wrap={!compactHeading}
      >
        <View style={{ flex: 1 }}>
          <View style={{ marginBottom: 5 }}>
            {logo ? (
              <PdfImage src={{ data: logo, format: "png" }} style={s.logo} />
            ) : (
              <Text style={{ fontSize: 15, fontWeight: 700 }}>RANDOMTRIP</Text>
            )}
          </View>
          <Text style={[s.label, { marginBottom: 4 }]}>{eyebrow}</Text>
          <Text style={s.headerTitle}>{title}</Text>
          {subtitle && <Text style={s.label}>{subtitle}</Text>}
        </View>
        <View
          style={{
            alignItems: "flex-end",
            justifyContent: "space-between",
            width: 215,
          }}
        >
          {compactMetadata && (
            <View style={{ alignItems: "flex-end", width: "100%" }}>
              <View
                style={{ alignItems: "center", flexDirection: "row", gap: 8 }}
              >
                {icon && <PdfIcon color="#31d77b" name={icon} size={21} />}
                <Text
                  style={{
                    backgroundColor: roadmap ? "#174a42" : "#205164",
                    borderRadius: 12,
                    color: roadmap ? "#31d77b" : "#d7e4e9",
                    fontSize: 6.8,
                    fontWeight: 700,
                    paddingHorizontal: 18,
                    paddingVertical: 5,
                  }}
                >
                  {status}
                </Text>
              </View>
              {reference && (
                <Text style={{ color: "#88aebd", fontSize: 7, marginTop: 3 }}>
                  {referenceLabel}: {reference}
                </Text>
              )}
              {route && (
                <Text style={{ color: "#88aebd", fontSize: 6.5, marginTop: 3 }}>
                  {route}
                </Text>
              )}
            </View>
          )}
          {(xsed || traveler || experience) && (
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                marginTop: 8,
                maxWidth: 215,
              }}
            >
              {xsed ? (
                <>
                  <Text style={{ fontSize: 23, fontWeight: 700 }}>XSED</Text>
                  <Text
                    style={{
                      borderLeft: "1.5 solid #e99a4b",
                      fontSize: 6,
                      marginLeft: 6,
                      paddingLeft: 6,
                      width: 53,
                    }}
                  >
                    {xsed}
                  </Text>
                </>
              ) : (
                <>
                  {traveler && (
                    <View style={{ flexShrink: 1 }}>
                      <Text style={{ fontSize: 6 }}>{getLost}</Text>
                      <Text style={{ fontSize: 18, fontWeight: 700 }}>
                        {traveler}
                      </Text>
                    </View>
                  )}
                  {experience && (
                    <View
                      style={{
                        borderLeft: `1.5 solid ${colors.cyan}`,
                        flexShrink: 1,
                        marginLeft: 6,
                        paddingLeft: 6,
                      }}
                    >
                      <Text style={{ fontSize: 6 }}>{experienceLabel}</Text>
                      <Text style={{ fontSize: 7 }}>{experience}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </View>
      {!compactMetadata && (
        <View style={[s.card, s.section]}>
          <Text style={{ fontWeight: 700, marginBottom: 5 }}>{status}</Text>
          {reference && (
            <Text>
              <Text style={s.label}>{referenceLabel}: </Text>
              {reference}
            </Text>
          )}
          {route && <Text style={{ marginTop: 5 }}>{route}</Text>}
        </View>
      )}
    </>
  );
}
