# Claude_DXComponents_SLADeadlineTracker

**Type:** Widget — PAGE
**Library:** DXComponents
**Version:** 0.0.1

## Overview

A landing-page dashboard widget that shows live SLA/deadline status across active cases — one card per case/SLA pulled from a data page, each with a circular "% used" ring, remaining/overdue time, due date, and a linear progress bar. A summary bar totals cases by status. Clicking a case ID opens that case in place (cmd/ctrl+click opens it in a new tab).

## Screenshots

![SLA Deadline Tracker](./sla-deadline-tracker-pega.jpg)

![SLA Deadline Tracker](./slatracker.png)

## When to use

Add this widget to a landing page (Channels → Landing pages → Edit landing page) when you want an at-a-glance operational view of SLA health across many cases — e.g. a supervisor dashboard.

## Props

| Prop          | Type | Required | Default                               | Description                                                                                                                                                                                            |
| ------------- | ---- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `heading`     | Text | No       | `SLA & Deadline Tracker`              | Widget heading                                                                                                                                                                                         |
| `description` | Text | No       | `Live SLA status across active cases` | Widget subheading                                                                                                                                                                                      |
| `dataPage`    | Text | Yes      | `slatracker_datapage`                 | Data page returning rows: `caseID`, `insKey` (pzInsKey), `caseClassName` (pxObjClass), `slaType`, `status` (`On Track` \| `At Risk` \| `Overdue`), `percentUsed` (0–100), `dueDateTime` (ISO datetime) |

The data page decides business status (`status`) — the component only renders it and computes display formatting (remaining/overdue duration, due date) from `dueDateTime`. `insKey` and `caseClassName` are required (not just the display `caseID`) so the component can open the case via `getActionsApi().openWorkByHandle`.

## Visual states

- **Default** — a mix of On Track, At Risk, and Overdue cases
- **AllOnTrack** — every card in the same status
- **ManyRows** — more cards than fit one row, demonstrating dynamic wrapping (no fixed cap)
- **Empty** — no active cases returned by the data page

## Installation

Published to Pega as a `Rule-UI-Component`. Available in:

- Pega 25 and below: App Studio → Configure view → Fields/Widgets
- Pega 26 and above: Infinity Studio → User Interface → Component Library

> Note: rendering requires a real data page (`slatracker_datapage` by default) on your Pega server returning rows in the shape documented above.
