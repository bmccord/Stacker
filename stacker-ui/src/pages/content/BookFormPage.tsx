import { useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { extractErrorMessage } from '@/lib/errors';
import { GET_BOOK, GET_AUTHORS, UPSERT_BOOK, GET_BOOKS } from '@/graphql/queries';

interface FormData {
  title: string;
  authorId: string;
  genre: string;
  description: string;
  coverUrl: string;
}

const GENRES = ['Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Romance', 'Thriller', 'Biography', 'History', 'Science', 'Philosophy', 'Poetry', 'Other'];

export default function BookFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const { data: bookData, loading: bookLoading } = useQuery<{ book: { id: string; title: string; authorId: string; genre: string | null; description: string | null; coverUrl: string | null } | null }>(GET_BOOK, { variables: { id }, skip: !id });
  const { data: authorsData } = useQuery<{ authors: { id: string; name: string }[] }>(GET_AUTHORS);
  const [upsert, { loading: saving }] = useMutation(UPSERT_BOOK, { refetchQueries: [{ query: GET_BOOKS }] });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    defaultValues: { title: '', authorId: '', genre: '', description: '', coverUrl: '' },
  });

  useEffect(() => {
    if (bookData?.book) {
      const b = bookData.book;
      reset({ title: b.title, authorId: b.authorId, genre: b.genre ?? '', description: b.description ?? '', coverUrl: b.coverUrl ?? '' });
    }
  }, [bookData, reset]);

  async function onSubmit(values: FormData) {
    try {
      await upsert({
        variables: {
          input: {
            ...(id ? { id } : {}),
            title: values.title,
            authorId: values.authorId,
            genre: values.genre || null,
            description: values.description || null,
            coverUrl: values.coverUrl || null,
          },
        },
      });
      toast({ title: isEdit ? 'Book updated' : 'Book created' });
      navigate('/app/books');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: extractErrorMessage(err) });
    }
  }

  if (bookLoading) {
    return <div className="p-6 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Book' : 'New Book'}</h1>

      <div className="rounded-xl border bg-white shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title', { required: 'Title is required' })} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Author</Label>
            <Controller
              name="authorId"
              control={control}
              rules={{ required: 'Author is required' }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select an author" /></SelectTrigger>
                  <SelectContent>
                    {(authorsData?.authors ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.authorId && <p className="text-sm text-destructive">{errors.authorId.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Genre</Label>
            <Controller
              name="genre"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select a genre" /></SelectTrigger>
                  <SelectContent>
                    {GENRES.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={4} {...register('description')} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="coverUrl">Cover Image URL</Label>
            <Input id="coverUrl" {...register('coverUrl')} placeholder="https://..." />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/app/books')}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Update Book' : 'Create Book'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
