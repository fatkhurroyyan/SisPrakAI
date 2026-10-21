import { TableSkeleton } from "@/components/ui/TableSkeleton";

export default function PraktikanLoading() {
  return (
    <TableSkeleton
      titleWidth={200}
      pillCount={3}
      subPillCount={2}
      rowCount={6}
    />
  );
}
