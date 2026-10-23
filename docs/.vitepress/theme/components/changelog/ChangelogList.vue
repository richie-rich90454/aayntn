<script setup lang="ts">
import entries from "../../../data/generated/changelog.json";

/**
 * The changelog.
 *
 * The entries are read from the history when the site is generated, so the
 * page describes the commits that are actually in the build. A shallow
 * checkout has no history and the page says so rather than showing an empty
 * list as if nothing had happened.
 */

interface Entry {
    date: string;
    type: string;
    scope: string;
    title: string;
}

const rows = entries as Entry[];
</script>

<template>
    <div class="aayntn-changelog">
        <p v-if="rows.length === 0" class="aayntn-changelog__empty">
            This build was made from a checkout without its history, so there is nothing to list
            here. The repository itself always has the record.
        </p>

        <table v-else class="aayntn-table">
            <caption>
                The most recent changes, newest first. Each row is one commit and each commit is one
                file.
            </caption>
            <thead>
                <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Kind</th>
                    <th scope="col">Change</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(row, index) in rows" :key="index">
                    <td>
                        <time :datetime="row.date">{{ row.date }}</time>
                    </td>
                    <td>
                        <code>{{ row.type }}</code>
                    </td>
                    <td>
                        <span v-if="row.scope" class="aayntn-changelog__scope">
                            {{ row.scope }}
                        </span>
                        {{ row.title }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
.aayntn-changelog__scope {
    margin-right: var(--space-2);
    padding: 1px 6px;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
    color: var(--text-muted);
    font-family: var(--font-code);
    font-size: var(--text-meta);
}
</style>
