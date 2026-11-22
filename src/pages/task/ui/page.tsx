import { useParams } from "react-router";

import { TaskView } from "./task-view";

export function TaskPage() {
  const { taskId = "" } = useParams();
  return <TaskView key={taskId} taskId={taskId} />;
}
