---
sidebar_position: 3
---

# Components

The Stacker UI uses shadcn/ui as its component library, built on Radix UI primitives with Tailwind CSS styling.

## Component Library

shadcn/ui components are copied into the project (not installed as a dependency), giving you full control over styling and behavior. Components live in `src/components/ui/`.

### Common Components

- **Button** — Primary, secondary, outline, ghost, and destructive variants
- **Input** / **Textarea** — Form inputs with label and error states
- **Select** — Dropdown selection with search support
- **Dialog** — Modal dialogs for confirmations and forms
- **Table** — Data tables with sorting and pagination
- **Card** — Content containers
- **Badge** — Status indicators
- **Toast** — Notification messages

## Forms

Forms are built with React Hook Form using the `Controller` component for integration with shadcn/ui inputs. Complex forms use `useFieldArray` for dynamic field lists.

## Adding New Components

```bash
npx shadcn@latest add [component-name]
```
