#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/*
 * The suffix automaton of a string.
 *
 * Input: one line holding a nonempty string of lowercase Latin letters.
 * Output: the number of distinct nonempty substrings, then the number of
 * occurrences of the lexicographically smallest nonempty substring.
 *
 * The automaton is built online. Each extension creates one state for the new
 * prefix and, when a class must split, one clone. Prefix states are seeded with
 * one occurrence and clones with zero, and the counters are pushed up the
 * suffix links in decreasing length order, so the count at a state is the size
 * of its end-position set. The distinct-substring count is the sum of
 * len[v] - len[link[v]] over the non-initial states.
 */

/* Reads one line into a growable buffer. Returns 1 on success, 0 at end of
 * input with no characters read, and -1 on an allocation failure. */
static int read_line(char **buf, size_t *cap, size_t *len) {
    size_t used = 0;
    int c;

    if (*buf == NULL) {
        *cap = 64;
        *buf = (char *)malloc(*cap);
        if (*buf == NULL) {
            return -1;
        }
    }

    while ((c = fgetc(stdin)) != EOF && c != '\n') {
        if (used + 2 > *cap) {
            size_t next = *cap * 2;
            char *grown = (char *)realloc(*buf, next);
            if (grown == NULL) {
                return -1;
            }
            *buf = grown;
            *cap = next;
        }
        (*buf)[used++] = (char)c;
    }

    while (used > 0 && (*buf)[used - 1] == '\r') {
        --used;
    }
    (*buf)[used] = '\0';
    *len = used;

    if (c == EOF && used == 0) {
        return 0;
    }
    return 1;
}

int main(void) {
    char *s = NULL;
    size_t capacity = 0;
    size_t length = 0;
    int n;
    int states;
    int *go = NULL;
    int *link = NULL;
    int *max_len = NULL;
    long long *count = NULL;
    int *order = NULL;
    int *bucket = NULL;
    int size;
    int last;
    int i;
    int c;
    int cur;
    int p;
    int q;
    int clone;
    int v;
    int smallest;
    int target;
    long long distinct;

    if (read_line(&s, &capacity, &length) <= 0 || length == 0) {
        printf("0\n0\n");
        free(s);
        return 0;
    }
    if (length > (size_t)(2147483647 - 2) / 2) {
        free(s);
        return 1;
    }

    n = (int)length;
    states = 2 * n + 2;
    go = (int *)malloc((size_t)states * 26 * sizeof *go);
    link = (int *)malloc((size_t)states * sizeof *link);
    max_len = (int *)malloc((size_t)states * sizeof *max_len);
    count = (long long *)calloc((size_t)states, sizeof *count);
    order = (int *)malloc((size_t)(states - 1) * sizeof *order);
    bucket = (int *)calloc((size_t)n + 1, sizeof *bucket);
    if (go == NULL || link == NULL || max_len == NULL || count == NULL || order == NULL ||
        bucket == NULL) {
        free(go);
        free(link);
        free(max_len);
        free(count);
        free(order);
        free(bucket);
        free(s);
        return 1;
    }

    memset(go, 0xFF, (size_t)states * 26 * sizeof *go);
    for (i = 0; i < states; ++i) {
        link[i] = -1;
        max_len[i] = 0;
    }

    size = 1;
    last = 0;
    for (i = 0; i < n; ++i) {
        c = (unsigned char)s[i] - 'a';
        cur = size++;
        max_len[cur] = max_len[last] + 1;
        count[cur] = 1;

        p = last;
        while (p != -1 && go[(size_t)p * 26 + c] == -1) {
            go[(size_t)p * 26 + c] = cur;
            p = link[p];
        }

        if (p == -1) {
            link[cur] = 0;
        } else {
            q = go[(size_t)p * 26 + c];
            if (max_len[p] + 1 == max_len[q]) {
                link[cur] = q;
            } else {
                clone = size++;
                max_len[clone] = max_len[p] + 1;
                memcpy(go + (size_t)clone * 26, go + (size_t)q * 26, 26 * sizeof *go);
                link[clone] = link[q];
                count[clone] = 0;

                while (p != -1 && go[(size_t)p * 26 + c] == q) {
                    go[(size_t)p * 26 + c] = clone;
                    p = link[p];
                }
                link[q] = clone;
                link[cur] = clone;
            }
        }
        last = cur;
    }

    for (v = 1; v < size; ++v) {
        ++bucket[max_len[v]];
    }
    for (i = 1; i <= n; ++i) {
        bucket[i] += bucket[i - 1];
    }
    for (v = size - 1; v >= 1; --v) {
        order[--bucket[max_len[v]]] = v;
    }
    for (i = size - 2; i >= 0; --i) {
        v = order[i];
        count[link[v]] += count[v];
    }

    distinct = 0;
    for (v = 1; v < size; ++v) {
        distinct += (long long)(max_len[v] - max_len[link[v]]);
    }

    smallest = 25;
    for (i = 0; i < n; ++i) {
        c = (unsigned char)s[i] - 'a';
        if (c < smallest) {
            smallest = c;
        }
    }
    target = go[smallest];

    printf("%lld\n%lld\n", distinct, count[target]);

    free(go);
    free(link);
    free(max_len);
    free(count);
    free(order);
    free(bucket);
    free(s);
    return 0;
}
