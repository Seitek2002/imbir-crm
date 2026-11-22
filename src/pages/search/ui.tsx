import { SearchView } from "@/features/global-search";

import { useSession } from "@/shared/model";
import { useBack } from "@/shared/ui";

export function SearchPage() {
  const meId = useSession((s) => s.userId) ?? "";
  const back = useBack("/chats");
  return (
    <div className="flex h-full flex-col bg-surface lg:mx-auto lg:max-w-2xl lg:border-x lg:border-separator">
      <SearchView meId={meId} onClose={back} />
    </div>
  );
}
