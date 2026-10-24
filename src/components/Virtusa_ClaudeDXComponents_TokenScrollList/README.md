# Token Scroll List (`Virtusa_ClaudeDXComponents_TokenScrollList`)

A Constellation DX widget that shows an infinite-scrolling table for third-party APIs that page with a **continuation token** (for example `nextIdentifier` → `startIdentifier`) instead of a page number or offset.

|            |                                                                                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| Type       | Widget — `PAGE` and `CASE` (landing pages and the case Utilities pane)                                          |
| Library    | `ClaudeDXComponents` (organization `Virtusa`)                                                                   |
| Built with | DX Component Builder `@pega/custom-dx-components@~26.1.11` (library mode), Cosmos `@pega/cosmos-react-core` 9.5 |
| Target     | Pega Infinity '26 (for other releases, rebuild with the matching builder version — see Part 5)                  |

> **Want to use this component in your own application?** Follow [Part 5 — Use this component in your own Pega application](#part-5--use-this-component-in-your-own-pega-application) for a step-by-step guide, from cloning this repo to adding the widget to a case type.

> **Want to try it end-to-end against a live API first?** See [Part 4 — Use with a real-time API](#part-4--use-with-a-real-time-api-wikipedia-recent-changes). It walks through a free, public, no-login API with the same continuation-token pattern.

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

> **On Pega Infinity '26** the builder works in **library mode**, and a published library must also be **enabled for your application** before it appears in Studio. [Part 5](#part-5--use-this-component-in-your-own-pega-application) has the complete '26 procedure.

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

## Part 4 — Use with a real-time API (Wikipedia Recent Changes)

This walkthrough connects the widget to a **live, public API** so you can see the whole token chain working in Pega before wiring up your own service. It uses Wikipedia's Recent Changes API (the MediaWiki Action API):

- **Free, no login, no API key**: a plain `GET` request.
- **Continuation-token paging**, the same pattern as the APIs this widget targets.
- **Date-range filtering**, the equivalent of `fromDate` / `toDate`.
- **A clear last page**: the token disappears when there is nothing more to read.
- **Real-time data**: edits made seconds ago appear at the top.

### How it maps to the pattern

| Generic token API (this widget's design) | Wikipedia Recent Changes                                      |
| ---------------------------------------- | ------------------------------------------------------------- |
| Request token `startIdentifier`          | Query parameter `rccontinue`                                  |
| Request page size `maxRecords`           | Query parameter `rclimit` (1–500)                             |
| `fromDate` (older bound)                 | Query parameter **`rcend`**                                   |
| `toDate` (newer bound)                   | Query parameter **`rcstart`**                                 |
| Response `header.nextIdentifier`         | `continue.rccontinue`, e.g. `20261023055908\|2082266677`      |
| Response `header.isLastPage`             | No flag: the `continue` object is **absent** on the last page |
| Response `data.entries`                  | `query.recentchanges`                                         |

> **Watch the date names.** Recent changes are listed newest first, so `rcstart` is the **newer** timestamp and `rcend` is the **older** one: `rcstart = toDate`, `rcend = fromDate`. Swapping them returns nothing.

> **Never send an empty token.** On the first request, leave `rccontinue` out completely. `rccontinue=` (empty) returns a `badcontinue` error.

### Step 0 — See it live in Storybook (no Pega needed)

The quickest way to watch the widget run against this API is the Storybook story, which needs only this repo and an internet connection:

```bash
npm install
npm run startStorybook
```

Open http://localhost:6040. Storybook opens straight on **Live API — Wikipedia**, the first story under **VirtusaClaudeDxComponentsTokenScrollList**:

| Story                              | What it shows                                                                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Live API — Wikipedia** (default) | Real English Wikipedia edits from the 15 minutes before the page loaded. Scroll to keep pulling 50-row chunks; this usually runs to hundreds of rows. |
| **Live API — last 2 minutes**      | Only the last 2 minutes. Usually 1–3 chunks, then the token runs out and the footer shows _All N records loaded_.                                     |

In Storybook, [`liveApi.ts`](liveApi.ts) stands in for Pega. It calls Wikipedia directly from the browser (the API allows this with `origin=*`) and does exactly what the data page and data transforms in Steps 3–6 do:

- **Request:** `startIdentifier` → `rccontinue` (left out when empty), `maxRecords` → `rclimit`, `toDate` → `rcstart`, `fromDate` → `rcend`.
- **Response:** `continue.rccontinue` → `NextIdentifier`, `query.recentchanges` → `Entries`, `IsLastPage` = no token. API errors returned with HTTP 200 become a thrown error, so the widget shows _Try again_.

Open the browser's developer tools on the **Network** tab and filter on `api.php`. Each scroll sends one request whose `rccontinue` is the token from the previous response, and the date window stays the same throughout. The browser calls Wikipedia directly, so a corporate proxy that blocks `en.wikipedia.org` will make these stories show an error.

> Verified in Chrome: the 15-minute story grew 50 → 100 → 150 → 200 rows as it was scrolled, each request carrying the previous `rccontinue`, and the 2-minute story stopped at _All 85 records loaded_.

### Step 1 — Try the API outside Pega

Before building anything in Pega, confirm the API works from your machine. Replace the dates with a window from **today** (Recent Changes keeps roughly the last 30 days).

```bash
# First chunk: no rccontinue
curl -s -A "PegaDXTest/1.0 (you@example.com)" \
  "https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&list=recentchanges&rctype=edit&rcnamespace=0&rcprop=title%7Ctimestamp%7Cuser%7Ccomment%7Csizes%7Cids&rclimit=50&rcstart=2026-10-23T06:00:00Z&rcend=2026-10-23T05:58:00Z"

# Next chunk: pass continue.rccontinue from the previous response (URL-encode the "|" as %7C)
curl -s -A "PegaDXTest/1.0 (you@example.com)" \
  "https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&list=recentchanges&rctype=edit&rcnamespace=0&rcprop=title%7Ctimestamp%7Cuser%7Ccomment%7Csizes%7Cids&rclimit=50&rcstart=2026-10-23T06:00:00Z&rcend=2026-10-23T05:58:00Z&rccontinue=20261023055908%7C2082266677"
```

When this was verified, a 2-minute window returned **3 chunks: 50, 50 and 21 records**. The third response had no `continue` object, which is how the last page is signalled.

Sample response (trimmed). Use it as the sample in the Integration wizard:

```json
{
  "batchcomplete": true,
  "continue": { "rccontinue": "20261023065540|2082272909", "continue": "-||" },
  "query": {
    "recentchanges": [
      {
        "type": "edit",
        "ns": 0,
        "title": "Derek Wood (author)",
        "pageid": 5462816,
        "revid": 1381548072,
        "old_revid": 1253780561,
        "rcid": 2082272920,
        "user": "Entranced98",
        "oldlen": 3481,
        "newlen": 3518,
        "timestamp": "2026-10-23T06:55:49Z",
        "comment": "Importing Wikidata short description"
      }
    ]
  }
}
```

### Step 2 — Make sure Pega can reach the API

- The Pega server needs outbound HTTPS access to `en.wikipedia.org`. On Pega Cloud this is normally open. On-premises, check the proxy and firewall rules.
- Wikimedia's [User-Agent policy](https://meta.wikimedia.org/wiki/User-Agent_policy) asks every client to send a descriptive `User-Agent` with contact details. Requests without one may be blocked. You will add this header in Step 3.

### Step 3 — Create the REST connector

In Dev Studio, open the REST integration wizard (**Configure → Integration → Connectors → Create REST integration**; menu names vary slightly by version).

1. **Endpoint URL:** `https://en.wikipedia.org/w/api.php`
2. **Method:** `GET`
3. **Query string parameters.** Add these constant values:

   | Name            | Value                                         |
   | --------------- | --------------------------------------------- |
   | `action`        | `query`                                       |
   | `format`        | `json`                                        |
   | `formatversion` | `2`                                           |
   | `list`          | `recentchanges`                               |
   | `rctype`        | `edit`                                        |
   | `rcnamespace`   | `0` (articles only)                           |
   | `rcprop`        | `title\|timestamp\|user\|comment\|sizes\|ids` |

   Add these **dynamic** parameters, mapped from properties on the request page (set in Step 5): `rclimit`, `rcstart`, `rcend`, `rccontinue`.

4. **Request header:** `User-Agent` = `PegaDXTest/1.0 (your-email@your-company.com)`.
5. **Response:** paste the sample response from Step 1 so the wizard generates the data model, e.g. `ORG-App-Int-Wikipedia-RecentChanges` with `continue` and `query.recentchanges` (a page list).
6. Finish the wizard. Use **Test** on the generated `Connect-REST` rule to confirm a 200 response.

### Step 4 — Create the chunk data class and data page

Create the class the widget reads. This is the same model as Part 1:

| Class                               | Property                                                                             | Type                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------- |
| `ORG-App-Data-WikiChangeChunk`      | `Entries`                                                                            | Page List of `ORG-App-Data-WikiChange` |
|                                     | `NextIdentifier`                                                                     | Text                                   |
|                                     | `IsLastPage`                                                                         | True/False                             |
| `ORG-App-Data-WikiChange` (records) | `title`, `user`, `comment`, `timestamp` (Text); `newlen`, `oldlen`, `rcid` (Integer) | One row in the table                   |

Create data page **`D_WikiRecentChanges`**:

| Setting    | Value                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------ |
| Structure  | **Page**                                                                                         |
| Class      | `ORG-App-Data-WikiChangeChunk`                                                                   |
| Mode       | Read-only                                                                                        |
| Scope      | Thread (or Requestor)                                                                            |
| Parameters | `startIdentifier` (Text), `maxRecords` (Integer), `fromDate` (Text), `toDate` (Text)             |
| Source     | Connector → the `Connect-REST` rule from Step 3, with the request/response data transforms below |
| Refresh    | Reload once per interaction                                                                      |

### Step 5 — Request data transform

Map the data page parameters onto the connector's request:

| Action | Target                | Source                  | Condition                       |
| ------ | --------------------- | ----------------------- | ------------------------------- |
| Set    | `.request.rclimit`    | `Param.maxRecords`      | —                               |
| Set    | `.request.rcstart`    | `Param.toDate`          | — (newer bound, see note above) |
| Set    | `.request.rcend`      | `Param.fromDate`        | — (older bound)                 |
| When   |                       |                         | `Param.startIdentifier != ""`   |
| ↳ Set  | `.request.rccontinue` | `Param.startIdentifier` | only inside the When            |

Do **not** set `rccontinue` to `""` on the first call; leave it unset. Your generated request property names may differ from `.request.*`, so use what the wizard created.

### Step 6 — Response data transform

Map the API response onto the chunk page the widget reads:

| Action      | Target            | Source                                                                                                                 |
| ----------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Set         | `.NextIdentifier` | `.response.continue.rccontinue`                                                                                        |
| Set         | `.IsLastPage`     | `false`                                                                                                                |
| When        |                   | `.response.continue.rccontinue` is blank (no token returned)                                                           |
| ↳ Set       | `.IsLastPage`     | `true`                                                                                                                 |
| Append each | `.Entries`        | each page in `.response.query.recentchanges` → map `title`, `user`, `comment`, `timestamp`, `newlen`, `oldlen`, `rcid` |

Wikipedia returns API errors with HTTP 200 and an `error` object (for example `{"error":{"code":"badcontinue",...}}`). Add a **When** `.response.error.code` is not blank → **Page-Add-Message** with `.response.error.info`. The data page then fails, and the widget shows the message with **Try again** instead of an empty list.

### Step 7 — Test the data page in Dev Studio

1. Open `D_WikiRecentChanges` → **Actions → Run**. Use `startIdentifier` empty, `maxRecords` `50`, and a 2-minute window from today for `fromDate`/`toDate`.
2. Check the result: `Entries` has 50 rows and `NextIdentifier` holds a token such as `20261023055908|2082266677`.
3. Run again with that token as `startIdentifier`. You should get the next 50 rows with no overlap.
4. Keep going until `NextIdentifier` is empty and `IsLastPage` is `true`.

If the first run returns `badcontinue`, the connector is sending an empty `rccontinue`. Use **Tracer** to inspect the outgoing URL and fix the When condition from Step 5.

### Step 8 — Configure the widget

Publish the component (Part 2), add it to a landing page or a case's Utilities pane (Part 3), and set:

| Property              | Value                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| Heading               | `Wikipedia — live edits`                                                                             |
| Data page name        | `D_WikiRecentChanges`                                                                                |
| Columns               | `timestamp:Time:datetime, title:Article, user:Editor, comment:Summary, newlen:Size:number`           |
| Records per request   | `50`                                                                                                 |
| List height           | `Medium`                                                                                             |
| Additional parameters | `{"fromDate":"2026-10-23T05:58:00Z","toDate":"2026-10-23T06:00:00Z"}`, using a window from **today** |
| Token mapping         | leave the defaults (`startIdentifier`, `maxRecords`, `Entries`, `NextIdentifier`, `IsLastPage`)      |

### Step 9 — Verify the token chain in the browser

Open the page with the browser's developer tools on the **Network** tab:

1. The first data view request carries `startIdentifier: ""`, and the table shows 50 rows with the header `50+`.
2. Scroll down. A second request carries `startIdentifier: "2026…|…"`, the token from the first response, and 50 more rows are appended.
3. The third request returns 21 rows, the footer reads **All 121 records loaded**, and no more requests are sent. (Counts depend on how busy Wikipedia was in your window.)
4. Click **Refresh**. The next request goes back to `startIdentifier: ""`.

For a long, continuous scroll, widen the window to an hour or a whole day. English Wikipedia records thousands of edits per hour.

### Switching to your real API

Once this works, swap in your own service:

1. Replace the connector with your API (POST body instead of query string is fine).
2. Map the token, page size and date parameters in the request data transform. Again, send the token only when it isn't empty.
3. Map your response's next token, last-page flag and entries in the response data transform (for the sample API in [Why this exists](#why-this-exists): `header.nextIdentifier`, `header.isLastPage`, `data.entries`).
4. Point the widget's _Data page name_ at the new data page. If you kept the same parameter and property names, nothing else changes.

### Etiquette and limits

- Keep _Records per request_ at 50–100 and only scroll as far as you need. Anonymous Wikipedia API use is free but shared.
- Editor names in the results are real, public Wikipedia usernames.
- Data older than about 30 days isn't available from Recent Changes, so always test with recent dates.

---

## Part 5 — Use this component in your own Pega application

A step-by-step guide for taking this component from [github.com/atanus1502/DXComponents](https://github.com/atanus1502/DXComponents) and using it in **your** Pega application. It assumes Pega Infinity '26 — for other releases see [Other Pega versions](#other-pega-versions).

**You will end up with:** a DX Component Builder project on your machine containing this widget, the widget published to your Pega instance as a component library, enabled for your application, and added to a case type.

### What you need

| On your machine                                               | In Pega                                                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Git 2.30+                                                     | Pega Infinity '26 with a Constellation application                                                |
| Node.js **24.4.1+** and npm **11.4.2+** (`node -v`, `npm -v`) | An operator with developer rights in that application (the default access group must point to it) |
| A code editor (VS Code recommended)                           | An **unlocked** ruleset version on the application's stack to publish into (not a branch ruleset) |
|                                                               | The OAuth 2.0 client registration **DX-ComponentDev** (step 4 shows how to import it)             |

### Step 1 — Create a DX Component Builder project

The builder version must match your Pega version. For Infinity '26:

```bash
mkdir -p ~/Projects && cd ~/Projects       # any folder without spaces in the path
npx @pega/custom-dx-components@~26.1.11 init
```

Answer the prompts:

| Prompt               | Enter                                                                          |
| -------------------- | ------------------------------------------------------------------------------ |
| Project name         | e.g. `mydxcomponents` (lowercase, no spaces)                                   |
| Organization name    | **`Virtusa`** — keep this so the component keeps its name (see the note below) |
| Description / Author | anything                                                                       |

Then `cd mydxcomponents`. Init runs `npm install` for you.

> **Why `Virtusa`?** A component's name is `<Organization>_<Library>_<Component>`, and the builder checks that `config.json` matches the project. Using organization `Virtusa` and library `ClaudeDXComponents` lets you use the folder exactly as it is. To use your own names instead, see [Renaming to your own organization](#renaming-to-your-own-organization).

### Step 2 — Copy the component from GitHub

```bash
# from any folder outside your project
git clone https://github.com/atanus1502/DXComponents.git
```

Copy into your project's `src/components/` folder:

| From the clone                                                              | To your project                                                     |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `src/components/Virtusa_ClaudeDXComponents_TokenScrollList/` (whole folder) | `src/components/Virtusa_ClaudeDXComponents_TokenScrollList/`        |
| `src/components/shared/create-nonce.ts`                                     | `src/components/shared/create-nonce.ts` (skip if it already exists) |

```bash
cp -R DXComponents/src/components/Virtusa_ClaudeDXComponents_TokenScrollList mydxcomponents/src/components/
mkdir -p mydxcomponents/src/components/shared
cp -n DXComponents/src/components/shared/create-nonce.ts mydxcomponents/src/components/shared/
```

The widget itself only depends on packages that every DX project already has: `@pega/cosmos-react-core`, `react` and `styled-components`. `mock.ts` and `liveApi.ts` are used only by Storybook and the tests, not by the published widget.

### Step 3 — Check it works locally (no Pega needed)

**3a. Add the Jest polyfill.** Cosmos 9 uses two browser APIs, `Highlight` and `matchMedia`, that Jest's jsdom doesn't provide. Create `jest.polyfills.ts` in the project root:

```ts
// Runs before setupFiles.ts so @pega/cosmos-react-core 9.x can load under jsdom.
class HighlightPolyfill extends Set<unknown> {}
Object.assign(globalThis, { Highlight: HighlightPolyfill });

const cssGlobal = globalThis as typeof globalThis & { CSS?: { highlights?: Map<string, unknown> } };
if (!cssGlobal.CSS) {
  Object.assign(globalThis, { CSS: { highlights: new Map() } });
} else if (!cssGlobal.CSS.highlights) {
  Object.defineProperty(cssGlobal.CSS, 'highlights', { value: new Map(), configurable: true });
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })
});

export {};
```

and load it first in `jest.config.cjs`:

```js
setupFiles: ['./jest.polyfills.ts', './setupFiles.ts'],
```

**3b. Run the checks:**

```bash
npm run lint                 # expect no errors in the component
npx jest src/components/Virtusa_ClaudeDXComponents_TokenScrollList
npm run startStorybook       # http://localhost:6040
```

Storybook opens on **Live API — Wikipedia**, real data paged with a continuation token, so you can see the widget working before you touch Pega.

### Step 4 — Prepare Pega (one time)

1. **OAuth client registration.** In Dev Studio, check that **Records → Security → OAuth 2.0 Client Registration → DX-ComponentDev** exists. If it doesn't, import `keys/DX-ComponentDev.zip` from your project via **Configure → Application → Distribution → Import**.
2. **Ruleset.** Choose an **unlocked** ruleset version that is on your application's ruleset stack, for example your application's own ruleset (`MyApp:01-01-01`), or create a new one such as `CustomDXComponents:01-01-01` and add it to the application rule's **Application rulesets**.
3. If you changed the application's rulesets, **log out of Studio and back in** so your session picks up the new stack.

### Step 5 — Point the project at your Pega server

Edit `tasks.config.json` in your project:

```jsonc
{
  "server-config": {
    "server": "https://<your-host>/prweb",
    "rulesetName": "<RulesetFromStep4>",
    "rulesetVersion": "01-01-01",
    "sourceOfComponents": "Server",
    "devBuild": false,
    "grantType": "authCode", // browser login — no password stored in the file
    "clientId": "10095186356008396159" // the DX-ComponentDev client
  },
  "component": { "library": "ClaudeDXComponents" },
  "libraryModeCL": true
}
```

> Never commit real passwords or client secrets. With `authCode` the `user`, `password` and `clientSecret` fields stay empty.

### Step 6 — Create the component library

In library mode, components are published as part of a **library**. Create it once:

> **Commit or back up your project first.** `createLib` can reset top-level project files (for example `README.md` and config files) to the builder's template, even when you choose to keep your current configuration.

```bash
git init && git add -A && git commit -m "before createLib"   # if not already a git repo
npm run createLib
```

| Prompt                                       | Answer                                                        |
| -------------------------------------------- | ------------------------------------------------------------- |
| Ok to continue?                              | `Y`                                                           |
| Enter library name                           | `ClaudeDXComponents`                                          |
| Enter version                                | `1.0.0`                                                       |
| Current config changes or original defaults? | **`Current`** (option 1)                                      |
| Would you like to update your code?          | `Y` — moves `create-nonce` into `shared/` and updates imports |

Afterwards, run `git status` and restore anything the builder changed that you want to keep.

### Step 7 — Publish to Pega

```bash
npm run authenticate     # a browser opens: accept the localhost certificate warning, log in to Pega
npm run publish          # confirm the library, then the ruleset name and version from Step 4
```

It prints `Success : Component Library Virtusa_ClaudeDXComponents/<version> successfully created in ruleset <ruleset>`.

> **Library versions are permanent.** After a version is published, the builder can't publish or delete it again. For the next change, create a new version first with `npm run createLibVersion`, choosing **Y** to copy the current components, then publish.

> **Avoiding prompts:** you can drive `createLib`, `createLibVersion` and `publish` from an `input.config.json` file instead of answering prompts. Set `"useInputConfig": true` in `tasks.config.json` and add, for example:
>
> ```json
> {
>   "libraryMode": {
>     "publish": { "okToPublish": true, "ruleSetName": "MyApp", "ruleSetVersion": "01-01-01" }
>   },
>   "standard": {}
> }
> ```

### Step 8 — Enable the library for your application

This is the step that's easy to miss. A published library **doesn't appear in Studio until it's enabled for the application.**

1. In Infinity Studio, search for **`Virtusa_ClaudeDXComponents`**.
2. Open the result of type **Component Library** (expand the row to pick the instance in your ruleset).
3. On the **Components** tab, the first column is headed with your **application name and version** (for example `MyApp:01.01.01`). **Tick the checkbox** next to `Virtusa_ClaudeDXComponents_TokenScrollList`.

The checkbox is **one setting per library for your application**, shared by every version of it. Unticking it on any version hides the widget for all versions.

### Step 9 — Add the widget to a case type

1. Open your case type → **UX** tab → **Full Page View**.
2. Under **Utilities** (or **Summary → Add → Widgets**), click **+ Add**, filter for **Token**, tick **Token Scroll List** and click **Add**.
3. Click the widget's **gear** icon and configure it (see [Configure it](#configure-it)): at least the **Heading** and **Data page name**.
4. **Save** the case type.

For a landing page instead: **Channels** → your portal's landing page → add **Token Scroll List** as a widget.

### Step 10 — Give it data

The widget reads a single-page data page that returns `Entries`, `NextIdentifier` and `IsLastPage`. Build it as described in:

- [Part 1 — Build the data layer in Pega](#part-1--build-the-data-layer-in-pega), for your own API, or
- [Part 4 — Use with a real-time API](#part-4--use-with-a-real-time-api-wikipedia-recent-changes), to test with Wikipedia first.

Then set the widget's **Data page name**, open a case, and scroll the list in the Utilities pane.

### Renaming to your own organization

To publish the widget under your own names (for example `Acme_Widgets_TokenScrollList`):

1. In Step 1, use **your** organization name. In Step 5, use **your** library name.
2. Scaffold an empty widget with the builder, so the schema fields in `config.json` are generated correctly:
   ```bash
   npm run create     # type: Widget, subtype: PAGE & CASE, name: TokenScrollList
   ```
3. Copy every file **except `config.json`** from `Virtusa_ClaudeDXComponents_TokenScrollList/` into the new `Acme_Widgets_TokenScrollList/` folder.
4. In the new folder's `config.json`, replace `label`, `description`, `properties` and `defaultConfig` with the ones from this repo's `config.json`. Keep the generated `name`, `componentKey`, `organization` and `library`.
5. Search and replace the exported component name `VirtusaClaudeDxComponentsTokenScrollList` → `AcmeWidgetsTokenScrollList` in `index.tsx`, `demo.stories.tsx` and `demo.test.tsx`.
6. Run Step 3b again, then continue from Step 6.

### Other Pega versions

| Your Pega                          | Builder to use in Step 1              | Differences                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Infinity '26                       | `@pega/custom-dx-components@~26.1.11` | As above                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Infinity '25 (25.1.x, e.g. 25.1.3) | `@pega/custom-dx-components@~25.1.26` | There is no builder release per Infinity patch: 25.1.26 is the builder for every 25.1.x. Verified on it: Steps 2–3 work unchanged (Cosmos 8.21, Storybook 8.6), lint and type-check are clean, all 26 tests pass, and the component builds. `jest.polyfills.ts` is optional on Cosmos 8 (tests pass with or without it), and `src/globals.d.ts` is not needed because the generated `src/pcore-globals.d.ts` already covers `PCore`. The builder starts in library mode too, so either follow Steps 6–8 as written, or publish in standalone component mode (`"libraryModeCL": false`, then `npm run publish`, which skips Steps 6 and 8). In standalone mode the widget appears straight away in App Studio's widget lists. |

Whatever the version, property formats in `config.json` must be valid for it. Infinity '26 rejects `INTEGER`, `DECIMAL`, `DATE` and `DATETIME`, and this widget uses `NUMBER` for _Records per request_.

---

## Troubleshooting

| Symptom                                                     | Check                                                                                                                                                                                                |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _Configure a data page to load records_                     | _Data page name_ is empty                                                                                                                                                                            |
| _Additional parameters is not valid JSON_                   | Use double quotes: `{"fromDate":"2024-07-12"}`                                                                                                                                                       |
| Only the first chunk ever loads                             | The data page result has no token at the configured _Next token property_ path, or `IsLastPage` is always true. Run the data page in Dev Studio and check the result                                 |
| The same rows repeat                                        | The connector ignores `startIdentifier` — check the request data transform                                                                                                                           |
| 403 / 401 in the browser network tab                        | The access group cannot run the data page through the DX API (see Part 1, step 4)                                                                                                                    |
| _No records found_                                          | The API returned an empty `entries` list for the parameters sent                                                                                                                                     |
| Component not listed in Studio                              | The publish targeted a ruleset version that is not on the application stack, or the version was locked                                                                                               |
| Widget missing from the case type's widget picker ('26)     | The library isn't enabled for the application. Tick the application checkbox on the **Component Library** rule ([Part 5, Step 8](#step-8--enable-the-library-for-your-application))                  |
| _Unknown format 'INTEGER'_ in the widget's configure dialog | An old library version with an invalid property format is still active. Use this repo's current `config.json` (`NUMBER`), publish a new version, and delete the old version's Component Library rule |
| _Given ruleset doesnt exist_ on publish                     | The ruleset in `tasks.config.json` / `input.config.json` doesn't exist. Create it or use an existing unlocked one ([Part 5, Step 4](#step-4--prepare-pega-one-time))                                 |
| Publish sits for minutes                                    | Normal in library mode: the whole library is rebuilt and archived before upload. Don't stop it while it's building                                                                                   |
| Case type shows _SAVE FAILED_ after adding the widget       | Check the error in your own Studio session. Common causes: the case type's view rules are in a locked ruleset version or must be saved through a development branch                                  |
| `ReferenceError: Highlight is not defined` in Jest          | Add `jest.polyfills.ts` ([Part 5, Step 3a](#step-3--check-it-works-locally-no-pega-needed))                                                                                                          |

---

## Develop locally

```bash
npm install
npm run startStorybook      # http://localhost:6040 → opens on Live API — Wikipedia
npm run test                # Jest unit tests
npm run lint
```

Storybook opens on **Live API — Wikipedia**, which runs against the real Wikipedia Recent Changes API through [`liveApi.ts`](liveApi.ts), followed by **Live API — last 2 minutes** (see [Part 4, Step 0](#step-0--see-it-live-in-storybook-no-pega-needed)). The remaining stories use a mock API in [`mock.ts`](mock.ts) that issues `TOKEN_<n>` continuation tokens and works offline. They cover a long scroll (**Mock API — transactions**), a single page, an empty result, an error then retry, inferred columns, a compact utility layout and the not-configured state. Jest never calls the network; the live adapter is tested with a stubbed `fetch`.

| File               | Purpose                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| `index.tsx`        | Widget: token chain, IntersectionObserver loading, Cosmos UI                                         |
| `utils.ts`         | Column parsing, dot-path lookup, parameter parsing                                                   |
| `styles.ts`        | Scroll area and footer styles                                                                        |
| `config.json`      | Property panel definition used by App Studio                                                         |
| `mock.ts`          | Fake token-paged API for Storybook and tests                                                         |
| `liveApi.ts`       | Storybook-only adapter for the live Wikipedia Recent Changes API (not used by the widget at runtime) |
| `demo.stories.tsx` | Storybook stories                                                                                    |
| `demo.test.tsx`    | Jest tests                                                                                           |
| `docs.mdx`         | Storybook Docs tab                                                                                   |
