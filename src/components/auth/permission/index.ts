import { PermissionRoot } from "./root";
import { Authorized, Unauthorized, NotLoggedIn } from "./slots";

export const PermissionGate = {
  Root: PermissionRoot,
  Authorized,
  Unauthorized,
  NotLoggedIn,
};
