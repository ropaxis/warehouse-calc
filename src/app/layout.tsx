import type { Metadata } from "next";
import "./globals.css";
import { WorkProvider } from "@/context/WorkContext";



export const metadata: Metadata = {
  title: "WHcalc",
  description: "Calculate your efficient",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>
        <WorkProvider>{children}</WorkProvider>
      </body>
    </html>
  );
}



