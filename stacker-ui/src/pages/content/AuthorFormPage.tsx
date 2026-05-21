import { useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { extractErrorMessage } from '@/lib/errors';
import { GET_AUTHOR, UPSERT_AUTHOR, GET_AUTHORS } from '@/graphql/queries';

interface FormData {
  name: string;
  bio: string;
}

export default function AuthorFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const { data: authorData, loading: authorLoading } = useQuery(GET_AUTHOR, { variables: { id }, skip: !id });
  const [upsert, { loading: saving }] = useMutation(UPSERT_AUTHOR, { refetchQueries: [{ query: GET_AUTHORS }] });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { name: '', bio: '' },
  });

  useEffect(() => {
    if (authorData?.author) {
      const a = authorData.author;
      reset({ name: a.name, bio: a.bio ?? '' });
    }
  }, [authorData, reset]);

  async function onSubmit(values: FormData) {
    try {
      await upsert({
        variables: {
          input: {
            ...(id ? { id } : {}),
            name: values.name,
            bio: values.bio || null,
          },
        },
      });
      toast({ title: isEdit ? 'Author updated' : 'Author created' });
      navigate('/app/authors');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: extractErrorMessage(err) });
    }
  }

  if (authorLoading) {
    return <div className="p-6 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Author' : 'New Author'}</h1>

      <div className="rounded-xl border bg-white shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" rows={5} {...register('bio')} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/app/authors')}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Update Author' : 'Create Author'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
