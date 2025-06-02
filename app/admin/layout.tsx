import { ReactNode } from "react";
import { Metadata } from "next";
import ProtectedRouteLayout from "@/components/layout/ProtectedRouteLayout";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Administrative controls and user management",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRouteLayout requireAdmin={true}>{children}</ProtectedRouteLayout>
  );
}
