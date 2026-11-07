# QuizCorner — Standalone GitHub Pages Version

This is a static HTML, CSS and JavaScript version of QuizCorner. It does **not** connect to Supabase, a database, a login provider, or any other backend service. It is suitable for GitHub Pages.

## Included features

- Home page and seven creator profiles
- Creator directory with quiz availability status
- One published 20-question quiz for Priyabrat Mohanty: **Cell – The Fundamental Unit of Life**
- Quiz timer, question palette, previous/next navigation and submission confirmation
- Automatic marking and instant result page
- Correct-answer review after submission
- Results history saved in the current browser
- Responsive layout for phones, tablets and computers

## Removed

- Supabase integration and configuration
- Leaderboard pages and leaderboard navigation
- “Add Your Creator Name” / creator request section
- Database login and online account features

## Publish on GitHub Pages

1. Download and extract this ZIP file.
2. Open your GitHub repository, or create a new repository for this standalone version.
3. Upload the **contents** of the `QuizCorner_Standalone` folder to the repository's root. Make sure `index.html` is directly in the root, not inside another nested folder.
4. Open **Settings → Pages**.
5. Under Build and deployment, choose **Deploy from a branch**, select branch `main` and folder `/ (root)`, then save.
6. Open the GitHub Pages URL after deployment finishes.

No build command, package installation, API key, or configuration file is required.

## Creator details

Edit `data/creators.json` to change names, subjects, topics and introductions. The seven creator IDs should remain `creator-01` through `creator-07`, because those IDs connect each profile to its quiz file.

Current creator list:

1. Priyabrat Mohanty
2. Priyadarshan Patra
3. Umesh Kumar Behera
4. Darshan Kumar Nayak
5. Subhashree Subhalaxmi
6. Sonali Dalei
7. Creator 07 (placeholder — replace this name when ready)

## Add or replace creator photos (visible to every visitor)

Creator photos are stored as ordinary image files in `assets/images/creators/`. There is **no browser upload control**. This keeps the photo consistent across the entire website: every visitor sees the same image.

The `image` paths are already configured in `data/creators.json`. Upload each image with the matching filename:

| Creator | Image file to upload |
|---|---|
| Priyabrat Mohanty | `assets/images/creators/creator-01.jpg` |
| Priyadarshan Patra | `assets/images/creators/creator-02.jpg` |
| Umesh Kumar Behera | `assets/images/creators/creator-03.jpg` |
| Darshan Kumar Nayak | `assets/images/creators/creator-04.jpg` |
| Subhashree Subhalaxmi | `assets/images/creators/creator-05.jpg` |
| Sonali Dalei | `assets/images/creators/creator-06.jpg` |
| Creator 07 | `assets/images/creators/creator-07.jpg` |

### Upload using GitHub (Android or computer)

1. Open your GitHub repository and enter `assets` → `images` → `creators`.
2. Choose **Add file → Upload files**.
3. Select the creator's portrait photo.
4. Rename the file to the exact matching name from the table above (for example, `creator-01.jpg`).
5. Commit the change to the `main` branch.
6. Wait for GitHub Pages to deploy, then refresh the website.

Use a clear, square portrait image in JPG format. PNG and WebP are also supported, but if you use a different extension, update that creator's `image` value in `data/creators.json` to match the exact filename. Image filenames are case-sensitive. The same image will then appear on the home-page featured creator card, creator directory card and individual creator profile.

If no photo file has been uploaded yet, the website displays the creator's initials instead.

## Add a quiz for another creator

For example, to publish a quiz for Creator 02:

1. Add the questions to `data/quizzes/creator-02.json`.
2. Add its correct answers to `data/answer-keys/creator-02.json` using question IDs such as `q1`, `q2`, etc. and answer letters `A`, `B`, `C` or `D`.
3. In `data/creators.json`, set Creator 02's `quizEnabled` to `true`.
4. In `data/quizzes/creator-02.json`, set `isPublished` to `true`, and ensure `totalQuestions`, `totalMarks`, `questions` and `answerKeyFile` are correct.

Keep the question IDs identical between the quiz file and answer-key file. Every question should have four options with keys A, B, C and D.

## Important limitations of a no-backend website

This version is designed for simple practice quizzes. It has no server or database, so:

- The answer-key JSON files are publicly downloadable by anyone who knows their paths. Do not use this for high-stakes or secure examinations.
- Results history is stored only in the browser's local storage. It does not sync between devices or browsers and can be cleared by the user.
- There is no central student account, shared result database, admin dashboard, or cross-device reporting.
- There is no global leaderboard. The leaderboard was removed as requested.

The existing Supabase project and current QuizCorner repository are not changed by this ZIP. This is a separate replacement package that you can upload to a new repository or use to replace the current site's files when you are ready.
