#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/*
 * Suffix tree of s + '$', built by inserting every suffix and splitting edges
 * when two suffixes diverge inside one.  The two answers are sums over the
 * edges: the total edge length counts every distinct substring of s + '$',
 * and the deepest node with two children is the longest repeated substring.
 */

int main(void) {
    char line[4096];
    if (fgets(line, sizeof line, stdin) == NULL) return 0;

    int n = (int)strlen(line);
    while (n > 0 && (line[n - 1] == '\n' || line[n - 1] == '\r')) --n;
    line[n] = '\0';

    int N = n + 1;
    char *t = malloc((size_t)N + 1);
    if (t == NULL) return 1;
    memcpy(t, line, (size_t)n);
    t[n] = '$';
    t[N] = '\0';

    int cap = 2 * N + 2;
    int *child = malloc((size_t)cap * 27 * sizeof *child);
    int *edgeStart = calloc((size_t)cap, sizeof *edgeStart);
    int *edgeLen = calloc((size_t)cap, sizeof *edgeLen);
    int *depth = calloc((size_t)cap, sizeof *depth);
    int *childCount = calloc((size_t)cap, sizeof *childCount);
    if (child == NULL || edgeStart == NULL || edgeLen == NULL || depth == NULL ||
        childCount == NULL) {
        return 1;
    }
    for (int i = 0; i < cap * 27; ++i) child[i] = -1;

    int size = 1;
    for (int i = 0; i < N; ++i) {
        int v = 0;
        int pos = i;
        for (;;) {
            int c = t[pos] == '$' ? 26 : t[pos] - 'a';
            int u = child[v * 27 + c];
            if (u == -1) {
                u = size++;
                edgeStart[u] = pos;
                edgeLen[u] = N - pos;
                depth[u] = depth[v] + edgeLen[u];
                child[v * 27 + c] = u;
                ++childCount[v];
                break;
            }

            int maxl = edgeLen[u] < N - pos ? edgeLen[u] : N - pos;
            int l = 0;
            while (l < maxl && t[edgeStart[u] + l] == t[pos + l]) ++l;

            if (l == edgeLen[u]) {
                v = u;
                pos += l;
                if (pos == N) break;
            } else {
                int w = size++;
                child[v * 27 + c] = w;
                edgeStart[w] = edgeStart[u];
                edgeLen[w] = l;
                depth[w] = depth[v] + l;

                int code = t[edgeStart[u] + l] == '$' ? 26 : t[edgeStart[u] + l] - 'a';
                child[w * 27 + code] = u;
                ++childCount[w];
                edgeStart[u] += l;
                edgeLen[u] -= l;

                int leaf = size++;
                edgeStart[leaf] = pos + l;
                edgeLen[leaf] = N - (pos + l);
                depth[leaf] = depth[w] + edgeLen[leaf];
                code = t[pos + l] == '$' ? 26 : t[pos + l] - 'a';
                child[w * 27 + code] = leaf;
                ++childCount[w];
                break;
            }
        }
    }

    long long total = 0;
    int best = 0;
    for (int v = 1; v < size; ++v) {
        total += edgeLen[v];
        if (childCount[v] >= 2 && depth[v] > best) best = depth[v];
    }

    printf("%lld\n%d\n", total - (long long)N, best);

    free(child);
    free(edgeStart);
    free(edgeLen);
    free(depth);
    free(childCount);
    free(t);
    return 0;
}
