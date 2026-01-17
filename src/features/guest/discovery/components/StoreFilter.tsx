"use client";

import { MapPin } from "lucide-react";

interface Store {
  id: string;
  name: string;
}

interface StoreFilterProps {
  stores: Store[];
  selectedStoreId: string | null;
  onStoreChange: (storeId: string | null) => void;
}

export function StoreFilter({
  stores,
  selectedStoreId,
  onStoreChange,
}: StoreFilterProps) {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor="store-filter" className="flex items-center gap-2 text-sm font-medium text-muted-foreground shrink-0">
        <MapPin className="w-4 h-4" />
        <span className="hidden sm:inline">筛选店铺</span>
      </label>
      <select
        id="store-filter"
        value={selectedStoreId || ""}
        onChange={(e) => onStoreChange(e.target.value || null)}
        className="flex h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">所有店铺</option>
        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </select>
    </div>
  );
}
