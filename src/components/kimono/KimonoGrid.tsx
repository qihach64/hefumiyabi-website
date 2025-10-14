import { KimonoWithImages } from "@/types";
import KimonoCard from "./KimonoCard";

interface KimonoGridProps {
  kimonos: KimonoWithImages[];
}

export default function KimonoGrid({ kimonos }: KimonoGridProps) {
  if (kimonos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">暂无和服</p>
        <p className="text-sm text-muted-foreground mt-2">
          请尝试调整筛选条件
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {kimonos.map((kimono) => (
        <KimonoCard key={kimono.id} kimono={kimono} />
      ))}
    </div>
  );
}
