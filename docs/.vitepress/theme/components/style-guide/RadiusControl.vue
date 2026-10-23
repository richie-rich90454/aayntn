<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";

const radius = ref(5);
const line = computed(() => `--radius: ${radius.value}px;`);

function apply(event: Event) {
    radius.value = Number((event.target as HTMLInputElement).value);
    document.documentElement.style.setProperty("--radius", `${radius.value}px`);
}

onBeforeUnmount(() => {
    document.documentElement.style.removeProperty("--radius");
});
</script>

<template>
    <div class="aayntn-sg-radius">
        <div class="aayntn-sg-radius__control">
            <label class="aayntn-sg-label" for="aayntn-radius">The one radius</label>
            <input
                id="aayntn-radius"
                class="aayntn-sg-radius__slider"
                type="range"
                min="5"
                max="24"
                step="1"
                :value="radius"
                @input="apply"
            />
            <span class="aayntn-sg-radius__value">{{ radius }}px</span>
            <code class="aayntn-sg-radius__line">{{ line }}</code>
            <p class="aayntn-sg-caption">
                The line above is the exact line to paste into the geometry section of tokens.css.
                The default is 5px.
            </p>
        </div>

        <div class="aayntn-sg-radius__specimens">
            <button class="aayntn-button aayntn-button--ink" type="button">Button</button>
            <span class="aayntn-chip">Chip</span>
            <div class="aayntn-sg-card">
                <p class="aayntn-sg-card__title">Card</p>
                <p class="aayntn-sg-card__copy">Every bordered surface reads the same token.</p>
            </div>
        </div>
    </div>
</template>
