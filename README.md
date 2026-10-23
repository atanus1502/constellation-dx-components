# Using Custom Components in Constellation

> Components in this repo were built with **Claude Code** — from scaffolding via the DX Component Builder CLI through implementation, Storybook review, and publishing to Pega Infinity.

## Overview

This project provides you with an environment to extend Constellation by giving you tools to create and publish custom components that are not available from the Constellation installation.

## Before you begin

Review the following checklist before you create a Constellation DX component:

## Design considerations

Involve an Experience Designer in your process. This will help you determine the exact issue to be resolved.

## The Experience Designer must meet the following requirements:

Must have a background in UI and UX design.
Must understand Pega's best practices for design.

## Functionality considerations

Check if an existing component in App Studio contains the features you need. If not, check for existing components that contain similar features.
Connect with Pega Support to find out if a component containing a similar feature will be included in the next release. If yes, assess if you can wait for the next release.

## Maintenance considerations

Ensure you have the bandwidth to maintain the Constellation DX component and keep it up-to-date with every release of Pega Infinity. Evaluate if doing this might prevent you from upgrading to future releases of Pega Infinity.
Evaluate if you are able to meet the compliance standards for data privacy and accessibility for Constellation DX components. Note that not meeting these standards might lead to legal compliance issues.

## Prerequisites

Ensure you have access to the following in your system:

- Pega Infinity Server version 25.1 or later

- Git version 2.30 or later

- System node version >= 24.4.1

- System npm version 11.4.2

## Components

| Component | Type | Description |
|-----------|------|-------------|
| [CaseSummaryWidget](src/components/Virtusa_ClaudeDXComponents_CaseSummaryWidget) | Widget (CASE) | Displays case ID, status, customer name, and last-updated timestamp |
| [PIIRedactor](src/components/Virtusa_ClaudeDXComponents_PIIRedactor) | Field (Text) | Redacted display of card numbers, SSNs, phone, email, and generic values, with a masked-input edit mode |
| [SLADeadlineTracker](src/components/Virtusa_ClaudeDXComponents_SLADeadlineTracker) | Widget (PAGE) | Landing-page dashboard of SLA/deadline status across active cases, with click-to-open case links |
| [TokenScrollList](src/components/Virtusa_ClaudeDXComponents_TokenScrollList) | Widget (PAGE & CASE) | Infinite-scroll table for third-party APIs that page with a continuation token (`nextIdentifier` → `startIdentifier`); includes Pega data page setup, publishing and App Studio usage guide |
