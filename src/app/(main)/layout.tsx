import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SearchLoadingProvider } from "@/contexts/SearchLoadingContext";
import { SearchBarProvider } from "@/contexts/SearchBarContext";
import { SearchStateProvider } from "@/contexts/SearchStateContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SearchLoadingProvider>
      <SearchBarProvider>
        <SearchStateProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </SearchStateProvider>
      </SearchBarProvider>
    </SearchLoadingProvider>
  );
}
