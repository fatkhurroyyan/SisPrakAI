import { TableSkeleton } from "@/components/ui/TableSkeleton";

export default function DosenLoading() {
  return (
    <TableSkeleton
      titleWidth={220}
      pillCount={5}
      subPillCount={4}
      rowCount={8}
    />
  );
}
