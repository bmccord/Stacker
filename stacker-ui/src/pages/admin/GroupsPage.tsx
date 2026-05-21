import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { useToast } from '@/hooks/use-toast';
import { extractErrorMessage } from '@/lib/errors';
import { GET_GROUPS, DELETE_GROUP } from '@/graphql/queries';

interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  memberCount: number;
}

export default function GroupsPage() {
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);
  const { data, loading, refetch } = useQuery<{ groups: Group[] }>(GET_GROUPS);
  const [doDelete] = useMutation(DELETE_GROUP);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await doDelete({ variables: { id: deleteTarget.id } });
      toast({ title: `"${deleteTarget.name}" deleted` });
      refetch();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: extractErrorMessage(err) });
    }
    setDeleteTarget(null);
  }

  const groups = data?.groups ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Permission Groups</h1>
        <Link to="/app/groups/new">
          <Button><Plus className="h-4 w-4 mr-2" />New Group</Button>
        </Link>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : groups.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No groups found</TableCell></TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <Link to={`/app/groups/${group.id}`} className="text-primary hover:underline font-medium">
                      {group.name}
                    </Link>
                    {group.isSystem && <Badge variant="outline" className="ml-2 text-xs">System</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{group.description ?? '—'}</TableCell>
                  <TableCell>{group.memberCount}</TableCell>
                  <TableCell>{group.permissions.length}</TableCell>
                  <TableCell>
                    {!group.isSystem && (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(group)}>
                        Delete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Group"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? Members will lose these permissions.`}
      />
    </div>
  );
}
