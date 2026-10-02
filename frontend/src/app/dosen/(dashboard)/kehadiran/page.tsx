import { getRekapDosen } from "../actions";
import DosenClient from "../DosenClient";

export default async function KehadiranPage() {
  const data = await getRekapDosen();
  
  return <DosenClient initialData={data} type="KEHADIRAN" />;
}
