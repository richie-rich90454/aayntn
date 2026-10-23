/**
 * The reading order of the encyclopedia.
 *
 * The generated lesson list is the single source of order, so the previous
 * and next links can never disagree with the table of contents. The current
 * page is resolved by its stable frontmatter id first, and by its route
 * second, because the index pages of a subject have an id but no file named
 * after them.
 */
import { computed } from "vue";
import { useData } from "vitepress";
import lessons from "../../data/generated/lessons.json";
import type { LessonEntry } from "../../data/types";

const lessonList = lessons as LessonEntry[];

export function normalizeHref(href: string): string {
    const trimmed = href.replace(/\/+$/, "");
    return trimmed === "" ? "/" : trimmed;
}

/** The lesson href of a page, from the path VitePress reports for it. */
export function pageHref(relativePath: string): string {
    const withoutExtension = relativePath.replace(/\.md$/, "").replace(/(^|\/)index$/, "$1");
    return normalizeHref("/" + withoutExtension);
}

const byId = new Map(lessonList.map((entry) => [entry.id, entry]));
const byHref = new Map(lessonList.map((entry) => [normalizeHref(entry.href), entry]));

export function lookupLesson(id: string): LessonEntry | undefined {
    return byId.get(id);
}

export function lookupHref(href: string): LessonEntry | undefined {
    return byHref.get(normalizeHref(href));
}

/** The kind of page a lesson is, in the words the pager shows. */
export function lessonKind(lesson: LessonEntry): string {
    if (/(^|\.)index$/.test(lesson.id)) return "Subject overview";
    if (lesson.href.startsWith("/algorithms/")) return "Technique";
    return "Lesson";
}

export interface ReadingStep {
    lesson: LessonEntry;
    kind: string;
}

export function useReadingOrder() {
    const { page, frontmatter } = useData();

    const href = computed(() => pageHref(page.value.relativePath ?? ""));
    const current = computed<LessonEntry | undefined>(() => {
        const id = frontmatter.value["id"] as string | undefined;
        return (id ? byId.get(id) : undefined) ?? byHref.get(href.value);
    });

    function stepAt(offset: number): ReadingStep | null {
        const lesson = current.value;
        if (!lesson) return null;
        const index = lessonList.findIndex((entry) => entry.id === lesson.id);
        if (index < 0) return null;
        const candidate = lessonList[index + offset];
        if (!candidate || candidate.id === lesson.id) return null;
        if (normalizeHref(candidate.href) === normalizeHref(lesson.href)) return null;
        return { lesson: candidate, kind: lessonKind(candidate) };
    }

    return {
        current,
        previous: computed(() => stepAt(-1)),
        next: computed(() => stepAt(1)),
    };
}
