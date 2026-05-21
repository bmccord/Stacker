import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Link } from 'react-router-dom';
import { Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { useToast } from '@/hooks/use-toast';
import { extractErrorMessage } from '@/lib/errors';
import { GET_BOOKS, DELETE_BOOK } from '@/graphql/queries';

interface Book {
  id: string;
  title: string;
  authorId: string;
  genre: string | null;
  averageRating: number | null;
  reviewCount: number;
  author: { id: string; name: string } | null;
}

export default function BooksPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const { data, loading, refetch } = useQuery<{ books: Book[] }>(GET_BOOKS);
  const [doDelete] = useMutation(DELETE_BOOK);

  const books = (data?.books ?? []).filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author?.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await doDelete({ variables: { id: deleteTarget.id } });
      toast({ title: `"${deleteTarget.title}" deleted` });
      refetch();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: extractErrorMessage(err) });
    }
    setDeleteTarget(null);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Books</h1>
        <Link to="/app/books/new">
          <Button><Plus className="h-4 w-4 mr-2" />Add Book</Button>
        </Link>
      </div>

      <div className="mb-4">
        <Input placeholder="Search books..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : books.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No books found</TableCell></TableRow>
            ) : (
              books.map((book) => (
                <TableRow key={book.id}>
                  <TableCell>
                    <Link to={`/app/books/${book.id}`} className="text-primary hover:underline font-medium">{book.title}</Link>
                  </TableCell>
                  <TableCell>{book.author?.name ?? '—'}</TableCell>
                  <TableCell>{book.genre ?? '—'}</TableCell>
                  <TableCell>
                    {book.averageRating != null ? (
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        {book.averageRating.toFixed(1)}
                        <span className="text-muted-foreground text-xs">({book.reviewCount})</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">No reviews</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(book)}>
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
        title="Delete Book"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}
