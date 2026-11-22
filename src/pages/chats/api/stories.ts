import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { type StoryDTO, api, qk } from "@/shared/api";

export function useStories() {
  return useQuery({
    queryKey: qk.stories,
    queryFn: () => api.get<StoryDTO[]>("/stories"),
    staleTime: 60_000,
  });
}

export function usePublishStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { bg: string; emoji: string; text: string }) =>
      api.post("/stories", v),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.stories }),
  });
}

export function useDeleteStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/stories/${id}`),
    onMutate: (id) =>
      qc.setQueryData<StoryDTO[]>(qk.stories, (l) =>
        l?.filter((s) => s.id !== id),
      ),
  });
}

export function useMarkStorySeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/stories/${id}/seen`),
    onMutate: (id) =>
      qc.setQueryData<StoryDTO[]>(qk.stories, (l) =>
        l?.map((s) => (s.id === id ? { ...s, seen: true } : s)),
      ),
  });
}
