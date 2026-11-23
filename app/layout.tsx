import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Emil Chess Lab", description: "Kostenlose Schachanalyse direkt im Browser." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
