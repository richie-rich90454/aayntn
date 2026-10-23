<script setup lang="ts">
import { withBase } from "vitepress";
import clips from "../../../../../data/clips.json";

/**
 * The recorded demonstrations.
 *
 * The clips are produced by `pnpm run clips` from the laboratory itself, so a
 * recording cannot show an operation the player does not perform. They exist
 * for the places a running page cannot go: the README, a release note, a
 * slide.
 */

interface Clip {
    id: string;
    title: string;
    src: string;
    href: string;
}

const list = clips as Clip[];
</script>

<template>
    <div class="aayntn-clips">
        <figure v-for="clip in list" :key="clip.id" class="aayntn-clip">
            <video
                :src="withBase(clip.src)"
                controls
                loop
                muted
                playsinline
                preload="metadata"
                width="960"
                height="720"
            ></video>
            <figcaption>
                <a :href="withBase(clip.href)">{{ clip.title }}</a>
                <span class="aayntn-clip__note">Recorded from the laboratory, not drawn.</span>
            </figcaption>
        </figure>
    </div>
</template>

<style scoped>
.aayntn-clips {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
    gap: var(--space-6);
    margin-top: var(--space-6);
}

.aayntn-clip {
    margin: 0;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
    background: var(--surface-raised);
    overflow: hidden;
}

.aayntn-clip video {
    display: block;
    width: 100%;
    height: auto;
    background: var(--surface-sunken);
}

.aayntn-clip figcaption {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-3);
    font-size: var(--text-secondary-copy);
}

.aayntn-clip__note {
    color: var(--text-muted);
    font-size: var(--text-meta);
}
</style>
