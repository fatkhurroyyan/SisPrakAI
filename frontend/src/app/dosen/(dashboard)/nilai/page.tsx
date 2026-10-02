import { getRekapDosen } from "../actions";
import DosenClient from "../DosenClient";

export default async function NilaiPage() {
  const data = await getRekapDosen();
  
  return <DosenClient initialData={data} type="NILAI" />;
}
