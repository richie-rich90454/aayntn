#include <stdio.h>
#include <stdlib.h>

/* One job: it takes one unit of time and must finish by its deadline. */
typedef struct {
    long long deadline;
    long long profit;
} job;

/*
 * Sort by deadline. The profit breaks ties only to keep the order deterministic;
 * the heap algorithm is correct for any order among jobs with the same deadline.
 */
static int compare_jobs(const void *left, const void *right) {
    const job *x = left;
    const job *y = right;

    if (x->deadline != y->deadline) {
        return x->deadline < y->deadline ? -1 : 1;
    }
    if (x->profit != y->profit) {
        return x->profit < y->profit ? -1 : 1;
    }
    return 0;
}

/* Push a profit into a binary min-heap. */
static void heap_push(long long *heap, int *size, long long value) {
    int index = *size;
    heap[index] = value;
    *size += 1;

    while (index > 0) {
        int parent = (index - 1) / 2;
        if (heap[parent] <= heap[index]) {
            break;
        }
        long long temporary = heap[parent];
        heap[parent] = heap[index];
        heap[index] = temporary;
        index = parent;
    }
}

/* Remove the smallest profit from a binary min-heap. */
static void heap_pop(long long *heap, int *size) {
    *size -= 1;
    if (*size == 0) {
        return;
    }

    heap[0] = heap[*size];
    int index = 0;
    for (;;) {
        int left = 2 * index + 1;
        int right = left + 1;
        int smallest = index;

        if (left < *size && heap[left] < heap[smallest]) {
            smallest = left;
        }
        if (right < *size && heap[right] < heap[smallest]) {
            smallest = right;
        }
        if (smallest == index) {
            break;
        }

        long long temporary = heap[index];
        heap[index] = heap[smallest];
        heap[smallest] = temporary;
        index = smallest;
    }
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1) {
        return 0;
    }
    if (n <= 0) {
        printf("0\n");
        return 0;
    }

    job *jobs = malloc((size_t)n * sizeof *jobs);
    long long *heap = malloc((size_t)n * sizeof *heap);
    if (jobs == NULL || heap == NULL) {
        free(jobs);
        free(heap);
        return 1;
    }

    for (int i = 0; i < n; i++) {
        if (scanf("%lld %lld", &jobs[i].deadline, &jobs[i].profit) != 2) {
            free(jobs);
            free(heap);
            return 0;
        }
    }

    qsort(jobs, (size_t)n, sizeof *jobs, compare_jobs);

    int size = 0;
    for (int i = 0; i < n; i++) {
        heap_push(heap, &size, jobs[i].profit);
        if ((long long)size > jobs[i].deadline) {
            heap_pop(heap, &size);
        }
    }

    long long total = 0;
    for (int i = 0; i < size; i++) {
        total += heap[i];
    }

    printf("%lld\n", total);

    free(jobs);
    free(heap);
    return 0;
}
