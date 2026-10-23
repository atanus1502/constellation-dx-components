# Token Scroll List (`Virtusa_ClaudeDXComponents_TokenScrollList`)

A Constellation DX widget that shows an infinite-scrolling table for third-party APIs that page with a **continuation token** (for example `nextIdentifier` → `startIdentifier`) instead of a page number or offset.

|            |                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------- |
| Type       | Widget — `PAGE` and `CASE` (landing pages and the case Utilities pane)                       |
| Library    | `ClaudeDXComponents` (organization `Virtusa`)                                                |
| Built with | DX Component Builder `@pega/custom-dx-components@~25.1.25`, Cosmos `@pega/cosmos-react-core` |
| Target     | Pega Infinity '25 (rebuild with the matching builder version for other releases)             |

---

## Why this exists

Constellation's table paging requests data by **page number**, and every request is stateless. An API like the one below can only return the next chunk if you send the token from the previous response:

```json
// Response
{ "header": { "nextIdentifier": "TOKEN_51", "recordCount": 50, "isLastPage": false },
  "data":   { "entries": [ ... ] } }

// Next request
{ "maxRecords": 50, "fromDate": "...", "toDate": "...", "startIdentifier": "TOKEN_51" }
```

Storing "the last token" on the server — on a requestor-scoped data page, on `pyWorkPage` or in a data table — is unreliable, because Constellation does not run table paging requests in a shared clipboard context, and a refresh, re-sort or second tab breaks the chain.

This widget keeps the token **in the browser**. It calls a single-page data page with the token from the previous response, appends the returned entries, and repeats as the user scrolls. On the Pega side the data page is a stateless pass-through: each token value is just a different parameter.

```
Browser (widget state)            Pega                         External API
───────────────────────           ────                         ────────────
token = ''          ──► D_TransactionsChunk(startIdentifier='')  ──► POST (no startIdentifier)
rows += Entries     ◄── { Entries, NextIdentifier:'TOKEN_51' }   ◄── header.nextIdentifier
token = 'TOKEN_51'  ──► D_TransactionsChunk(startIdentifier='TOKEN_51') ──► POST startIdentifier=TOKEN_51
...until IsLastPage = true
```

---

## Part 1 — Build the data layer in Pega

These steps are done in Dev Studio. Names are examples — use your own, then configure them in the widget's properties.

### 1. Integration

Create the REST connector for the API with the **Integration wizard** (or reuse an existing one). You need:

- The request body to include `maxRecords`, `fromDate`, `toDate` and, **only when it is not empty**, `startIdentifier`.
- The response mapped into a page so `header.nextIdentifier`, `header.isLastPage` and `data.entries` can be read.

### 2. Data model

Create a data class for one chunk, e.g. `ORG-App-Data-TransactionChunk`, with:

| Property         | Type                                                             | Purpose                                          |
| ---------------- | ---------------------------------------------------------------- | ------------------------------------------------ |
| `Entries`        | Page List of your record class (e.g. `ORG-App-Data-Transaction`) | Records in this chunk                            |
| `NextIdentifier` | Text                                                             | Token for the next chunk (empty on the last one) |
| `IsLastPage`     | True/False                                                       | `true` on the final chunk                        |

Give the record class the properties you want to show as columns (e.g. `transactionId`, `postedDate`, `description`, `amount`, `status`).

### 3. Data page

Create `D_TransactionsChunk`:

| Setting                 | Value                                                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structure               | **Page** (not List)                                                                                                                                  |
| Class                   | `ORG-App-Data-TransactionChunk`                                                                                                                      |
| Mode                    | Read-only                                                                                                                                            |
| Scope                   | Thread or Requestor                                                                                                                                  |
| Parameters              | `startIdentifier` (Text), `maxRecords` (Integer), `fromDate` (Text), `toDate` (Text) — plus any other filters                                        |
| Source                  | Connector → your REST connector                                                                                                                      |
| Request data transform  | Copy the parameters into the request. Set `startIdentifier` only when `Param.startIdentifier != ""`                                                  |
| Response data transform | `.NextIdentifier` ← `header.nextIdentifier`, `.IsLastPage` ← `header.isLastPage`, `.Entries` ← `data.entries` (map each entry into the record class) |
| Refresh strategy        | Reload once per interaction, or a short time-based refresh. The widget also requests with `invalidateCache: true`                                    |

Each token is a distinct parameter value, so each chunk is its own data page instance. **Nothing has to be saved** on the requestor, `pyWorkPage` or a data table.

> **Response shape tip:** if you prefer, skip the dedicated class and return the API's own shape. Then set the widget's response paths to `data.entries`, `header.nextIdentifier` and `header.isLastPage` (dot paths are supported).

### 4. Access

The widget calls the data page through the Constellation DX API (`PCore.getDataPageUtils().getPageDataAsync`). Make sure:

- The data page is in a ruleset on your application stack.
- The operator's access group can run it. If your Pega version restricts which data pages the DX API can call, allow this one and grant the privilege it requires to the access group.

Test it in Dev Studio with **Actions → Run**, giving `startIdentifier` empty and then the returned `NextIdentifier`, before wiring the widget.

---

## Part 2 — Import the component into Pega

DX components are not imported as a file through Dev Studio. The builder **publishes** them into a ruleset, where they become a `Rule-UI-Component` record. From then on they move between environments like any other rule.

### 1. Prerequisites in Pega (one time)

- An **unlocked ruleset version** to publish into (e.g. `CustomDXComponents:01-01-01`) on your application's stack.
- An **OAuth 2.0 Client Registration** for the builder (the `DX-CustomComponents` ruleset ships one). Note its client ID and grant type.
- An operator allowed to publish components.

### 2. Point the project at your environment

This repo is currently in **local-only** mode. Edit `tasks.config.json` in the project root:

```jsonc
"server-config": {
  "server": "https://<your-host>/prweb",
  "rulesetName": "CustomDXComponents",
  "rulesetVersion": "01-01-01",
  "sourceOfComponents": "Server",
  "devBuild": false,
  "grantType": "authCode",          // authCode (browser login) recommended
  "clientId": "<client id from the OAuth record>"
},
"component": { "library": "ClaudeDXComponents" }
```

> Do not commit real passwords or client secrets. With `authCode`, `user`, `password` and `clientSecret` stay empty.

### 3. Build, authenticate, publish

Run from the project root, one at a time (each command asks questions in the terminal):

```bash
npm install                 # first time only
npm run lint                # must report zero errors
npm run test                # all tests must pass
npm run buildComponent      # select Virtusa_ClaudeDXComponents_TokenScrollList, answer N to dev build
npm run authenticate        # a browser opens; log in to Pega
npm run publish             # select the component; confirm the ruleset and version
```

On success, Dev Studio shows `Virtusa_ClaudeDXComponents_TokenScrollList` as a **UI Component** (`Rule-UI-Component`) in the target ruleset.

### 4. Moving to other environments

Publish once to your development environment. To promote it to test or production, include the ruleset in your **product rule / application package** or **Deployment Manager pipeline** like any other rule. You do not need to re-run the builder per environment.

---

## Part 3 — Use it in your application

### Find the component

- **Pega '25 and earlier:** App Studio → open the application → the widget is available wherever widgets can be added (below).
- **Pega '26 and later:** Infinity Studio → **User Interface → Component Library** → _Token Scroll List_.

### Add it to a page or case

- **Landing page (PAGE):** App Studio → **Channels** (or **User Interface → Pages**) → open the landing page → **Add widget** → _Token Scroll List_.
- **Case Utilities pane (CASE):** App Studio → case type → **UX** tab → **Full page view** → **Utilities** region → **Add** → _Token Scroll List_.

### Configure it

| Property                 | Example                                                                                                                  | Notes                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Heading                  | `Card transactions`                                                                                                      | Card title                                                                                                                                      |
| Data page name           | `D_TransactionsChunk`                                                                                                    | The single-page data page from Part 1                                                                                                           |
| Columns                  | `transactionId:Transaction ID, postedDate:Posted:datetime, description:Description, amount:Amount:number, status:Status` | `field:Label:type`, comma-separated. Types: `text`, `number`, `date`, `datetime`, `boolean`. Leave blank to infer columns from the first record |
| Records per request      | `50`                                                                                                                     | 1–500. Sent as the page size parameter                                                                                                          |
| List height              | `Medium`                                                                                                                 | Small / Medium / Large scroll area                                                                                                              |
| Pass case context        | on/off                                                                                                                   | Also sends `CaseInstanceKey` (the current case) to the data page                                                                                |
| Additional parameters    | `{"fromDate":"2024-07-12T06:55:56.871Z","toDate":"2024-08-12T06:55:56.871Z"}`                                            | JSON object of extra data page parameters                                                                                                       |
| **Token mapping** group  |                                                                                                                          | Change only if your names differ from the defaults                                                                                              |
| Token parameter name     | `startIdentifier`                                                                                                        | Data page parameter that receives the token (empty on the first call)                                                                           |
| Page size parameter name | `maxRecords`                                                                                                             | Data page parameter that receives _Records per request_                                                                                         |
| Entries property         | `Entries`                                                                                                                | Path to the record list in the data page result, e.g. `data.entries`                                                                            |
| Next token property      | `NextIdentifier`                                                                                                         | e.g. `header.nextIdentifier`                                                                                                                    |
| Last page flag property  | `IsLastPage`                                                                                                             | e.g. `header.isLastPage`                                                                                                                        |

Save, then open the landing page or a case to see it.

### What users see

- The first chunk loads automatically. Scrolling near the bottom loads the next chunk, and the list keeps filling until it overflows the scroll area.
- A **Load more** button is also available, for keyboard users and browsers without IntersectionObserver.
- The header shows the count so far (`50+`), then the total once the last chunk arrives (_All 240 records loaded_).
- **Refresh** starts again from the first chunk.
- If a request fails, an error appears with **Try again**, which re-sends the **same** token, so no records are skipped or duplicated.

### Behaviour and limits

- Loading stops when the last-page flag is true, the token is empty, or the API returns the same token again (prevents an infinite loop).
- **No column sorting or filtering.** A token chain can only be read forward in the order the API returns it. Filter through _Additional parameters_ (e.g. the date range) instead.
- Tokens often expire on the provider's side. If an old token is rejected, **Refresh** restarts the chain.
- Records are kept in the browser while the widget is open. For very long sessions, keep _Records per request_ sensible and narrow the date range.

---

## Troubleshooting

| Symptom                                   | Check                                                                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _Configure a data page to load records_   | _Data page name_ is empty                                                                                                                                            |
| _Additional parameters is not valid JSON_ | Use double quotes: `{"fromDate":"2024-07-12"}`                                                                                                                       |
| Only the first chunk ever loads           | The data page result has no token at the configured _Next token property_ path, or `IsLastPage` is always true. Run the data page in Dev Studio and check the result |
| The same rows repeat                      | The connector ignores `startIdentifier` — check the request data transform                                                                                           |
| 403 / 401 in the browser network tab      | The access group cannot run the data page through the DX API (see Part 1, step 4)                                                                                    |
| _No records found_                        | The API returned an empty `entries` list for the parameters sent                                                                                                     |
| Component not listed in Studio            | The publish targeted a ruleset version that is not on the application stack, or the version was locked                                                               |

---

## Develop locally

```bash
npm install
npm run startStorybook      # http://localhost:6040 → VirtusaClaudeDxComponentsTokenScrollList
npm run test                # Jest unit tests
npm run lint
```

The Storybook stories use a mock API in [`mock.ts`](mock.ts) that issues `TOKEN_<n>` continuation tokens just like the real service. They cover the default scroll, a single page, an empty result, an error then retry, inferred columns, a compact utility layout and the not-configured state.

| File               | Purpose                                                      |
| ------------------ | ------------------------------------------------------------ |
| `index.tsx`        | Widget: token chain, IntersectionObserver loading, Cosmos UI |
| `utils.ts`         | Column parsing, dot-path lookup, parameter parsing           |
| `styles.ts`        | Scroll area and footer styles                                |
| `config.json`      | Property panel definition used by App Studio                 |
| `mock.ts`          | Fake token-paged API for Storybook and tests                 |
| `demo.stories.tsx` | Storybook stories                                            |
| `demo.test.tsx`    | Jest tests                                                   |
| `docs.mdx`         | Storybook Docs tab                                           |
