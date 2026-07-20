---
name: part-manifest-registry
description: Use whenever adding a new named object/group to the EngineViewer.tsx scene graph, and before starting any new part, to check what already exists. Maintains a running manifest of every part already modeled (name, parent group, source reference photos, scale basis) so new work composes with prior sessions' geometry instead of silently duplicating, orphaning, or renaming it — directly supporting the user's "never delete, only add" rule at the geometry level. Triggers on "add a new part", "what's already modeled", "did I already build this", or starting any build* addition.
---

# Part Manifest Registry

This project is built incrementally across many sessions, each with no
memory of the others' exact work except what's in the file and in
persistent memory notes. Without a manifest, it's easy to re-add a part
under a slightly different name (creating a duplicate mesh), forget a part
already exists and re-derive its measurements from scratch, or break the
"never delete, only add" rule by accident because an old name wasn't found.
This skill is the registry that prevents that.

## 1. Where the manifest lives

Keep a single running file, e.g. `docs/reference/part-manifest.md` (create
it if it doesn't exist yet — do not treat "it doesn't exist" as license to
skip this, treat it as the first entry). One row per named top-level part or
sub-assembly added to the scene graph:

| name prefix/object | parent group | source photo(s) | scale basis / anchor | added |
|---|---|---|---|---|

Use the object's actual `name` string (the `service-`/`truck-`/`toolbox-`
prefixed name used for raycast routing) as the primary key, not a
description — names are what the code actually checks.

## 2. Before adding anything, check the manifest AND the file

Two checks, both required, before writing a new `build*` addition or a new
named mesh:

1. Grep the manifest for the part name or its parent group.
2. Grep `EngineViewer.tsx` itself for the name-prefix family this part would
   belong to (`service-`, `truck-`, etc.) — the manifest can drift out of
   date, the file is ground truth. If they disagree, trust the file and fix
   the manifest entry, don't silently proceed on the manifest's stale info.

If a part already exists under a different name than what you were about to
create, that's the same part — extend/fix the existing one, don't create a
sibling duplicate. If genuinely unsure whether two similarly-named objects
are duplicates or legitimately distinct parts, say so and ask rather than
guessing.

## 3. Every addition gets a manifest row, same commit/session it's added

Adding geometry without a manifest row is how the registry goes stale and
stops being trustworthy. The row should record enough that a future session
can reuse this part's scale basis (per `photo-anchor-measurement`) without
re-deriving it — at minimum the anchor dimension and its real-world value.

## 4. This registry is additive only, matching the project's actual rule

Never delete or rewrite history in the manifest for a part that still exists
in the scene. If a part is genuinely replaced/reworked, add a new row noting
what superseded what rather than editing the old row away — the manifest's
value is as an audit trail, and an audit trail that gets rewritten isn't one.
