import { TableSkeleton } from "@/components/ui/TableSkeleton";

export default function AsprakLoading() {
  return (
    <TableSkeleton
      titleWidth={240}
      pillCount={4}
      subPillCount={3}
      rowCount={8}
    />
  );
}
