<script setup lang="ts">
/**
 * The aayntn ornament library.
 *
 * Every ornament is an original vector construction, drawn from geometric
 * paths rather than downloaded or borrowed. The library holds seven motifs:
 *
 *   corner       an architectural corner frame
 *   double-rule  a layered border segment
 *   rosette      a symmetrical mathematical rosette
 *   laurel       a geometric laurel-inspired curve
 *   medallion    a graph-shaped decorative medallion
 *   axis         a mathematical axis pattern
 *   insignia     a division-specific insignia
 *
 * The ornaments are deliberately kept in the ink and gold palette and they
 * never carry data, so that they can never be mistaken for an instructional
 * diagram.
 */
withDefaults(defineProps<{ motif?: string; label?: string }>(), {
    motif: "corner",
    label: "",
});
</script>

<template>
    <!-- Architectural corner frame. -->
    <svg
        v-if="motif === 'corner'"
        class="aayntn-ornament"
        viewBox="0 0 64 64"
        aria-hidden="true"
        focusable="false"
    >
        <g fill="none" stroke="currentColor" stroke-width="1.4">
            <path d="M2 20 V6 a4 4 0 0 1 4-4 h14" />
            <path d="M8 24 V11 a3 3 0 0 1 3-3 h13" stroke-width="0.8" opacity="0.7" />
            <path d="M14 26 V14 a6 6 0 0 1 6-6 h12" stroke-width="0.6" opacity="0.45" />
        </g>
        <circle cx="8" cy="8" r="2.4" fill="currentColor" />
        <path d="M20 6 h6 v6" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6" />
    </svg>

    <!-- Layered border segment. -->
    <svg
        v-else-if="motif === 'double-rule'"
        class="aayntn-ornament"
        viewBox="0 0 240 12"
        aria-hidden="true"
        focusable="false"
    >
        <g stroke="currentColor" fill="none">
            <path d="M0 1 H240" stroke-width="1.4" />
            <path d="M0 5 H240" stroke-width="0.7" opacity="0.7" />
            <path d="M0 10 H240" stroke-width="1.4" />
        </g>
        <g fill="currentColor">
            <rect x="112" y="-2" width="16" height="16" />
            <rect x="116" y="2" width="8" height="8" fill="#161616" />
        </g>
    </svg>

    <!-- Symmetrical mathematical rosette. -->
    <svg
        v-else-if="motif === 'rosette'"
        class="aayntn-ornament"
        viewBox="0 0 64 64"
        aria-hidden="true"
        focusable="false"
    >
        <g fill="none" stroke="currentColor" stroke-width="1.2">
            <circle cx="32" cy="32" r="26" />
            <circle cx="32" cy="32" r="19" stroke-width="0.7" opacity="0.7" />
            <path d="M32 6 A26 26 0 0 1 58 32" />
            <path d="M58 32 A26 26 0 0 1 32 58" />
            <path d="M32 58 A26 26 0 0 1 6 32" />
            <path d="M6 32 A26 26 0 0 1 32 6" />
            <path d="M32 13 A19 19 0 0 1 51 32" stroke-width="0.8" opacity="0.8" />
            <path d="M32 51 A19 19 0 0 1 13 32" stroke-width="0.8" opacity="0.8" />
        </g>
        <g fill="currentColor">
            <rect x="30" y="30" width="4" height="4" />
            <rect x="14" y="30" width="4" height="4" />
            <rect x="46" y="30" width="4" height="4" />
            <rect x="30" y="14" width="4" height="4" />
            <rect x="30" y="46" width="4" height="4" />
        </g>
    </svg>

    <!-- Geometric laurel-inspired curve. -->
    <svg
        v-else-if="motif === 'laurel'"
        class="aayntn-ornament"
        viewBox="0 0 48 64"
        aria-hidden="true"
        focusable="false"
    >
        <path
            d="M38 4 C14 14 8 32 10 60"
            fill="none"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="square"
        />
        <g fill="none" stroke="currentColor" stroke-width="1.1">
            <path d="M30 8 C22 8 17 13 16 20 C24 20 29 15 30 8 Z" />
            <path d="M22 18 C14 19 10 25 10 32 C18 31 22 25 22 18 Z" />
            <path d="M15 31 C9 34 7 41 9 47 C15 44 17 37 15 31 Z" />
            <path d="M36 14 C29 12 23 15 20 21 C27 23 33 20 36 14 Z" />
            <path d="M25 26 C18 25 12 29 10 35 C17 37 23 33 25 26 Z" />
        </g>
    </svg>

    <!-- Graph-shaped decorative medallion. -->
    <svg
        v-else-if="motif === 'medallion'"
        class="aayntn-ornament"
        viewBox="0 0 72 72"
        aria-hidden="true"
        focusable="false"
    >
        <circle cx="36" cy="36" r="33" fill="none" stroke="currentColor" stroke-width="1.2" />
        <circle
            cx="36"
            cy="36"
            r="27"
            fill="none"
            stroke="currentColor"
            stroke-width="0.6"
            opacity="0.6"
        />
        <g fill="none" stroke="currentColor" stroke-width="1.1">
            <path d="M36 12 L18 30 M36 12 L54 30 M18 30 L36 48 M54 30 L36 48 M18 30 L54 30" />
            <path d="M36 12 L36 48" stroke-dasharray="3 3" opacity="0.6" />
        </g>
        <g fill="currentColor">
            <circle cx="36" cy="12" r="3.4" />
            <circle cx="18" cy="30" r="3.4" />
            <circle cx="54" cy="30" r="3.4" />
            <circle cx="36" cy="48" r="3.4" />
        </g>
    </svg>

    <!-- Mathematical axis pattern. -->
    <svg
        v-else-if="motif === 'axis'"
        class="aayntn-ornament"
        viewBox="0 0 240 26"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
    >
        <g stroke="currentColor" fill="none">
            <path d="M0 13 H240" stroke-width="1" />
            <path
                d="M0 8 V18 M30 10 V16 M60 10 V16 M90 8 V18 M120 10 V16 M150 10 V16 M180 8 V18 M210 10 V16 M240 8 V18"
                stroke-width="0.8"
            />
        </g>
        <g fill="currentColor">
            <rect x="14" y="11" width="4" height="4" />
            <rect x="104" y="11" width="4" height="4" />
            <rect x="194" y="11" width="4" height="4" />
        </g>
    </svg>

    <!-- Division-specific insignia. -->
    <svg
        v-else-if="motif === 'insignia'"
        class="aayntn-ornament"
        viewBox="0 0 32 32"
        aria-hidden="true"
        focusable="false"
    >
        <path
            d="M16 2 L29 9 V23 L16 30 L3 23 V9 Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.4"
        />
        <path
            d="M16 7 L24 11.5 V20.5 L16 25 L8 20.5 V11.5 Z"
            fill="none"
            stroke="currentColor"
            stroke-width="0.7"
            opacity="0.6"
        />
        <circle cx="16" cy="16" r="3" fill="currentColor" />
    </svg>
</template>
