#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int q;
    if (scanf("%d", &q) != 1) return 0;

    int *value = malloc((size_t)(q + 1) * sizeof(int));
    int *parent = malloc((size_t)(q + 1) * sizeof(int));
    int *root = malloc((size_t)(q + 1) * sizeof(int));
    if (value == NULL || parent == NULL || root == NULL) {
        free(value);
        free(parent);
        free(root);
        return 1;
    }

    root[0] = -1;
    int nodes = 0;
    int versions = 0;

    for (int i = 0; i < q; ++i) {
        int type;
        int v;
        if (scanf("%d %d", &type, &v) != 2) break;

        if (type == 1) {
            int x;
            if (scanf("%d", &x) != 1) break;
            value[nodes] = x;
            parent[nodes] = root[v];
            ++versions;
            root[versions] = nodes;
            ++nodes;
        } else if (type == 2) {
            int old = root[v];
            ++versions;
            root[versions] = (old == -1) ? -1 : parent[old];
        } else {
            int top = root[v];
            printf("%d\n", (top == -1) ? -1 : value[top]);
        }
    }

    free(value);
    free(parent);
    free(root);
    return 0;
}
