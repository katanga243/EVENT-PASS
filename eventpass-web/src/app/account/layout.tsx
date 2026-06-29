import Nav from "@/frontend/Nav";
import Footer from "@/frontend/Footer";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
