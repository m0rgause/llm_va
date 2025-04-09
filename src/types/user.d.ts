// types/user.d.ts
export interface User {
  id: number;
  nama: string;
  email: string;
  password: string;
  no_whatsapp: string;
  role: "user" | "administrator";
  semester: Semester[];
}
