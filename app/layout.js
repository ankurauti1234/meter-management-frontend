import "./globals.css";


export const metadata = {
  title: "Inditronics Rex | IoT Meter Management for TRP Analytics",
  description: "Inditronics Rex is an advanced IoT meter management platform designed to monitor and manage people meters for Television Rating Points (TRP) analytics. Optimize audience measurement with real-time insights and data-driven decisions.",
  keywords: "IoT meter management, TRP analytics, people meter, audience measurement, real-time IoT monitoring, television ratings, smart meters",
  author: "Inditronics Rex Team",
  robots: "index, follow",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className="antialiased6">
        {children}
      </body>
    </html>
  );
}
