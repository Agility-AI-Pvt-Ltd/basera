# Home screen images

Drop your own JPG/PNG files here using **exact filenames** below. The app bundles these locally (no internet needed).

## Folder structure

```
assets/images/home/
├── avatar-default.jpg       ← default user avatar (header + profile)
├── categories/
│   ├── dogs.jpg
│   ├── cats.jpg
│   ├── birds.jpg
│   └── fishes.jpg
└── pets/
    ├── golden-retriever.jpg
    ├── labrador.jpg
    ├── beagle.jpg
    ├── husky.jpg
    └── poodle.jpg
```

## Recommended sizes

| File | Used on | Size | Notes |
|------|---------|------|-------|
| `avatar-default.jpg` | Home header, Profile | **200×200** | Square; shown as circle |
| `categories/*.jpg` | Home categories row | **400×400** | Square; cropped to circle |
| `pets/golden-retriever.jpg` | Home featured card | **800×900** | Portrait, 4:5-ish |
| `pets/labrador.jpg` | Home featured card | **800×900** | Portrait |
| `pets/beagle.jpg` | Home featured card | **800×900** | Portrait |
| `pets/husky.jpg` | Saved tab | **600×600** | Square thumbnail |
| `pets/poodle.jpg` | Saved tab | **600×600** | Square thumbnail |

## Formats

- **JPG or PNG** (JPG preferred for photos)
- Keep files under ~500 KB each for fast loads

## After replacing files

Restart Metro with a clean cache so bundler picks up new assets:

```bash
pnpm dev:mobile
# or: npx expo start --clear
```

Image paths are registered in `assets/images/home/manifest.ts` — keep filenames there in sync if you rename files.

## User profile photo (later)

When you add real profile uploads, that will come from Supabase storage — not this folder. This `avatar-default.jpg` is only the placeholder until the user sets a photo.
