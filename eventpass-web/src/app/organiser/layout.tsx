import Nav from "@/frontend/Nav";
import Footer from "@/frontend/Footer";

export default function OrganiserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
