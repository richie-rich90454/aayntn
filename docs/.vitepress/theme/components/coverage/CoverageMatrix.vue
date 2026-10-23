<script setup lang="ts">
import { coveragePercent, taggingPercent, useCoverage } from "../../composables/useCoverage";

/**
 * The coverage matrix.
 *
 * The figures come from the single summary that `useCoverage` exposes, so this
 * table and the prose around it cannot disagree. The page owns the argument;
 * the component owns only the division table.
 */

const summary = useCoverage();

function share(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}
</script>

<template>
    <div class="aayntn-coverage-matrix">
        <table>
            <caption>
                Complete techniques and tagged tasks by division. Complete means the article and its
                registered implementation manifest both exist.
            </caption>
            <thead>
                <tr>
                    <th scope="col">Division</th>
                    <th scope="col">Complete</th>
                    <th scope="col">Required</th>
                    <th scope="col">Coverage</th>
                    <th scope="col">Tagged tasks</th>
                    <th scope="col">Tasks</th>
                    <th scope="col">Tagging</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in summary.divisions" :key="row.id">
                    <th scope="row">{{ row.label }}</th>
                    <td>{{ row.complete }}</td>
                    <td>{{ row.required }}</td>
                    <td>{{ share(row.complete, row.required) }}%</td>
                    <td>{{ row.taggedTasks }}</td>
                    <td>{{ row.totalTasks }}</td>
                    <td>{{ share(row.taggedTasks, row.totalTasks) }}%</td>
                </tr>
            </tbody>
            <tfoot>
                <tr>
                    <th scope="row">All divisions</th>
                    <td>{{ summary.complete }}</td>
                    <td>{{ summary.required }}</td>
                    <td>{{ coveragePercent(summary) }}%</td>
                    <td>{{ summary.taggedTasks }}</td>
                    <td>{{ summary.totalTasks }}</td>
                    <td>{{ taggingPercent(summary) }}%</td>
                </tr>
            </tfoot>
        </table>
    </div>
</template>
