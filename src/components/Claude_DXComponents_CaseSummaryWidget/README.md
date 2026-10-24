# Claude_DXComponents_CaseSummaryWidget

**Type:** Widget — CASE
**Library:** DXComponents
**Version:** 0.0.1

## Overview

Displays a compact case summary card — case ID, status badge, customer name, and last-updated timestamp — for quick at-a-glance context.

## When to use

Add this widget to the Utilities pane of a case view (App Studio → Case type → UX tab → Full case page → Utilities section) when users need a quick summary of the current case without opening the full case detail.

## Props

| Prop           | Type     | Required | Default        | Description                                         |
| -------------- | -------- | -------- | -------------- | --------------------------------------------------- |
| `label`        | Text     | No       | `Case Summary` | Fallback heading shown when no `caseID` is provided |
| `caseID`       | Text     | Yes      | —              | Case identifier, shown as the card heading          |
| `status`       | Text     | Yes      | —              | Case status label, shown as a color-coded badge     |
| `customerName` | Text     | Yes      | —              | Name of the customer associated with the case       |
| `lastUpdated`  | DateTime | Yes      | —              | ISO datetime the case was last updated              |

## Visual states

- **Default** — typical case data
- **Empty** — no data provided, falls back to the label heading
- **LongContent** — long customer name and status text
- **Resolved** — status badge in the success (green) variant
- **Urgent** — status badge in the urgent (red) variant

## Installation

Published to Pega as a `Rule-UI-Component`. Available in:

- Pega 25 and below: App Studio → Configure view → Fields/Widgets
- Pega 26 and above: Infinity Studio → User Interface → Component Library
