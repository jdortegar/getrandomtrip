type Props = { params: { type: string } };

export default function Head({ params }: Props) {
  const map: Record<string, string> = {
    couple: 'En Pareja | Randomtrip',
    solo: 'Solo | Randomtrip',
  };
  const title = map[params.type] ?? 'Randomtrip';
  return (
    <>
      <title>{title}</title>
    </>
  );
}
