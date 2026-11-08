"use client";

import { createContext, useContext } from "react";

// 手机上的侧栏抽屉：顶部菜单按钮和侧栏共用这个状态
export const SidebarContext = createContext<{ open: boolean; setOpen: (open: boolean) => void }>({
  open: false,
  setOpen: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}
