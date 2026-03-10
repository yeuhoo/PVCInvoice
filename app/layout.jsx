import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata = {
  title: "PVC Invoice Record",
  description: "Invoice record management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
