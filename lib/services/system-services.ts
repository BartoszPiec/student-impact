export const SYSTEM_SERVICE_TYPE = "platform_service";

type ServicePackageLike = {
  type?: string | null;
  status?: string | null;
  is_system?: boolean | null;
};

export function isSystemServicePackage(pkg: ServicePackageLike | null | undefined) {
  return pkg?.type === SYSTEM_SERVICE_TYPE && pkg?.is_system === true;
}

export function isActiveSystemServicePackage(pkg: ServicePackageLike | null | undefined) {
  return isSystemServicePackage(pkg) && pkg?.status === "active";
}
