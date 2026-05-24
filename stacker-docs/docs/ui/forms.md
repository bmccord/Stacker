---
sidebar_position: 4
---

# Form Management

Forms are built with React Hook Form and integrated with shadcn/ui components.

## Basic Pattern

Every form page follows the same structure:

```typescript
const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
  defaultValues: { name: '', bio: '' },
});

// Load existing data for edit mode
useEffect(() => {
  if (data?.author) {
    reset({ name: data.author.name, bio: data.author.bio ?? '' });
  }
}, [data, reset]);

async function onSubmit(values: FormData) {
  try {
    await upsert({ variables: { input: { id, ...values } } });
    toast({ title: 'Saved' });
    navigate('/app/authors');
  } catch (err) {
    toast({ variant: 'destructive', title: 'Error', description: extractErrorMessage(err) });
  }
}
```

## Create vs Edit

Create and edit share the same component. The page checks `useParams()` for an `id`:

- **No id** -- create mode, form starts with `defaultValues`
- **Has id** -- edit mode, fetches existing data and calls `reset()` to populate the form

The GraphQL mutation uses the upsert pattern -- pass `id` for update, omit for create.

## Controller Pattern

shadcn/ui components don't use native `ref` forwarding, so use `Controller` instead of `register` for Select, Checkbox, and Switch:

```tsx
<Controller
  name="authorId"
  control={control}
  render={({ field }) => (
    <Select value={field.value} onValueChange={field.onChange}>
      {/* options */}
    </Select>
  )}
/>
```

## Error Handling

All form submissions wrap the mutation in try/catch and display errors via toast:

```typescript
try {
  await mutate({ variables: { input } });
  toast({ title: 'Success' });
} catch (err) {
  toast({ variant: 'destructive', title: 'Error', description: extractErrorMessage(err) });
}
```

The `extractErrorMessage()` utility extracts the message from Apollo GraphQL errors, standard Error objects, or unknown types.

## Permission Checklists

The GroupFormPage uses a standalone `useState<string[]>` for permissions rather than React Hook Form, since permissions are a large checklist independent of the main form fields:

```typescript
const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

function togglePermission(permId: string) {
  setSelectedPermissions((prev) =>
    prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
  );
}
```

On submit, `selectedPermissions` is merged with the form values for the mutation.
