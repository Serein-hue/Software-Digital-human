import { lazy, Suspense, useEffect } from "react";
import { AppShell } from "./components/layout/AppShell";
import { navigationItems } from "./data/navigation";
import { useConsoleStore } from "./store/useConsoleStore";
import type { PageId } from "./types/domain";

const OverviewPage = lazy(() => import("./features/overview/OverviewPage").then((module) => ({ default: module.OverviewPage })));
const AvatarPage = lazy(() => import("./features/avatar/AvatarPage").then((module) => ({ default: module.AvatarPage })));
const DataPage = lazy(() => import("./features/data/DataPage").then((module) => ({ default: module.DataPage })));
const ContentPage = lazy(() => import("./features/content/ContentPage").then((module) => ({ default: module.ContentPage })));

const pageComponents = {
  overview: OverviewPage,
  avatar: AvatarPage,
  data: DataPage,
  content: ContentPage
};

function readPageFromUrl(): PageId | null {
  const page = new URLSearchParams(window.location.search).get("page");
  return page && page in pageComponents ? (page as PageId) : null;
}

export default function App() {
  const activePage = useConsoleStore((state) => state.activePage);
  const setActivePage = useConsoleStore((state) => state.setActivePage);
  const ActivePage = pageComponents[activePage];
  const activeMeta = navigationItems.find((item) => item.id === activePage);

  useEffect(() => {
    const pageFromUrl = readPageFromUrl();
    if (pageFromUrl && pageFromUrl !== activePage) {
      setActivePage(pageFromUrl);
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("page") !== activePage) {
      url.searchParams.set("page", activePage);
      window.history.replaceState(null, "", url);
    }
  }, [activePage]);

  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="grid min-h-[420px] place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm text-white/60">
            正在加载运营工作台
          </div>
        }
      >
        <div aria-label={activeMeta?.label ?? "运营页面"}>
          <ActivePage />
        </div>
      </Suspense>
    </AppShell>
  );
}
