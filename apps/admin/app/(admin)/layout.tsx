import { AdminFrame } from "@/components/admin-frame";

export default function AdminLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <>
      <AdminFrame>{children}</AdminFrame>
      {modal}
    </>
  );
}
