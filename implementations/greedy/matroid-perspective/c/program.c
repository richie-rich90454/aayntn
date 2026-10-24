#include <stdio.h>
#include <stdlib.h>

typedef struct {
    long long color;
    long long weight;
} Item;

static int compare_items(const void *left, const void *right) {
    const Item *a = (const Item *)left;
    const Item *b = (const Item *)right;
    if (a->color != b->color) {
        return (a->color > b->color) - (a->color < b->color);
    }
    return (a->weight < b->weight) - (a->weight > b->weight);
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

    Item *items = malloc((size_t)n * sizeof *items);
    if (items == NULL) {
        return 0;
    }
    for (int i = 0; i < n; i++) {
        items[i].color = 0;
        items[i].weight = 0;
        if (scanf("%lld %lld", &items[i].color, &items[i].weight) != 2) {
            free(items);
            return 0;
        }
    }

    qsort(items, (size_t)n, sizeof *items, compare_items);

    /* The first item of every color is its heaviest item. */
    long long total = 0;
    int first = 1;
    long long previous = 0;
    for (int i = 0; i < n; i++) {
        if (first || items[i].color != previous) {
            total += items[i].weight;
            previous = items[i].color;
            first = 0;
        }
    }

    printf("%lld\n", total);
    free(items);
    return 0;
}
