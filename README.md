# Virtusa Claude DX Components

A collection of ready-to-use Constellation DX components (widgets and fields) for Pega Infinity, built with **Claude Code**: scaffolded with the DX Component Builder CLI, then implemented, reviewed in Storybook and published to Pega Infinity.

Use them as they are, or take the source as a starting point for your own components.

| Library version | Branch                                                                                      | Pega Platform  | DX Component Builder |
| --------------- | ------------------------------------------------------------------------------------------- | -------------- | -------------------- |
| 2.x             | [`main`](https://github.com/atanus1502/constellation-dx-components/tree/main)               | Infinity '26.1 | `~26.1.11`           |
| 1.x             | [`release/1.x`](https://github.com/atanus1502/constellation-dx-components/tree/release/1.x) | Infinity '25.1 | `~25.1.26`           |

Use the branch that matches your Pega version. Other Pega versions have not been tested and are not supported.

A live demonstration of every component is available at **[atanus1502.github.io/constellation-dx-components](https://atanus1502.github.io/constellation-dx-components/)**.

Pre-built versions of the component library are attached to each [release](https://github.com/atanus1502/constellation-dx-components/releases).

## Components

| Component                                                                          | Type                 | Description                                                                                                                           |
| ---------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [CaseSummaryWidget](src/components/Virtusa_ClaudeDXComponents_CaseSummaryWidget)   | Widget (CASE)        | Displays case ID, status, customer name and last-updated timestamp                                                                    |
| [PIIRedactor](src/components/Virtusa_ClaudeDXComponents_PIIRedactor)               | Field (Text)         | Redacted display of card numbers, SSNs, phone numbers, emails and generic values, with a masked-input edit mode                       |
| [SLADeadlineTracker](src/components/Virtusa_ClaudeDXComponents_SLADeadlineTracker) | Widget (PAGE)        | Landing-page dashboard of SLA and deadline status across active cases, with click-to-open case links                                  |
| [TokenScrollList](src/components/Virtusa_ClaudeDXComponents_TokenScrollList)       | Widget (PAGE & CASE) | Infinite-scroll table for third-party APIs that page with a continuation token; its README covers the Pega data page setup end to end |

Each component folder has a README with its properties, the data it expects and how to configure it in App Studio.

## Use the components in your Pega application

All components ship as one Constellation component library, `Virtusa_ClaudeDXComponents`. There are two ways to get it into Pega.

### Option A — Publish from source (recommended)

**On your machine**

| Tool          | Version                         | Check                                                 |
| ------------- | ------------------------------- | ----------------------------------------------------- |
| Git           | 2.30+                           | `git --version`                                       |
| Node.js       | 24.x (24.4.1+)                  | `node -v`                                             |
| npm           | 11.4.2+ (comes with Node.js 24) | `npm -v`                                              |
| A web browser | any current one                 | used for the Pega login during `npm run authenticate` |
| A code editor | optional — VS Code recommended  |                                                       |

You also need network access to the npm registry and to your Pega server, and local port **4010** free (the login redirect goes to `https://localhost:4010`). Nothing else is installed globally — the DX Component Builder, Storybook and the test tools come from `npm install`.

**In Pega**: an operator with developer access to your Constellation application, and an **unlocked** ruleset version to publish into (not a branch ruleset).

1. Clone the branch that matches your Pega version. Use `git clone`, not the GitHub "Download ZIP" option: the builder needs the `.git` folder and reports `Git needs to be installed` without it.

   ```shell
   git clone https://github.com/atanus1502/constellation-dx-components.git     # Infinity '26.1
   git clone -b release/1.x https://github.com/atanus1502/constellation-dx-components.git   # Infinity '25.1
   cd constellation-dx-components
   npm install
   ```

   Then copy the builder's `keys` folder into the project. It holds the local HTTPS certificate used by `npm run authenticate`, and `DX-ComponentDev.zip` for step 2. It is not committed to this repository:

   ```shell
   cp -R node_modules/@pega/custom-dx-components/src/tasks/init/template/keys .
   ```

   On Windows (PowerShell): `Copy-Item -Recurse node_modules\@pega\custom-dx-components\src\tasks\init\template\keys .`

2. In Pega, make sure the OAuth 2.0 client registration **DX-ComponentDev** exists (Dev Studio → Records → Security → OAuth 2.0 Client Registration). If not, import `keys/DX-ComponentDev.zip` (Dev Studio → Configure → Application → Distribution → Import), then copy the registration's client ID for step 3.

3. Edit `tasks.config.json` and fill in your server and ruleset:

   ```json
   "server-config": {
     "rulesetName": "YourAppRuleset",
     "rulesetVersion": "01-01-01",
     "server": "https://your-server/prweb",
     "clientId": "<client ID of DX-ComponentDev>",
     "grantType": "authCode",
     ...
   }
   ```

4. Authenticate. A browser window opens for you to log in to Pega:

   ```shell
   npm run authenticate
   ```

5. Publish the library. When asked, confirm the ruleset and choose whether to publish the version as permanent:

   ```shell
   npm run publish
   ```

6. In Pega, enable the library for your application:

   - **Infinity '26:** App Studio → **User Interface → Component Library**, open `Virtusa_ClaudeDXComponents`, and on the **Components** tab tick the checkbox in the column headed `<YourApp>:<version>`.
   - **Infinity '25:** the components appear in App Studio once published.

7. Add a component to your UI: for widgets, open the case type or landing page in App Studio, go to the **UX** tab and add the widget (for example to the case **Utilities** pane). For fields, select the property in a view and choose the component from its **Display as** list.

### Option B — Import a pre-built library

Every [release](https://github.com/atanus1502/constellation-dx-components/releases) has the library archive `Virtusa_ClaudeDXComponents_<version>.arch.zip`. This is the same archive kept in this repository under `store/`, so it is useful when you want a specific version without cloning a branch.

1. Create a DX Component Builder project for your Pega version ([Pega documentation][dx-initialize]):

   ```shell
   npx @pega/custom-dx-components@~26.1.11 init   # Infinity '26.1 — use ~25.1.26 for '25.1
   ```

2. Download the `.arch.zip` from the release into your `Downloads` folder, then run:

   ```shell
   npm run importLibVersion
   ```

   Choose **Local directory**, accept the suggested `Downloads` path (or type the folder you saved the zip to), and select the zip. The components are unpacked into `src/components/` and the library version is set up in `store/`.

3. Continue with steps 3–7 of Option A.

## Use only one component

Every component folder is self-contained: it needs nothing from other folders in this repository. You can take just the one you want, in either of two ways. The examples use TokenScrollList; swap in the folder name of the component you need (see [Components](#components)).

### Way 1 — Clone the project with only that component

Git downloads the project files plus that single component folder:

```shell
git clone --depth 1 --filter=blob:none --sparse https://github.com/atanus1502/constellation-dx-components.git   # add -b release/1.x for Infinity '25.1
cd constellation-dx-components
git sparse-checkout set --no-cone '/*' '!/src/components/*/' '/src/components/Virtusa_ClaudeDXComponents_TokenScrollList/'
npm install
```

Then continue with [Option A](#option-a--publish-from-source-recommended) from the `keys` step. The library you publish contains only that component. If you later want more components on the same Pega server, add their folders (`git sparse-checkout add /src/components/<folder>/`) and publish them under a new library version (`npm run createLibVersion`), because published versions are permanent.

### Way 2 — Import it into your own DX project

Use this when you already have a DX Component Builder project with your own organization and library. The builder's `importComponent` command copies the component in and renames it to your names, for example `<YourOrg>_<YourLib>_TokenScrollList`.

1. Download just the component folder:

   ```shell
   git clone --depth 1 --filter=blob:none --sparse https://github.com/atanus1502/constellation-dx-components.git dx-gallery   # add -b release/1.x for '25.1
   git -C dx-gallery sparse-checkout set src/components/Virtusa_ClaudeDXComponents_TokenScrollList
   ```

2. From your project folder, import it (give the full path to `dx-gallery/src/components`):

   ```shell
   npm run importComponent -- /full/path/to/dx-gallery/src/components Virtusa_ClaudeDXComponents_TokenScrollList
   ```

   It prints `... has been imported as <YourOrg>_<YourLib>_TokenScrollList`. Run `npm run importComponent` without arguments to pick the folder interactively instead.

3. **Infinity '26 projects only** (builder 26.1.x): copy two setup files from this repository so the component's tests and type-check pass. The component builds without them.

   - `jest.polyfills.ts` into your project root, then in `jest.config.cjs` set `setupFiles: ['./jest.polyfills.ts', './setupFiles.ts']`.
   - `src/globals.d.ts` over your `src/globals.d.ts` (it adds the `PConnect` type that the builder's template leaves out).

4. Check, build and publish as usual: `npm run lint`, `npm run test`, `npm run buildAllComponents`, `npm run publish`.

## For developers

### Tools to install

Install Node.js 24.x and npm 11.x from [nodejs.org](https://nodejs.org/en/download/).

For more details on building Constellation DX components, see [docs.pega.com][dx-initialize].

### Project setup

```shell
npm install
```

### Storybook

```shell
npm run start
```

Storybook opens on [localhost:6040](http://localhost:6040). Every component has stories with mocked data; TokenScrollList also has stories that call the live Wikipedia API.

### Linting

Before checking in code, make sure no errors are reported:

```shell
npm run lint
npx tsc --noEmit
```

To fix some of the issues:

```shell
npm run fix
```

### Unit testing

```shell
npm run test
```

For a coverage report (written to `coverage/index.html`):

```shell
npm run coverage
```

### Build

Build all components into the library:

```shell
npm run buildAllComponents
```

To build one component:

```shell
npm run buildComponent
```

### Add a new component

```shell
npm run create
```

Use organization `Virtusa` and library `ClaudeDXComponents`, so the component is named `Virtusa_ClaudeDXComponents_<Name>`. Each component needs `index.tsx`, `config.json`, `mock.ts`, `demo.stories.tsx`, `demo.test.tsx`, `docs.mdx` and a `README.md`.

### Release a new library version

Library versions are permanent once published, so bump the version for every release:

```shell
npm run createLibVersion   # e.g. 2.0.1 — copies the current components into the new version
npm run buildAllComponents
npm run storeLibVersion    # writes store/Virtusa_ClaudeDXComponents/<version>/
```

Commit the new `store/` folder, then attach its `.arch.zip` to a GitHub release named `<version> - Pega <release>`.

### Continuous integration

- **Validate PRs** (`.github/workflows/validatepr.yaml`) runs lint, type-check, unit tests and the Storybook build on every pull request.
- **Deploy to GitHub Pages** (`.github/workflows/deploy-github-pages.yaml`) publishes Storybook to [atanus1502.github.io/constellation-dx-components](https://atanus1502.github.io/constellation-dx-components/) on every push to `main`.

If deploying to Pega fails, see the [DX Component Builder command-line reference][dx-cli].

[dx-initialize]: https://docs.pega.com/bundle/constellation-dx-components/page/constellation-dx-components/custom-components/initialize-project.html
[dx-cli]: https://docs.pega.com/bundle/constellation-dx-components/page/constellation-dx-components/custom-components/command-line-references-constellation-dx-components.html
