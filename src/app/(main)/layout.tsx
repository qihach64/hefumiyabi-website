import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileSearchBar from "@/components/layout/MobileSearchBar";
import BottomNav from "@/components/layout/BottomNav";
import { SearchLoadingProvider } from "@/contexts/SearchLoadingContext";
import { SearchBarProvider } from "@/contexts/SearchBarContext";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SearchLoadingProvider>
      <SearchBarProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <MobileSearchBar />
          <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden">{children}</main>
          <Footer />
          <BottomNav />
        </div>
      </SearchBarProvider>
    </SearchLoadingProvider>
  );
}
