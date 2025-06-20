// types/user.d.ts
export interface User {
  id: number;
  nama: string;
  email: string;
  password?: string;
  is_notify: boolean;
  is_saved: boolean;
  no_whatsapp: string;
  role: "user" | "administrator";
  semester: Semester[];
}
