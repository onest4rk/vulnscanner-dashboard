import { Sidebar } from "@/components/sidebar";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={session} />
      <main className="flex-1 overflow-y-auto bg-navy-900 p-6">
        {children}
      </main>
    </div>
  );
}
