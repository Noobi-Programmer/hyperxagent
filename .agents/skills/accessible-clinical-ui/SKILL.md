---
name: accessible-clinical-ui
description: Enforces high-contrast, elderly-friendly, 390x844 mobile-first UI design with large touch targets and zero layout shift.
---

# Accessible Clinical & Mobile UI Skill

## Design Rules
1. **Viewport First (`390x844`):** Build single-column mobile layouts centered in `max-w-md mx-auto min-h-dvh` with `overflow-x-hidden`.
2. **High-Contrast Palette:**
   - Primary Surface: `#FFFFFF` / `#F8FAFC` with `#0F172A` primary text (`>= 14:1` contrast).
   - High-Visibility Action Accent: `#0F766E` (Teal 700) or `#1D4ED8` (Blue 700) with `#FFFFFF` label text.
   - Critical Warning Banner: `#FEF2F2` background, `#991B1B` text, `#DC2626` `2px` border.
3. **Touch & Readability Floor:**
   - Base body font size: `16px` (`text-base`) minimum; primary status headings `20px–24px`.
   - Every button, mic trigger, and language selector must be `min-h-[52px] min-w-[52px]` with `gap-3` spacing.
4. **Voice UX Feedback:** Provide visual pulse/waveform state during recording, explicit transcript confirmation text, and one-tap audio replay.
