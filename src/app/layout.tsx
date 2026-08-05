import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orbit",
  description: "A conversational interface, quietly considered.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      style={
        {
          "--font-ui":
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Inter, "Helvetica Neue", Arial, sans-serif',
          "--font-mono-ui":
            '"SF Mono", ui-monospace, "Menlo", "Cascadia Code", monospace',
        } as React.CSSProperties
      }
    >
      <body className="min-h-full flex flex-col overflow-hidden">{children}</body>
    </html>
  );
}
