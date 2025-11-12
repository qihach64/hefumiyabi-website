import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SearchLoadingProvider } from "@/contexts/SearchLoadingContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SearchLoadingProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </SearchLoadingProvider>
  );
}
