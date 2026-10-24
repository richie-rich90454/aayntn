#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/*
 * Palindrome tree (eertree) over the lowercase Latin alphabet.
 *
 * Input: one line holding the string.
 * Output: two lines, the number of distinct nonempty palindromic substrings and
 * the number of palindromic substrings counting multiplicity.
 *
 * Two roots are kept. Node 0 has length -1 and stands for the imaginary string
 * that makes a single character the child of a real node. Node 1 has length 0
 * and stands for the empty palindrome. Every other node is one distinct
 * palindrome. An edge labeled c adds c to both ends of its parent, and the
 * suffix link of a node is its longest proper palindromic suffix.
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
    char *text = NULL;
    size_t cap = 0;
    size_t used = 0;
    int *len = NULL;
    int *link = NULL;
    int *head = NULL;
    int *to = NULL;
    int *next = NULL;
    int *label = NULL;
    long long *occ = NULL;
    int n;
    int size;
    int nodes;
    int last;
    int edges;
    int i;

    if (read_line(&text, &cap, &used) < 0) {
        free(text);
        return 1;
    }

    n = (int)used;
    size = n + 2;
    len = (int *)calloc((size_t)size, sizeof *len);
    link = (int *)calloc((size_t)size, sizeof *link);
    head = (int *)malloc((size_t)size * sizeof *head);
    to = (int *)malloc((size_t)size * sizeof *to);
    next = (int *)malloc((size_t)size * sizeof *next);
    label = (int *)malloc((size_t)size * sizeof *label);
    occ = (long long *)calloc((size_t)size, sizeof *occ);
    if (len == NULL || link == NULL || head == NULL || to == NULL || next == NULL ||
        label == NULL || occ == NULL) {
        free(text);
        free(len);
        free(link);
        free(head);
        free(to);
        free(next);
        free(label);
        free(occ);
        return 1;
    }

    for (i = 0; i < size; ++i) {
        head[i] = -1;
    }
    len[0] = -1;
    link[0] = 0;
    len[1] = 0;
    link[1] = 0;

    nodes = 2;
    last = 1;
    edges = 0;

    for (i = 0; i < n; ++i) {
        int cur = last;
        int at;
        int code = (unsigned char)text[i];
        int child = -1;
        int edge;

        for (;;) {
            at = i - 1 - len[cur];
            if (at >= 0 && text[at] == text[i]) {
                break;
            }
            cur = link[cur];
        }

        for (edge = head[cur]; edge != -1; edge = next[edge]) {
            if (label[edge] == code) {
                child = to[edge];
                break;
            }
        }

        if (child == -1) {
            int temp;
            int found;

            child = nodes;
            ++nodes;
            len[child] = len[cur] + 2;
            head[child] = -1;
            label[edges] = code;
            to[edges] = child;
            next[edges] = head[cur];
            head[cur] = edges;
            ++edges;

            if (len[child] == 1) {
                link[child] = 1;
            } else {
                temp = link[cur];
                for (;;) {
                    at = i - 1 - len[temp];
                    if (at >= 0 && text[at] == text[i]) {
                        break;
                    }
                    temp = link[temp];
                }
                found = -1;
                for (edge = head[temp]; edge != -1; edge = next[edge]) {
                    if (label[edge] == code) {
                        found = to[edge];
                        break;
                    }
                }
                link[child] = found;
            }
        }

        last = child;
        ++occ[last];
    }

    for (i = nodes - 1; i >= 2; --i) {
        occ[link[i]] += occ[i];
    }

    {
        long long total = 0;
        for (i = 2; i < nodes; ++i) {
            total += occ[i];
        }
        printf("%d\n%lld\n", nodes - 2, total);
    }

    free(text);
    free(len);
    free(link);
    free(head);
    free(to);
    free(next);
    free(label);
    free(occ);
    return 0;
}
