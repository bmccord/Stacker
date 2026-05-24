---
sidebar_position: 3
---

# Components

The UI uses shadcn/ui as its component library, built on Radix UI primitives with Tailwind CSS styling.

## shadcn/ui

Components are copied into the project at `src/components/ui/` (not installed as a dependency), giving full control over styling and behavior.

### Available Components

| Component | Radix Primitive | Purpose |
|-----------|----------------|---------|
| Button | Slot | Actions with variant/size props |
| Input | -- | Text input |
| Textarea | -- | Multi-line text input |
| Label | Label | Form field labels |
| Select | Select | Dropdown selection |
| Checkbox | Checkbox | Boolean toggle |
| Switch | Switch | On/off toggle |
| Dialog | Dialog | Modal dialogs |
| Sheet | Dialog | Slide-out panels (mobile nav) |
| Table | -- | Data tables |
| Card | -- | Content containers |
| Badge | -- | Status indicators |
| Separator | Separator | Visual dividers |
| Tooltip | Tooltip | Hover hints |
| Toast | Toast | Notification messages |

### Adding New Components

```bash
npx shadcn@latest add [component-name]
```

## Custom Components

### SafeHtml

Renders user-generated HTML after sanitizing with DOMPurify. Prevents XSS attacks.

```tsx
import { SafeHtml } from '@/components/ui/SafeHtml';

<SafeHtml html={userContent} className="prose" />
```

### ConfirmDeleteDialog

Reusable confirmation dialog for destructive actions:

```tsx
<ConfirmDeleteDialog
  open={!!deleteTarget}
  onClose={() => setDeleteTarget(null)}
  onConfirm={handleDelete}
  title="Remove User"
  description="Are you sure?"
/>
```

### RequirePermission

Declarative permission guard. See [Routing](./routing) for details.

## Styling

### Utility Classes

The `cn()` helper (from `src/lib/utils.ts`) merges Tailwind classes with conflict resolution:

```typescript
import { cn } from '@/lib/utils';

<div className={cn('p-4 bg-white', isActive && 'bg-primary text-white')} />
```

### CSS Custom Properties

Colors use HSL CSS custom properties defined in `index.css`, enabling theme support:

```css
--primary: 222 47% 31%;
--primary-foreground: 210 40% 98%;
```

### Responsive Design

Mobile-first with Tailwind breakpoints. The sidebar collapses to a sheet on screens smaller than `md` (768px).
