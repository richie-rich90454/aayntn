/**
 * Local learning history.
 *
 * Progress lives entirely in the reader's browser inside a versioned
 * IndexedDB database. There is no account, no server, and no analytics. The
 * export/import pair is the only portability mechanism, and that is stated
 * plainly in the user interface.
 */

export type LessonStatus = "not-started" | "in-progress" | "review" | "mastered";
export type ProblemStatus = "not-attempted" | "attempted" | "solved";

export interface LessonProgress {
    lessonId: string;
    status: LessonStatus;
    updatedAt: string;
}

export interface ProblemProgress {
    problemId: string;
    status: ProblemStatus;
    notes?: string;
    updatedAt: string;
}

export interface BookmarkedTopic {
    topicId: string;
    title: string;
    addedAt: string;
}

export interface AttemptRecord {
    problemId: string;
    contest?: string;
    division?: string;
    result: "accepted" | "wrong-answer" | "time-limit" | "runtime-error" | "not-attempted";
    attemptedAt: string;
    minutes?: number;
}

export interface ProgressSnapshot {
    version: 1;
    exportedAt: string;
    lessons: LessonProgress[];
    problems: ProblemProgress[];
    bookmarks: BookmarkedTopic[];
    attempts: AttemptRecord[];
    preferences: { language?: string; variant?: string | null };
}

const DB_NAME = "aayntn-progress";
const DB_VERSION = 1;
const STORE = "progress";

export const LESSON_STATUSES: LessonStatus[] = ["not-started", "in-progress", "review", "mastered"];
export const PROBLEM_STATUSES: ProblemStatus[] = ["not-attempted", "attempted", "solved"];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE, { keyPath: "key" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    return dbPromise;
}

async function withStore<T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
    const db = await openDatabase();
    return new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = run(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

const LESSON_KEY = "lesson:";
const PROBLEM_KEY = "problem:";
const BOOKMARK_KEY = "bookmark:";
const ATTEMPT_KEY = "attempt:";

export async function saveLessonProgress(lessonId: string, status: LessonStatus) {
    const record: LessonProgress & { key: string } = {
        key: LESSON_KEY + lessonId,
        lessonId,
        status,
        updatedAt: new Date().toISOString(),
    };
    await withStore("readwrite", (store) => store.put(record) as IDBRequest<unknown>);
}

export async function saveProblemProgress(
    problemId: string,
    status: ProblemStatus,
    notes?: string,
) {
    const record: ProblemProgress & { key: string } = {
        key: PROBLEM_KEY + problemId,
        problemId,
        status,
        notes,
        updatedAt: new Date().toISOString(),
    };
    await withStore("readwrite", (store) => store.put(record) as IDBRequest<unknown>);
}

export async function toggleBookmark(topicId: string, title: string) {
    const key = BOOKMARK_KEY + topicId;
    const existing = await withStore("readonly", (store) => store.get(key) as IDBRequest<unknown>);
    if (existing) {
        await withStore("readwrite", (store) => store.delete(key) as IDBRequest<unknown>);
        return false;
    }
    const record: BookmarkedTopic & { key: string } = {
        key,
        topicId,
        title,
        addedAt: new Date().toISOString(),
    };
    await withStore("readwrite", (store) => store.put(record) as IDBRequest<unknown>);
    return true;
}

export async function recordAttempt(attempt: AttemptRecord) {
    const key = ATTEMPT_KEY + attempt.problemId + ":" + attempt.attemptedAt;
    await withStore("readwrite", (store) => store.put({ ...attempt, key }) as IDBRequest<unknown>);
}

export async function readAll(): Promise<{
    lessons: LessonProgress[];
    problems: ProblemProgress[];
    bookmarks: BookmarkedTopic[];
    attempts: AttemptRecord[];
}> {
    const entries = await withStore("readonly", (store) => store.getAll() as IDBRequest<unknown[]>);
    const lessons: LessonProgress[] = [];
    const problems: ProblemProgress[] = [];
    const bookmarks: BookmarkedTopic[] = [];
    const attempts: AttemptRecord[] = [];
    for (const entry of entries ?? []) {
        const record = entry as Record<string, unknown> & { key?: string };
        if (typeof record.key !== "string") continue;
        if (record.key.startsWith(LESSON_KEY)) lessons.push(record as unknown as LessonProgress);
        else if (record.key.startsWith(PROBLEM_KEY))
            problems.push(record as unknown as ProblemProgress);
        else if (record.key.startsWith(BOOKMARK_KEY))
            bookmarks.push(record as unknown as BookmarkedTopic);
        else if (record.key.startsWith(ATTEMPT_KEY))
            attempts.push(record as unknown as AttemptRecord);
    }
    return { lessons, problems, bookmarks, attempts };
}

export async function exportSnapshot(): Promise<ProgressSnapshot> {
    const { lessons, problems, bookmarks, attempts } = await readAll();
    return {
        version: 1,
        exportedAt: new Date().toISOString(),
        lessons,
        problems,
        bookmarks,
        attempts,
        preferences: {
            language: localStorage.getItem("aayntn:language") ?? undefined,
            variant: localStorage.getItem("aayntn:variant") ?? null,
        },
    };
}

export async function importSnapshot(snapshot: ProgressSnapshot): Promise<void> {
    for (const lesson of snapshot.lessons ?? []) {
        await saveLessonProgress(lesson.lessonId, lesson.status);
    }
    for (const problem of snapshot.problems ?? []) {
        await saveProblemProgress(problem.problemId, problem.status, problem.notes);
    }
    for (const bookmark of snapshot.bookmarks ?? []) {
        await withStore(
            "readwrite",
            (store) =>
                store.put({
                    ...bookmark,
                    key: BOOKMARK_KEY + bookmark.topicId,
                }) as IDBRequest<unknown>,
        );
    }
    for (const attempt of snapshot.attempts ?? []) {
        await recordAttempt(attempt);
    }
}

export async function clearProgress() {
    await withStore("readwrite", (store) => store.clear() as IDBRequest<unknown>);
}
