import { adminDisabledResponse, isAdminEnabled } from "@/lib/admin/store";

// 包装后台 API：生产环境返回 404，错误统一返回 { error }
export function adminRoute<T extends unknown[]>(
  handler: (...args: T) => Promise<unknown>
) {
  return async (...args: T) => {
    if (!isAdminEnabled()) return adminDisabledResponse();
    try {
      return Response.json((await handler(...args)) ?? { ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Response.json({ error: message }, { status: 400 });
    }
  };
}
