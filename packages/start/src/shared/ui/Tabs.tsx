import {
  Tab as BaseTab,
  TabGroup as BaseTabGroup,
  TabList as BaseTabList,
  TabPanel as BaseTabPanel,
} from "terracotta";

import "./Tabs.css";

export const Tab: typeof BaseTab = (props) => (
  <BaseTab data-start-tab {...props} />
);
export const TabGroup: typeof BaseTabGroup = (props) => (
  <BaseTabGroup data-start-tab-group {...props} />
);
export const TabPanel: typeof BaseTabPanel = (props) => (
  <BaseTabPanel data-start-tab-panel {...props} />
);
export const TabList: typeof BaseTabList = (props) => (
  <BaseTabList data-start-tab-list {...props} />
);

