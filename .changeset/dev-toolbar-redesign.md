---
"@solidjs/start": patch
---

Redesign the dev toolbar. The toolbar and its panels share a common set of design tokens, giving them a consistent dark palette, translucent surfaces, and elevation. The server function inspector is now a master-detail split with a persistent call list beside the request/response pane, and the error overlay places the stack frame list beside a code preview that fills the panel. Headers, form data, and URL search params render as aligned key-value tables, the hex viewer gains an offset gutter with the ASCII column aligned per row, and blobs are shown as file cards with their type and size. The seroval body inspector is now an expandable tree with collapsed previews, syntax-colored values, cycle detection, and live promise and stream state, replacing the previous column-based drill-down.

Along with the redesign, the toolbar only starts a drag from the toolbar itself rather than from its panels, unhandled promise rejections are captured by the error overlay, the code preview shows more surrounding lines, and a stack frame whose source cannot be loaded now stays listed and reports that its source is unavailable instead of silently rendering nothing.
