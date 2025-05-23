import { ReactNode } from "react";
import { Metadata } from "next";
import ProtectedRouteLayout from "@/components/layout/ProtectedRouteLayout";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "User dashboard and account management",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <ProtectedRouteLayout>{children}</ProtectedRouteLayout>;
}
