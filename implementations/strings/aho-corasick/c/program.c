#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/*
 * Aho-Corasick over the lowercase Latin alphabet.
 *
 * Input: n, then n patterns on separate lines, then the text on the last line.
 * Output: one line per pattern, holding the number of its occurrences in the
 * text, overlapping occurrences included.
 *
 * The trie stores 26 transitions per node, all initialized to -1. The failure
 * links are built in breadth-first order, and a missing transition is filled
 * with the transition of the failure link, so the scan performs one lookup per
 * text character. The counters are then pushed up the failure tree in reverse
 * breadth-first order, which counts the occurrences without enumerating them.
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

static void release_patterns(char **pats, size_t *lens, int n) {
    int i;
    if (pats != NULL) {
        for (i = 0; i < n; ++i) {
            free(pats[i]);
        }
        free(pats);
    }
    free(lens);
}

int main(void) {
    char *line = NULL;
    size_t line_cap = 0;
    size_t line_len = 0;
    char **pats = NULL;
    size_t *lens = NULL;
    char *text = NULL;
    size_t text_cap = 0;
    size_t text_len = 0;
    int *go = NULL;
    int *fail = NULL;
    long long *count = NULL;
    int *terminal = NULL;
    int *order = NULL;
    int n;
    int i;
    int j;
    int c;
    int nodes;
    int head;
    int tail;
    int state;
    size_t total = 0;
    size_t max_nodes;

    if (read_line(&line, &line_cap, &line_len) <= 0) {
        free(line);
        return 0;
    }

    n = (int)strtol(line, NULL, 10);
    free(line);
    if (n < 0) {
        n = 0;
    }
    if (n == 0) {
        return 0;
    }

    pats = (char **)calloc((size_t)n, sizeof *pats);
    lens = (size_t *)calloc((size_t)n, sizeof *lens);
    if (pats == NULL || lens == NULL) {
        release_patterns(pats, lens, n);
        return 1;
    }

    for (i = 0; i < n; ++i) {
        size_t cap = 0;
        int got = read_line(&pats[i], &cap, &lens[i]);
        if (got < 0) {
            release_patterns(pats, lens, n);
            return 1;
        }
        if (got == 0) {
            lens[i] = 0;
        }
        total += lens[i];
    }

    max_nodes = total + 1;
    go = (int *)malloc(max_nodes * 26 * sizeof *go);
    fail = (int *)calloc(max_nodes, sizeof *fail);
    count = (long long *)calloc(max_nodes, sizeof *count);
    terminal = (int *)malloc((size_t)n * sizeof *terminal);
    order = (int *)malloc(max_nodes * sizeof *order);
    if (go == NULL || fail == NULL || count == NULL || terminal == NULL || order == NULL) {
        release_patterns(pats, lens, n);
        free(go);
        free(fail);
        free(count);
        free(terminal);
        free(order);
        return 1;
    }

    for (i = 0; i < (int)(max_nodes * 26); ++i) {
        go[i] = -1;
    }

    /* Insert every pattern, remembering the terminal node of each one. */
    nodes = 1;
    for (i = 0; i < n; ++i) {
        int v = 0;
        for (j = 0; j < (int)lens[i]; ++j) {
            c = (unsigned char)pats[i][j] - 'a';
            if (c < 0 || c >= 26) {
                continue;
            }
            if (go[v * 26 + c] == -1) {
                go[v * 26 + c] = nodes;
                ++nodes;
            }
            v = go[v * 26 + c];
        }
        terminal[i] = v;
    }

    /* Build the failure links and complete the transition table. */
    head = 0;
    tail = 0;
    for (c = 0; c < 26; ++c) {
        int u = go[c];
        if (u == -1) {
            go[c] = 0;
        } else {
            fail[u] = 0;
            order[tail++] = u;
        }
    }
    while (head < tail) {
        int v = order[head++];
        int fv = fail[v];
        for (c = 0; c < 26; ++c) {
            int u = go[v * 26 + c];
            if (u == -1) {
                go[v * 26 + c] = go[fv * 26 + c];
            } else {
                fail[u] = go[fv * 26 + c];
                order[tail++] = u;
            }
        }
    }

    if (read_line(&text, &text_cap, &text_len) < 0) {
        release_patterns(pats, lens, n);
        free(go);
        free(fail);
        free(count);
        free(terminal);
        free(order);
        free(text);
        return 1;
    }

    state = 0;
    for (j = 0; j < (int)text_len; ++j) {
        c = (unsigned char)text[j] - 'a';
        if (c < 0 || c >= 26) {
            continue;
        }
        state = go[state * 26 + c];
        ++count[state];
    }

    for (i = tail - 1; i >= 0; --i) {
        int v = order[i];
        count[fail[v]] += count[v];
    }

    for (i = 0; i < n; ++i) {
        printf("%lld\n", count[terminal[i]]);
    }

    release_patterns(pats, lens, n);
    free(go);
    free(fail);
    free(count);
    free(terminal);
    free(order);
    free(text);
    return 0;
}
