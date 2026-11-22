import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";

import { ChatPage } from "@/pages/chat";
import { ChatInfoPage } from "@/pages/chat-info";
import { ChatsEmptyPane, ChatsPage } from "@/pages/chats";
import { LoginPage } from "@/pages/login";
import { NewChatPage } from "@/pages/new-chat";
import {
  NotificationsEmptyPane,
  NotificationsPage,
} from "@/pages/notifications";
import { ProfileEmptyPane, ProfilePage } from "@/pages/profile";
import { ProfileAboutPage } from "@/pages/profile-about";
import { ProfileAccountPage } from "@/pages/profile-account";
import { ProfileDepartmentsPage } from "@/pages/profile-departments";
import { ProfileTermsPage } from "@/pages/profile-terms";
import { SearchPage } from "@/pages/search";
import { TaskPage } from "@/pages/task";
import { TaskFormPage } from "@/pages/task-form";
import { TasksEmptyPane, TasksPage } from "@/pages/tasks";

import { AppShell, SplitSection } from "@/widgets/app-shell";

import { useSession } from "@/shared/model";

import { useScreenTransition } from "./use-screen-transition";

function RequireAuth({ children }: { children: ReactNode }) {
  const token = useSession((s) => s.token);
  const location = useLocation();
  if (!token)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const token = useSession((s) => s.token);
  const location = useLocation();
  if (token) {
    const from = (location.state as { from?: string } | null)?.from;
    return (
      <Navigate to={from && from !== "/login" ? from : "/chats"} replace />
    );
  }
  return children;
}

export function AppRoutes() {
  const location = useScreenTransition();

  return (
    <Routes location={location}>
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/chats" replace />} />
        <Route
          path="chats"
          element={
            <SplitSection list={<ChatsPage />} empty={<ChatsEmptyPane />} />
          }
        >
          <Route path="new" element={<NewChatPage />} />
          <Route path=":chatId" element={<ChatPage />} />
          <Route path=":chatId/info" element={<ChatInfoPage />} />
        </Route>
        <Route
          path="tasks"
          element={
            <SplitSection
              list={<TasksPage />}
              empty={<TasksEmptyPane />}
              listWidth="wide"
            />
          }
        >
          <Route path="new" element={<TaskFormPage />} />
          <Route path=":taskId" element={<TaskPage />} />
          <Route path=":taskId/edit" element={<TaskFormPage />} />
        </Route>
        <Route
          path="notifications"
          element={
            <SplitSection
              list={<NotificationsPage />}
              empty={<NotificationsEmptyPane />}
            />
          }
        />
        <Route
          path="profile"
          element={
            <SplitSection
              list={<ProfilePage />}
              empty={<ProfileEmptyPane />}
              listWidth="wide"
            />
          }
        >
          <Route path="account" element={<ProfileAccountPage />} />
          <Route path="departments" element={<ProfileDepartmentsPage />} />
          <Route path="about" element={<ProfileAboutPage />} />
          <Route path="terms" element={<ProfileTermsPage />} />
        </Route>
        <Route path="search" element={<SearchPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
