#include <stdio.h>
#include <stdlib.h>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

/*
 * A hash set of nonnegative colors, with open addressing and linear probing.
 * The value -1 marks an empty slot, so every color must be nonnegative.
 */
typedef struct {
    int *slots;
    int capacity;
    int size;
} color_set;

static int slot_for(int color, int capacity) {
    unsigned int value = (unsigned int)color;
    value ^= value >> 16;
    value *= 0x7feb352du;
    value ^= value >> 15;
    return (int)(value & (unsigned int)(capacity - 1));
}

static int set_init(color_set *set) {
    set->capacity = 8;
    set->size = 0;
    set->slots = malloc((size_t)set->capacity * sizeof *set->slots);
    if (set->slots == NULL) {
        return 0;
    }
    for (int i = 0; i < set->capacity; i++) {
        set->slots[i] = -1;
    }
    return 1;
}

static void set_release(color_set *set) {
    free(set->slots);
    set->slots = NULL;
    set->capacity = 0;
    set->size = 0;
}

static int set_grow(color_set *set) {
    const int capacity = set->capacity * 2;
    int *slots = malloc((size_t)capacity * sizeof *slots);
    if (slots == NULL) {
        return 0;
    }
    for (int i = 0; i < capacity; i++) {
        slots[i] = -1;
    }
    for (int i = 0; i < set->capacity; i++) {
        const int color = set->slots[i];
        if (color == -1) {
            continue;
        }
        int position = slot_for(color, capacity);
        while (slots[position] != -1) {
            position = (position + 1) & (capacity - 1);
        }
        slots[position] = color;
    }
    free(set->slots);
    set->slots = slots;
    set->capacity = capacity;
    return 1;
}

/* Returns 1 when the color was absent, 0 when it was present, and -1 on failure. */
static int set_insert(color_set *set, int color) {
    if ((set->size + 1) * 10 >= set->capacity * 7) {
        if (!set_grow(set)) {
            return -1;
        }
    }
    int position = slot_for(color, set->capacity);
    while (set->slots[position] != -1) {
        if (set->slots[position] == color) {
            return 0;
        }
        position = (position + 1) & (set->capacity - 1);
    }
    set->slots[position] = color;
    set->size++;
    return 1;
}

/* Inserts every color of from into into. Returns 0 when an insertion fails. */
static int set_merge(color_set *into, const color_set *from) {
    for (int i = 0; i < from->capacity; i++) {
        if (from->slots[i] == -1) {
            continue;
        }
        if (set_insert(into, from->slots[i]) < 0) {
            return 0;
        }
    }
    return 1;
}

int main(void) {
    /*
     * The language variants must agree byte for byte, so the line feed must
     * not depend on the platform: binary mode keeps "\n" from becoming
     * "\r\n" on Windows.
     */
#ifdef _WIN32
    _setmode(_fileno(stdout), _O_BINARY);
#endif

    int n = 0;
    if (scanf("%d", &n) != 1 || n <= 0) {
        return 0;
    }

    int *color = malloc((size_t)n * sizeof *color);
    int *parent = malloc((size_t)n * sizeof *parent);
    int *answer = malloc((size_t)n * sizeof *answer);
    int *weight = malloc((size_t)n * sizeof *weight);
    color_set *sets = malloc((size_t)n * sizeof *sets);
    if (color == NULL || parent == NULL || answer == NULL || weight == NULL || sets == NULL) {
        free(color);
        free(parent);
        free(answer);
        free(weight);
        free(sets);
        return 1;
    }

    for (int v = 0; v < n; v++) {
        if (scanf("%d", &color[v]) != 1) {
            color[v] = 0;
        }
    }
    parent[0] = -1;
    for (int v = 1; v < n; v++) {
        int p = 0;
        if (scanf("%d", &p) != 1) {
            p = 0;
        }
        /* The contract numbers parents before children; a bad index falls back to the root. */
        parent[v] = (p >= 0 && p < v) ? p : 0;
    }

    for (int v = 0; v < n; v++) {
        if (!set_init(&sets[v]) || set_insert(&sets[v], color[v]) < 0) {
            for (int u = 0; u <= v; u++) {
                set_release(&sets[u]);
            }
            free(color);
            free(parent);
            free(answer);
            free(weight);
            free(sets);
            return 1;
        }
        answer[v] = 1;
        weight[v] = 1;
    }

    /*
     * Every child has a larger index than its parent, so this reverse sweep is
     * a postorder: when v is reached, all of its children are already in its set.
     */
    for (int v = n - 1; v >= 1; v--) {
        answer[v] = sets[v].size;
        const int p = parent[v];
        /*
         * Keep the larger live component as the base and pour the smaller one
         * into it. The weight counts the vertices the component represents, so
         * the component that holds a moved element at least doubles.
         */
        if (weight[p] < weight[v]) {
            const color_set set_swap = sets[p];
            sets[p] = sets[v];
            sets[v] = set_swap;
            const int weight_swap = weight[p];
            weight[p] = weight[v];
            weight[v] = weight_swap;
        }
        if (!set_merge(&sets[p], &sets[v])) {
            for (int u = 0; u < n; u++) {
                if (u != v) {
                    set_release(&sets[u]);
                }
            }
            free(color);
            free(parent);
            free(answer);
            free(weight);
            free(sets);
            return 1;
        }
        weight[p] += weight[v];
        set_release(&sets[v]);
    }
    answer[0] = sets[0].size;

    for (int v = 0; v < n; v++) {
        printf("%d\n", answer[v]);
    }

    set_release(&sets[0]);
    free(color);
    free(parent);
    free(answer);
    free(weight);
    free(sets);
    return 0;
}
