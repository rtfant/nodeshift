import { useState } from "react";
import { I18nProvider } from "./i18n";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import VersionList from "./components/VersionList";
import SettingsPanel from "./components/SettingsPanel";
import StatusBar from "./components/StatusBar";
import TitleBar from "./components/TitleBar";

type Page = "dashboard" | "versions" | "settings";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  return (
    <I18nProvider>
      <div className="flex h-screen w-screen flex-col bg-background">
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
          <main className="flex-1 overflow-auto p-6">
            {currentPage === "dashboard" && (
              <Dashboard onNavigate={(p) => setCurrentPage(p as Page)} />
            )}
            {currentPage === "versions" && <VersionList />}
            {currentPage === "settings" && <SettingsPanel />}
          </main>
        </div>
        <StatusBar />
      </div>
    </I18nProvider>
  );
}

export default App;
