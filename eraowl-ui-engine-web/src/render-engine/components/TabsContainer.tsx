import type { ReactNode } from "react";
import { useState } from "react";

interface TabPanel {
  key: string;
  label: string;
  content?: ReactNode;
}

interface TabsContainerProps {
  id?: string;
  type?: "tabs-container" | "TabsContainer";
  tabs?: TabPanel[];
  activeTab?: string;
  children?: ReactNode;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function TabsContainer({ id, tabs = [], activeTab: controlledTab, children, templateOptions }: TabsContainerProps) {
  const [internalTab, setInternalTab] = useState(controlledTab ?? tabs[0]?.key ?? "");
  const currentTab = controlledTab ?? internalTab;

  return (
    <div
      id={id}
      data-eut-component="tabs-container"
      className="eut-tabs-container"
    >
      <div className="eut-tabs-container__nav" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={currentTab === tab.key}
            className={`eut-tabs-container__tab ${currentTab === tab.key ? "eut-tabs-container__tab--active" : ""}`}
            onClick={() => setInternalTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="eut-tabs-container__panels">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            role="tabpanel"
            hidden={currentTab !== tab.key}
            className="eut-tabs-container__panel"
          >
            {tab.content}
          </div>
        ))}
        {children}
      </div>
    </div>
  );
}
