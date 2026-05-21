import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { extractErrorMessage } from '@/lib/errors';
import { GET_USERS, GET_GROUPS, INVITE_USER, UPDATE_USER_GROUPS, REMOVE_USER } from '@/graphql/queries';

interface Group {
  id: string;
  name: string;
  slug: string;
  isSystem: boolean;
}

interface AppUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  emailVerified: boolean;
  groups: Group[];
  createdAt: string;
}

export default function UsersPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteGroupIds, setInviteGroupIds] = useState<string[]>([]);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [editGroupIds, setEditGroupIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);

  const { data, loading, refetch } = useQuery<{ users: AppUser[] }>(GET_USERS);
  const { data: groupsData } = useQuery<{ groups: Group[] }>(GET_GROUPS);
  const [doInvite, { loading: inviting }] = useMutation(INVITE_USER);
  const [doUpdateGroups, { loading: updatingGroups }] = useMutation(UPDATE_USER_GROUPS);
  const [doRemove] = useMutation(REMOVE_USER);

  const users = (data?.users ?? []).filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
  );
  const groups = groupsData?.groups ?? [];

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    try {
      await doInvite({ variables: { email: inviteEmail.trim(), groupIds: inviteGroupIds } });
      toast({ title: 'Invitation sent' });
      setInviteOpen(false);
      setInviteEmail('');
      setInviteGroupIds([]);
      refetch();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: extractErrorMessage(err) });
    }
  }

  async function handleUpdateGroups(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    try {
      await doUpdateGroups({ variables: { userId: editUser.id, groupIds: editGroupIds } });
      toast({ title: 'Groups updated' });
      setEditUser(null);
      refetch();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: extractErrorMessage(err) });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await doRemove({ variables: { userId: deleteTarget.id } });
      toast({ title: 'User removed' });
      refetch();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: extractErrorMessage(err) });
    }
    setDeleteTarget(null);
  }

  function toggleGroup(groupId: string, list: string[], setList: (ids: string[]) => void) {
    setList(list.includes(groupId) ? list.filter((id) => id !== groupId) : [...list, groupId]);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={() => setInviteOpen(true)}><Plus className="h-4 w-4 mr-2" />Invite User</Button>
      </div>

      <div className="mb-4">
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Groups</TableHead>
              <TableHead className="w-[160px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.groups.map((g) => (
                        <Badge key={g.id} variant="secondary" className="text-xs">{g.name}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditUser(user); setEditGroupIds(user.groups.map((g) => g.id)); }}>
                        Edit Groups
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(user)}>
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Groups</Label>
              {groups.map((g) => (
                <label key={g.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={inviteGroupIds.includes(g.id)} onCheckedChange={() => toggleGroup(g.id, inviteGroupIds, setInviteGroupIds)} />
                  {g.name}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={inviting}>{inviting ? 'Sending...' : 'Send Invite'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit groups dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Groups for {editUser?.firstName} {editUser?.lastName}</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateGroups} className="space-y-4">
            <div className="space-y-2">
              {groups.map((g) => (
                <label key={g.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={editGroupIds.includes(g.id)} onCheckedChange={() => toggleGroup(g.id, editGroupIds, setEditGroupIds)} />
                  {g.name}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button type="submit" disabled={updatingGroups}>{updatingGroups ? 'Saving...' : 'Update Groups'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove User"
        description={`Are you sure you want to remove ${deleteTarget?.firstName} ${deleteTarget?.lastName} (${deleteTarget?.email})?`}
      />
    </div>
  );
}
