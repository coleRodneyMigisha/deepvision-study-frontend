# StudyRoom Frontend — Multi-Course Interactive Study Platform

Static frontend deployed on Cloudflare Pages supporting:
- **Computer Vision & Deep Learning (`CSC3104`)** (`courses/cv.js`)
- **Data Science: Systems & Technologies (`DSC3103`)** (`courses/ds.js`)
- **AI Model Deployment & Scaling (`CSC3119`)** (`courses/ai.js`)
- **Course Registry & Daily Seeded Challenge Engine** (`courses/registry.js`)

Styled with a warm, editorial Preporium-inspired aesthetic (`preporium.com`) utilizing Space Grotesk, IBM Plex Sans, and IBM Plex Mono.

## Adding a New Course Unit
1. Create `courses/<course_id>.js` exporting `window.COURSE_<ID>`.
2. Include `<script src="courses/<course_id>.js"></script>` in `index.html`.
3. Add `window.COURSE_<ID>` to `window.STUDY_COURSES` in `courses/registry.js`.

## Deploying on Cloudflare Pages
- Pushing to `main` automatically deploys via the Cloudflare Pages Git integration (Build command: none, Output directory: `/`).
- Or deploy manually via Wrangler:
  ```bash
  npx wrangler pages deploy . --project-name=deepvision-study
  ```
