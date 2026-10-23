<script setup lang="ts">
import { withBase } from "vitepress";
import { useReadingOrder } from "../../composables/useReadingOrder";

/**
 * The previous and next lessons, in the order of the generated lesson list.
 * The pair is derived from the same list for every page, so two adjacent
 * pages always point at one another.
 */

const { previous, next } = useReadingOrder();
</script>

<template>
    <nav v-if="previous || next" class="aayntn-pager" aria-label="Previous and next">
        <a
            v-if="previous"
            class="aayntn-pager__step"
            :href="withBase(previous.lesson.href)"
            rel="prev"
        >
            <span class="aayntn-pager__kicker">Previous &middot; {{ previous.kind }}</span>
            <span class="aayntn-pager__title">{{ previous.lesson.title }}</span>
        </a>
        <a
            v-if="next"
            class="aayntn-pager__step aayntn-pager__step--next"
            :href="withBase(next.lesson.href)"
            rel="next"
        >
            <span class="aayntn-pager__kicker">Next &middot; {{ next.kind }}</span>
            <span class="aayntn-pager__title">{{ next.lesson.title }}</span>
        </a>
    </nav>
</template>
