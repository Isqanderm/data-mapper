# Changesets

## What are changesets?

Changesets are a way of managing and documenting changes to a monorepo. They allow teams to:

- Document changes with clear descriptions
- Manage versioning across multiple packages
- Automate changelog generation
- Coordinate releases

## Creating a changeset

To create a changeset, run:

```bash
pnpm changeset
```

This will prompt you to:

1. Select which packages have changed
2. Determine the type of change (major, minor, or patch)
3. Write a summary of the change

## Before releasing

Always ensure your changes have accompanying changesets. You can check the status with:

```bash
pnpm changeset status
```
