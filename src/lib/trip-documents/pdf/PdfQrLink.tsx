import { Image as PdfImage, Link, View } from "@react-pdf/renderer";
interface Props {
  src: string;
  children: string;
  images?: Record<string, Buffer>;
}
export function PdfQrLink({ src, children, images }: Props) {
  const image = images?.[src];
  if (!image) return <Link src={src}>{children}</Link>;
  return (
    <View style={{ marginBottom: 8, marginRight: 12, width: 100 }} wrap={false}>
      <Link src={src}>
        <PdfImage
          src={{ data: image, format: "png" }}
          style={{ height: 100, width: 100 }}
        />
      </Link>
      <Link src={src}>{children}</Link>
    </View>
  );
}
