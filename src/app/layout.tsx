import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Piłka Nożna - Zapisy",
  description: "Aplikacja do zapisów na grę w piłkę nożną",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
