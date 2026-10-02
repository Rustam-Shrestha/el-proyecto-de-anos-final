# UI/UX REFINEMENT SYSTEM

## ROLE

Act as a senior **UI/UX designer + frontend design engineer** working directly inside an existing TypeScript MERN application.

The application is already implemented.

**Do not redesign the product. Do not change business logic. Do not change workflows. Do not change routes, API behavior, data models, permissions, or feature behavior.**

Your job is to **repair, standardize, and elevate the existing UI implementation** so it looks like one deliberately engineered professional product rather than a collection of individually coded screens.

This document is the UI/UX authority for the work.

---

# 1. FIRST: INSPECT THE EXISTING SYSTEM

Before modifying UI, inspect the existing codebase.

Mandatory inspection:

```text
src/shared/components/
src/components/
src/
```

Identify:

* reusable components
* existing buttons
* inputs
* forms
* tables
* cards
* modals
* dialogs
* dropdowns
* badges
* alerts
* layout components
* navigation
* typography utilities
* CSS/Tailwind configuration
* design tokens
* existing icon components
* centralized `Icon.jsx`, `Icons.jsx`, or equivalent
* duplicated UI implementations

Do not assume reusable components are being used correctly.

Search the actual application for repeated UI patterns and determine where existing shared components are being bypassed.

---

# 2. PRIMARY OBJECTIVE

Fix the existing UI systematically.

The goal is:

```text
existing functionality
        +
existing architecture
        +
existing reusable components
        ↓
consistent design system
        ↓
professional production UI
```

Do NOT solve each page independently.

If five pages contain the same button, input, table, modal, badge, or layout pattern, fix the shared implementation and migrate the pages to it.

---

# 3. REUSABLE COMPONENTS ARE MANDATORY

Existing reusable components under:

```text
src/shared/components/
src/components/
```

must be treated as the preferred UI primitives.

Before writing JSX for a common UI element:

```text
SEARCH EXISTING COMPONENTS
        ↓
CAN EXISTING COMPONENT BE USED?
        ↓
YES → USE IT
NO → CAN IT BE EXTENDED?
        ↓
YES → EXTEND SHARED COMPONENT
NO → CREATE NEW REUSABLE COMPONENT
```

Do not repeatedly write raw HTML for patterns that already exist as reusable components.

Bad:

```tsx
<button className="...">Save</button>
```

when a project Button component exists.

Bad:

```tsx
<input className="..." />
```

when a project Input component exists.

Bad:

```tsx
<div className="rounded ... border ...">
```

when the project already has a suitable Card component.

---

# 4. COMPONENT MIGRATION

The existence of a reusable component is not sufficient.

**Actually use it throughout the application.**

When auditing an existing screen:

```text
raw HTML implementation
        ↓
find equivalent shared component
        ↓
replace implementation
        ↓
preserve existing behavior
        ↓
preserve existing props/data
        ↓
normalize styling
```

Do not preserve duplicated UI merely because it already works.

Preserve behavior, not duplicated presentation code.

---

# 5. COMPONENT EXTENSION RULE

If an existing reusable component is almost correct:

**extend it instead of creating a parallel component.**

Example:

```text
Existing Button
    ↓
add missing variant/size/state
    ↓
reuse everywhere
```

Do not create:

```text
Button
PrimaryButton
BlueButton
SaveButton
SubmitButton
CustomButton
```

for the same underlying pattern.

---

# 6. VISUAL SYSTEM

Use this fixed visual system.

## Primary color

Use a restrained professional green as the primary action/accent color.

```text
Primary        #15803D
Primary Hover  #166534
Primary Active #14532D
Primary Soft   #DCFCE7
```

Green represents:

* primary actions
* active navigation
* selected states
* positive emphasis
* brand accent

Do not use multiple unrelated greens.

---

# 7. NEUTRAL PALETTE

Use:

```text
Text Primary    #0F172A
Text Secondary  #334155
Text Muted      #64748B
Text Subtle     #94A3B8

Background      #F8FAFC
Surface         #FFFFFF
Surface Subtle  #F1F5F9

Border          #E2E8F0
Border Strong   #CBD5E1
```

These values are the default UI palette.

Do not introduce arbitrary colors.

Do not scatter raw hex values throughout components.

Centralize them through the project's existing token/theme mechanism.

---

# 8. SEMANTIC COLORS

Use:

```text
Success        #16A34A
Success Soft   #DCFCE7

Warning        #D97706
Warning Soft   #FEF3C7

Danger         #DC2626
Danger Soft    #FEE2E2

Info           #0284C7
Info Soft      #E0F2FE
```

Rules:

```text
Green  → success / primary
Orange → warning
Red    → error / destructive
Blue   → informational
Slate  → neutral
```

Do not use semantic colors as decoration.

Do not replace the primary green with semantic green variants randomly.

---

# 9. DARK MODE

**Do not implement dark mode.**

Do not create:

* dark-mode tokens
* dark-mode CSS
* dark-mode component variants
* dark-mode theme switching

unless the existing application already requires dark mode as an actual product requirement.

Current target:

**professional light interface only.**

---

# 10. TYPOGRAPHY

Use:

```text
Inter
```

Primary font stack:

```css
Inter,
ui-sans-serif,
system-ui,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif
```

Do not introduce additional decorative/display fonts.

---

# 11. TYPE SCALE

Use:

```text
12px → metadata
13px → dense secondary information
14px → labels / table text / secondary UI
16px → default body
18px → emphasized text
20px → H4
24px → H3
30px → H2
36px → H1
```

ERP/application interfaces should primarily use:

```text
14px
16px
20px
24px
30px
36px
```

Do not use oversized landing-page typography inside operational application screens.

---

# 12. FONT WEIGHTS

Use only:

```text
400 → body
500 → labels / navigation
600 → headings / important controls
700 → exceptional emphasis
```

Do not make entire interfaces bold.

---

# 13. SPACING SYSTEM

Use a 4px-based spacing scale:

```text
4
8
12
16
20
24
32
40
48
64
80
96
```

Prefer these values everywhere.

Do not introduce arbitrary spacing such as:

```text
13px
17px
19px
23px
27px
31px
```

unless technically necessary.

---

# 14. SPACING APPLICATION

Use:

```text
4px   → icon/text micro-gap
8px   → tightly related content
12px  → compact control padding
16px  → standard spacing
20px  → field/group spacing
24px  → component groups
32px  → section groups
40px  → major separation
48px  → major sections
64px  → page-level separation
```

Spacing must establish hierarchy.

Do not give every element identical spacing.

---

# 15. CONTAINER

Application content:

```text
max-width: 1440px
margin-inline: auto
```

Page horizontal padding:

```text
mobile  → 16px
tablet  → 24px
desktop → 32px
```

Reuse the existing Container/layout component if one exists.

Do not create page-specific container implementations.

---

# 16. BORDER RADIUS

Fixed system:

```text
4px  → small elements
6px  → inputs / controls
8px  → buttons / cards
12px → large surfaces
```

Default application radius:

```text
8px
```

Do not turn every element into a pill.

Pills are reserved for:

```text
status
tags
badges
compact filters
```

---

# 17. BORDERS

Default:

```text
1px solid #E2E8F0
```

Use borders for:

* inputs
* tables
* separators
* structured surfaces
* navigation boundaries

Do not add borders to everything.

---

# 18. SHADOWS

Use minimal elevation.

```text
none
0 1px 2px rgba(15, 23, 42, 0.05)
0 4px 12px rgba(15, 23, 42, 0.08)
0 12px 32px rgba(15, 23, 42, 0.12)
```

Use:

```text
Level 1 → subtle surfaces
Level 2 → popovers/dropdowns
Level 3 → dialogs/major overlays
```

Do not use decorative shadows.

---

# 19. BUTTON STANDARD

Default:

```text
height: 40px
padding-inline: 16px
border-radius: 6px
font-size: 14px
font-weight: 600
```

Variants:

```text
primary
secondary
ghost
destructive
```

Primary:

```text
background: #15803D
color: #FFFFFF
```

Primary hover:

```text
#166534
```

Primary active:

```text
#14532D
```

Do not create arbitrary button colors.

---

# 20. INPUT STANDARD

Default:

```text
height: 40px
padding-inline: 12px
border-radius: 6px
font-size: 14px
border: 1px solid #CBD5E1
background: #FFFFFF
```

Focus:

```text
border: #15803D
box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.12)
```

Error:

```text
border: #DC2626
```

Disabled:

```text
background: #F1F5F9
color: #94A3B8
```

---

# 21. FORM STANDARD

Every form field should use the existing reusable form primitives.

Structure:

```text
Label
↓
Input
↓
Helper text / validation error
```

Spacing:

```text
label → input: 8px
field → field: 16px
field group → group: 24px
section → section: 32px
```

Do not implement duplicated input styling in individual pages.

---

# 22. ICON SYSTEM

First locate the existing centralized icon implementation.

Search for:

```text
Icons.jsx
Icon.jsx
icons/
lucide
svg
```

If an existing centralized icon component exists:

**USE IT.**

Do not introduce another icon architecture.

---

# 23. NEW ICONS

If a required icon does not exist:

1. Check whether the existing icon system already supports it.
2. If Lucide is already available in the project, use the appropriate Lucide icon through the existing centralized icon layer.
3. If it is not available, add the SVG to the centralized local icon implementation.
4. Do not import icon implementations independently across dozens of components.

Core UI icons must not depend on remote CDN URLs.

---

# 24. ICON USAGE

Use icons only when they improve:

* recognition
* navigation
* action identification
* status communication
* information scanning

Do not add icons to every button, heading, card, or label.

Avoid decorative icon proliferation.

---

# 25. ICON CONSISTENCY

Use:

```text
24 × 24 viewBox
currentColor
stroke-based icons
1.75px stroke
round linecap
round linejoin
```

Standard display sizes:

```text
16px
18px
20px
24px
```

Default:

```text
20px
```

---

# 26. ICON BUTTONS

Every icon-only button must have an accessible label.

Example:

```tsx
<button aria-label="Search">
```

Decorative icons:

```tsx
aria-hidden="true"
```

Do not use icons as the only communication mechanism for critical states.

---

# 27. TABLE STANDARD

Default:

```text
header: 13–14px / 600
body: 14px / 400
row height: 48–56px
cell horizontal padding: 16px
```

Header:

```text
background: #F8FAFC
border-bottom: #E2E8F0
```

Rows:

```text
border-bottom: 1px solid #E2E8F0
```

Avoid excessive zebra striping.

---

# 28. TABLE DATA

Text:

```text
left aligned
```

Numbers:

```text
right aligned
font-variant-numeric: tabular-nums
```

Actions:

```text
right aligned
```

Keep columns visually stable.

---

# 29. CARDS

Do not convert every section into a card.

Use cards only where the content is a meaningful independent unit.

Default:

```text
background: #FFFFFF
border: 1px solid #E2E8F0
border-radius: 8px
padding: 24px
```

Avoid deeply nested cards.

---

# 30. PAGE STRUCTURE

Reuse existing layout components.

Preferred structure:

```text
AppShell
  ↓
Main
  ↓
Container
  ↓
PageHeader
  ↓
Filters / Controls
  ↓
Primary Content
```

If these components already exist, use them rather than rebuilding the structure per page.

---

# 31. NAVIGATION

Preserve the existing navigation architecture.

Improve only:

* spacing
* typography
* active state
* alignment
* icon consistency
* responsive behavior
* visual hierarchy

Do not change navigation semantics or workflow.

Desktop sidebar target:

```text
240–264px
```

Active navigation:

```text
background: #DCFCE7
color: #166534
font-weight: 500
```

Do not use glowing active states.

---

# 32. PAGE HEADER

Use the existing PageHeader component if available.

Hierarchy:

```text
Breadcrumb
Title
Description
Primary Action
```

Default spacing:

```text
breadcrumb → 8px → title
title → 8px → description
header → 24px → content
```

Do not use oversized headings in dense application screens.

---

# 33. STATUS BADGES

Use one shared status component.

Do not create separate visual implementations for:

```text
Approved
Pending
Rejected
Draft
Completed
Failed
```

Example semantic mapping:

```text
Approved   → success
Completed  → success
Pending    → warning
Rejected   → danger
Failed     → danger
Draft      → neutral
Review     → info
```

Maintain the same component, dimensions, typography, and radius everywhere.

---

# 34. DASHBOARDS

Preserve existing dashboard functionality.

Improve:

```text
metric hierarchy
spacing
alignment
chart consistency
data density
visual grouping
```

Do not add charts unless they represent existing useful data.

Do not invent metrics.

Do not rearrange business-critical information without understanding the existing workflow.

---

# 35. FINTECH / ERP DATA

Prioritize:

```text
clarity
precision
status
traceability
readability
density
```

Financial numbers:

```css
font-variant-numeric: tabular-nums;
```

Do not visually exaggerate financial metrics with huge typography or decorative effects.

---

# 36. LOADING STATES

Use existing shared:

```text
Skeleton
Spinner
LoadingButton
```

if available.

If repeated loading patterns exist, consolidate them into reusable components.

Do not create slightly different loading animations per page.

---

# 37. EMPTY STATES

Use one reusable EmptyState component where possible.

Structure:

```text
Title
Explanation
Relevant action
```

Do not add giant illustrations.

---

# 38. ERROR STATES

Use shared error/alert components where available.

Errors must be:

```text
specific
visible
actionable
contextual
```

Do not replace useful error information with generic messages.

---

# 39. MODALS / DIALOGS

Use the existing Dialog/Modal component.

Do not create page-specific modal implementations.

Default:

```text
max-width: 480px
padding: 24px
border-radius: 12px
```

Large workflows should use the existing page/drawer architecture instead of forcing complex screens into small dialogs.

---

# 40. RESPONSIVE BEHAVIOR

Do not redesign product behavior.

Make the existing UI work correctly at:

```text
640px
768px
1024px
1280px
```

Fix:

* overflow
* clipping
* broken grids
* inaccessible controls
* awkward wrapping
* excessive spacing
* hidden actions
* table failures

Do not create device-specific hacks unless necessary.

---

# 41. MOBILE RULE

When width decreases:

```text
stack
collapse
hide secondary information
prioritize essential information
```

Do not simply shrink everything.

Preserve:

```text
primary actions
critical status
essential data
navigation
error messages
```

---

# 42. ACCESSIBILITY

Preserve and improve:

```text
semantic HTML
keyboard navigation
visible focus
accessible labels
contrast
logical tab order
screen reader compatibility
reduced motion
```

Never remove accessible focus indicators.

Do not make hover the only mechanism for discovering information or actions.

---

# 43. MOTION

Keep motion restrained.

Use:

```text
150ms → micro interaction
200ms → normal transition
300ms → larger transition
```

Animate primarily:

```text
opacity
transform
menus
dialogs
drawers
small state changes
```

Do not add:

```text
animated backgrounds
floating decorations
continuous loops
scroll theatrics
excessive page transitions
```

Motion is not required to make a component look modern.

---

# 44. DO NOT CHANGE PRODUCT FLOW

Absolutely do not modify:

```text
routes
API calls
business logic
database behavior
authentication behavior
authorization
form submission behavior
feature sequence
workflow semantics
data models
```

unless the task explicitly requires it.

UI refinement must be behavior-preserving.

---

# 45. DO NOT OVER-ENGINEER

Do not rewrite working components merely to make the code look cleaner.

Do not introduce a new UI framework.

Do not introduce a new design library.

Do not install packages for problems already solvable with existing project infrastructure.

Do not create abstractions that have no reuse case.

---

# 46. DO NOT CREATE DESIGN DRIFT

Every new UI change must conform to:

```text
Inter
+
green primary
+
Slate neutrals
+
semantic colors
+
4px spacing
+
6/8/12px radius system
+
subtle borders
+
minimal shadows
+
shared components
+
centralized icons
+
restrained motion
```

No local alternative design system.

---

# 47. REFACTORING PRIORITY

When inspecting an existing page, fix in this order:

```text
1. Broken layout
2. Incorrect reusable-component usage
3. Inconsistent spacing
4. Typography inconsistency
5. Button/input inconsistency
6. Color inconsistency
7. Border/radius inconsistency
8. Icon inconsistency
9. Missing states
10. Responsive issues
11. Accessibility issues
12. Minor visual polish
```

Do not start with decorative improvements while structural problems remain.

---

# 48. DUPLICATION AUDIT

Search the codebase for repeated:

```text
buttons
inputs
cards
tables
badges
modals
dropdowns
page headers
filters
empty states
loading states
icons
```

If multiple implementations perform the same UI role:

```text
choose canonical implementation
↓
normalize it
↓
migrate usages
↓
remove unnecessary duplication
```

---

# 49. RAW HTML AUDIT

Look for repeated raw:

```tsx
<button>
<input>
<select>
<textarea>
<table>
<div className="rounded ...">
```

Determine whether an existing shared component should be used.

Do not blindly replace semantic HTML when the shared component is inappropriate.

The rule is:

**Reusable component where a reusable component exists and matches the semantic role.**

---

# 50. EXISTING COMPONENT IMPROVEMENT

When an existing shared component is visually weak:

Do not bypass it.

Fix the shared component.

Then propagate the improvement to its consumers.

Example:

```text
Bad Button implementation
        ↓
fix Button
        ↓
all Button users improve automatically
```

This is preferable to manually styling every page.

---

# 51. COMPONENT API PRESERVATION

When improving shared components:

Preserve existing public props where practical.

Do not unnecessarily break:

```text
prop names
callbacks
data contracts
variants
controlled/uncontrolled behavior
```

If a breaking change is genuinely necessary, inspect every usage before changing it.

---

# 52. TOKEN CENTRALIZATION

If the project has an existing theme/token system:

**use it.**

If it does not:

create a minimal centralized token layer rather than scattering values.

Centralize:

```text
colors
spacing
radii
shadows
typography
```

Do not duplicate these values across dozens of files.

---

# 53. CSS / TAILWIND RULE

Use the styling architecture already established by the project.

Do not introduce:

```text
Tailwind
CSS Modules
styled-components
Emotion
another CSS framework
```

merely because it is preferred personally.

Follow the existing project architecture.

The design system is independent of the styling technology.

---

# 54. VISUAL AUDIT

After implementation, inspect the resulting UI as a system.

Check:

```text
alignment
spacing
typography
color
component consistency
icon consistency
density
responsive behavior
states
accessibility
```

Look specifically for:

```text
different button heights
different input heights
different radii
different green shades
random text sizes
random padding
duplicate components
misaligned icons
unnecessary cards
unnecessary borders
excessive shadows
excessive icons
```

Fix the underlying shared component whenever possible.

---

# 55. PROFESSIONAL UI TEST

The final result must satisfy:

```text
same component → same appearance
same semantic state → same visual treatment
same spacing relationship → same spacing
same action hierarchy → same button hierarchy
same icon role → same icon language
same page structure → same layout primitives
```

A user moving between pages should feel that every screen belongs to the same application.

---

# 56. FINAL EXECUTION RULE

Do not treat this as a list of suggestions.

Treat it as the **implementation specification**.

When modifying UI:

```text
INSPECT
↓
IDENTIFY EXISTING PATTERN
↓
REUSE
↓
EXTEND IF NECESSARY
↓
CENTRALIZE
↓
MIGRATE DUPLICATES
↓
APPLY FIXED TOKENS
↓
PRESERVE FUNCTIONALITY
↓
VERIFY RESPONSIVENESS
↓
VERIFY ACCESSIBILITY
↓
AUDIT ENTIRE SYSTEM
```

Do not stop after making one screen visually better.

The objective is **system-wide consistency**.

---

# 57. FINAL CONSTRAINT

The application should converge toward one coherent system:

```text
FONT
Inter

PRIMARY
#15803D

PRIMARY HOVER
#166534

PRIMARY ACTIVE
#14532D

BACKGROUND
#F8FAFC

SURFACE
#FFFFFF

TEXT
#0F172A

SECONDARY TEXT
#334155

MUTED
#64748B

BORDER
#E2E8F0

STRONG BORDER
#CBD5E1

SUCCESS
#16A34A

WARNING
#D97706

DANGER
#DC2626

INFO
#0284C7

SPACING
4px base rhythm

DEFAULT CONTROL HEIGHT
40px

DEFAULT CONTROL RADIUS
6px

DEFAULT CARD RADIUS
8px

DEFAULT SHADOW
0 1px 2px rgba(15,23,42,0.05)

ICON
centralized local SVG system

DARK MODE
not implemented unless required

MOTION
restrained

ARCHITECTURE
shared components first
```

**Do not invent alternatives unless an existing product requirement makes one necessary.**

