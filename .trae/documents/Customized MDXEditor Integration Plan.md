## Objective

- Remove the inline controls under the avatar (Avatar URL input, file input, helper text div, and Upload & Apply button), keeping the new modal-based upload flow and existing layout.

## Changes

- In `src/app/admin/profile/settings/page.tsx` delete these elements within the avatar column:
  - Avatar URL input at `page.tsx:190-196`

  - File input at `page.tsx:197-227`

  - Helper text div at `page.tsx:228-230`

  - Upload & Apply button and error message at `page.tsx:231-268`

## Preserve

- Clickable avatar `div` with `role="button"` and keyboard handlers (`Enter`/`Space`) opening `ImageUploadDialog`.

- Dialog-driven flow for selecting, validating, uploading, attaching, and saving the avatar.

- Fallback initials rendering and avatar sizing (`object-cover`, `h-20 w-20`).

- State used by the dialog: `selectedFile`, `previewSrc`, `uploadError`, `dialogOpen`, `statusText`.

## Validation

- After removal, confirm:
  - Modal opens on avatar click.

  - Upload via dialog works and updates the avatar without any leftover inline controls.

  - Layout around the avatar remains intact (flex column spacing preserved).

## Notes

- No impact to other form fields (email, username, profile details).

- No changes to API clients or hooks; only UI cleanup.
