import { usePermissions } from '@/lib/use-permissions';

interface RequirePermissionProps {
  permission?: string;
  anyPermission?: string[];
  children: React.ReactNode;
}

export default function RequirePermission({ permission, anyPermission, children }: RequirePermissionProps) {
  const permissions = usePermissions();

  const hasAccess = anyPermission
    ? anyPermission.some((p) => permissions.has(p))
    : permission
      ? permissions.has(permission)
      : false;

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
