import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { extractErrorMessage } from '@/lib/errors';
import { GET_GROUP, GET_ALL_PERMISSIONS, CREATE_GROUP, UPDATE_GROUP, GET_GROUPS } from '@/graphql/queries';

interface FormData {
  name: string;
  description: string;
}

interface PermissionCategory {
  label: string;
  permissions: { id: string; label: string }[];
}

export default function GroupFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const { data: groupData, loading: groupLoading } = useQuery<{ group: { id: string; name: string; slug: string; description: string | null; isSystem: boolean; permissions: string[]; memberCount: number } | null }>(GET_GROUP, { variables: { id }, skip: !id });
  const { data: permData } = useQuery<{ allPermissions: PermissionCategory[] }>(GET_ALL_PERMISSIONS);
  const [createGroup, { loading: creating }] = useMutation(CREATE_GROUP, { refetchQueries: [{ query: GET_GROUPS }] });
  const [updateGroup, { loading: updating }] = useMutation(UPDATE_GROUP, { refetchQueries: [{ query: GET_GROUPS }] });

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionsInitialized, setPermissionsInitialized] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (groupData?.group) {
      const g = groupData.group;
      reset({ name: g.name, description: g.description ?? '' });
    }
  }, [groupData, reset]);

  // Sync permissions from query data once on load (avoids setState-in-effect lint error)
  if (groupData?.group && !permissionsInitialized) {
    setSelectedPermissions(groupData.group.permissions ?? []);
    setPermissionsInitialized(true);
  }

  function togglePermission(permId: string) {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  }

  async function onSubmit(values: FormData) {
    try {
      if (isEdit) {
        await updateGroup({
          variables: {
            input: { id, name: values.name, description: values.description || null, permissions: selectedPermissions },
          },
        });
        toast({ title: 'Group updated' });
      } else {
        await createGroup({
          variables: {
            input: { name: values.name, description: values.description || null, permissions: selectedPermissions },
          },
        });
        toast({ title: 'Group created' });
      }
      navigate('/app/groups');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: extractErrorMessage(err) });
    }
  }

  const saving = creating || updating;
  const isSystem = groupData?.group?.isSystem ?? false;

  if (groupLoading) {
    return <div className="p-6 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Group' : 'New Group'}</h1>

      <div className="rounded-xl border bg-white shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name', { required: 'Name is required' })} disabled={isSystem} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} {...register('description')} />
          </div>

          <div className="space-y-4">
            <Label>Permissions</Label>
            {(permData?.allPermissions ?? []).map((category) => (
              <div key={category.label} className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">{category.label}</p>
                {category.permissions.map((perm) => (
                  <label key={perm.id} className="flex items-center gap-2 text-sm pl-2">
                    <Checkbox
                      checked={selectedPermissions.includes(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                      disabled={isSystem}
                    />
                    {perm.label}
                  </label>
                ))}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/app/groups')}>Cancel</Button>
            {!isSystem && (
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Update Group' : 'Create Group'}</Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
