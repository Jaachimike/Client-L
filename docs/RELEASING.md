# Releasing

The steps to publish a version, in order. Steps 1 to 3 are only needed for the first release.

## 1. Publish the repository

1. Create a public GitHub repository (for example `client-l`).
2. `git remote add origin <url>` and `git push -u origin main`.
3. Check that the **CI** workflow passes on GitHub.
4. Replace `<!-- REPOSITORY_URL -->` in `README.md` with the repository URL.

## 2. Build the template sheet

The template must contain **no data and no email addresses**, because everyone who copies it
gets its contents.

1. Sign in with the Google account that will own the template. A separate account is best, so
   your own sheets never share a Drive with it.
2. From a clean clone, run `npx clasp create --type sheets --title "Client-L" --rootDir dist`
   and `npm run push`.
3. Open the new sheet. **Do not run Set up** and do not add sample data: each person who copies it
   runs setup themselves, which adds their own email to their own copy.
4. Check that the sheet has a single empty tab and that **Extensions > Apps Script** shows the code.
5. **Share > General access > Anyone with the link > Viewer.**
6. Copy the sheet link and change the ending from `/edit…` to `/copy`. Opening that link offers
   **Make a copy** straight away.
7. Replace `<!-- TEMPLATE_COPY_LINK -->` in `README.md` with a Markdown link to it, and remove the
   "link added at release" note.

## 3. Test on a fresh Google account

Use an account that has never seen the app, in a private window. Time it: it should take under
10 minutes.

- [ ] The copy link offers **Make a copy**, and the copy opens with the **Client-L** menu.
- [ ] **Set up this sheet** asks for the three permissions in the README, then creates the Clients,
      Tasks, Contracts, Subscriptions, Transactions and Settings tabs.
- [ ] The `Allowed emails` setting contains only the test account's email.
- [ ] Running **Set up this sheet** a second time adds nothing (no duplicate tabs, headers or settings).
- [ ] **Add sample data** fills every tab; **Clear sample data** removes it and leaves a record you
      added yourself.
- [ ] Deploying as a web app and opening the URL shows the Dashboard.
- [ ] Opening the URL signed out asks for Google sign-in; a different account sees "Access denied".
- [ ] The README steps matched what you saw; fix any wording that did not.

## 4. Tag the release

The examples use `1.0.0`; use the new version number each time.

1. Set the version in `package.json` (and `package-lock.json`) with
   `npm version 1.0.0 --no-git-tag-version`. Skip this if it is already right. The app shows this
   number under **Settings > About**.
2. In `CHANGELOG.md`, rename `## [Unreleased]` to `## [1.0.0] - YYYY-MM-DD` and add a new empty
   `## [Unreleased]` above it. If `appsscript.json` changed (for example a new permission), say so
   under a **Permissions** heading, because people updating by hand will be asked to approve it.
3. Commit: `chore: release v1.0.0`.
4. `git tag v1.0.0` and `git push origin main v1.0.0`.
5. The **Release** workflow then runs on the tag. It checks that the tag matches `package.json`,
   runs every check, builds the app, and creates the GitHub release with `Code.js`, `index.html`
   and `appsscript.json` attached. Those are the files the README's "Updating without code" steps
   use. Wait for it to pass, then edit the release notes on GitHub and paste in the CHANGELOG
   section.
6. Update the template sheet with `npm run push` from the tagged commit, so new copies get the
   released code. Do not run setup on the template.
7. Optional: follow "Updating without code" on a test copy made from the previous release, to
   check the update path still works.
