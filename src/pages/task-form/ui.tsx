import { useLocation, useNavigate, useParams } from "react-router";

import { X } from "lucide-react";

import { TaskForm, type TaskFormPrefill } from "@/features/task-form";

import { useTask } from "@/entities/task";

import { useT } from "@/shared/lib";
import { useSession } from "@/shared/model";
import { NavBar, Screen, Skeleton, useBack } from "@/shared/ui";

/** Создание и редактирование задачи («× Новая задача» как в видео) */
export function TaskFormPage() {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const { taskId } = useParams();
  const meId = useSession((s) => s.userId) ?? "";
  const { data: task, isLoading } = useTask(taskId);
  const back = useBack(taskId ? `/tasks/${taskId}` : "/tasks");
  const prefill = (location.state as { prefill?: TaskFormPrefill } | null)
    ?.prefill;

  return (
    <Screen>
      <NavBar
        left={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={back}
              aria-label={t.common.close}
              className="pressable flex size-10 items-center justify-center rounded-full text-primary"
            >
              <X className="size-6" strokeWidth={2.4} />
            </button>
            <span className="text-[1.0625rem] font-semibold">
              {taskId ? t.tasks.editTask : t.tasks.newTask}
            </span>
          </div>
        }
      />
      {taskId && isLoading && !task ? (
        <div className="flex flex-col gap-3 p-4">
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : (
        <TaskForm
          key={task?.id ?? "new"}
          meId={meId}
          task={taskId ? task : undefined}
          prefill={prefill}
          onDone={(id) => navigate(`/tasks/${id}`, { replace: true })}
        />
      )}
    </Screen>
  );
}
