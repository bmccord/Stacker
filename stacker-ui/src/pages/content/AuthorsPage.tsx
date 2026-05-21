import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { useToast } from '@/hooks/use-toast';
import { extractErrorMessage } from '@/lib/errors';
import { GET_AUTHORS, DELETE_AUTHOR } from '@/graphql/queries';

interface Author {
  id: string;
  name: string;
  bio: string | null;
  bookCount: number;
  createdAt: string;
}

export default function AuthorsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Author | null>(null);
  const { data, loading, refetch } = useQuery<{ authors: Author[] }>(GET_AUTHORS);
  const [doDelete] = useMutation(DELETE_AUTHOR);

  const authors = (data?.authors ?? []).filter(
    (a) => a.name.toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Authors</h1>
        <Link to="/app/authors/new">
          <Button><Plus className="h-4 w-4 mr-2" />Add Author</Button>
        </Link>
      </div>

      <div className="mb-4">
        <Input placeholder="Search authors..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Bio</TableHead>
              <TableHead>Books</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : authors.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No authors found</TableCell></TableRow>
            ) : (
              authors.map((author) => (
                <TableRow key={author.id}>
                  <TableCell>
                    <Link to={`/app/authors/${author.id}`} className="text-primary hover:underline font-medium">{author.name}</Link>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{author.bio ?? '—'}</TableCell>
                  <TableCell>{author.bookCount}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(author)}>
                      Delete
                    </Button>
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
        title="Delete Author"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all their books.`}
      />
    </div>
  );
}
