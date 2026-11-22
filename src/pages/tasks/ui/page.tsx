import { useNavigate } from "react-router";

import { ListTodo, Plus } from "lucide-react";

import { EmptyPane } from "@/widgets/app-shell";

import { useT } from "@/shared/lib";
import { Button } from "@/shared/ui";

import { TasksPanel } from "./tasks-panel";

export function TasksPage() {
  return <TasksPanel />;
}

export function TasksEmptyPane() {
  const t = useT();
  const navigate = useNavigate();
  return (
    <EmptyPane
      icon={<ListTodo />}
      title={t.tasks.selectTask}
      text={t.tasks.selectTaskHint}
      action={
        <Button
          size="md"
          icon={<Plus className="size-4" strokeWidth={3} />}
          onClick={() => navigate("/tasks/new")}
        >
          {t.tasks.newTask}
        </Button>
      }
    />
  );
}
