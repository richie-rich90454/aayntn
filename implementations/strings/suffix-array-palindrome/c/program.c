/*
 * The suffix-array-based palindrome method.
 *
 * Input: one nonempty string of lowercase Latin letters, length at most 100000.
 * Output: the length of the longest palindromic substring and its first
 * 0-based starting position, one per line.
 *
 * The program builds the suffix array and the LCP array of s # reverse(s),
 * answers longest-common-prefix queries with a sparse table over the LCP
 * array, and binary searches the palindrome radius at every center.
 */

#include <stdio.h>
#include <string.h>

#define MAXN 100005
#define MAXU 200010
#define LOG 19

static char s[MAXN];
static char u[MAXU];
static int sa[MAXU];
static int rank_arr[MAXU];
static int tmp[MAXU];
static int y_buf[MAXU];
static int cnt[MAXU];
static int lcp[MAXU];
static int lg[MAXU];
static int st[LOG][MAXU];
static int N;

static void build_suffix_array(void) {
    int i;
    int classes = 0;
    int k = 1;

    memset(cnt, 0, 256 * sizeof(int));
    for (i = 0; i < N; ++i) ++cnt[(unsigned char)u[i]];
    for (i = 1; i < 256; ++i) cnt[i] += cnt[i - 1];
    for (i = N - 1; i >= 0; --i) {
        int c = (unsigned char)u[i];
        --cnt[c];
        sa[cnt[c]] = i;
    }

    rank_arr[sa[0]] = 0;
    for (i = 1; i < N; ++i) {
        if (u[sa[i]] != u[sa[i - 1]]) ++classes;
        rank_arr[sa[i]] = classes;
    }

    while (k < N && classes < N - 1) {
        int p = 0;
        for (i = N - k; i < N; ++i) y_buf[p++] = i;
        for (i = 0; i < N; ++i) {
            if (sa[i] >= k) y_buf[p++] = sa[i] - k;
        }

        memset(cnt, 0, (size_t)(classes + 1) * sizeof(int));
        for (i = 0; i < N; ++i) ++cnt[rank_arr[i]];
        for (i = 1; i <= classes; ++i) cnt[i] += cnt[i - 1];
        for (i = N - 1; i >= 0; --i) {
            int v = y_buf[i];
            --cnt[rank_arr[v]];
            sa[cnt[rank_arr[v]]] = v;
        }

        for (i = 0; i < N; ++i) tmp[i] = rank_arr[i];
        classes = 0;
        rank_arr[sa[0]] = 0;
        for (i = 1; i < N; ++i) {
            int a = sa[i - 1];
            int b = sa[i];
            int a2 = (a + k < N) ? tmp[a + k] : -1;
            int b2 = (b + k < N) ? tmp[b + k] : -1;
            if (tmp[a] != tmp[b] || a2 != b2) ++classes;
            rank_arr[b] = classes;
        }
        k *= 2;
    }

    for (i = 0; i < N; ++i) rank_arr[sa[i]] = i;
}

static void build_lcp(void) {
    int i;
    int h = 0;
    lcp[0] = 0;
    for (i = 0; i < N; ++i) {
        int r = rank_arr[i];
        if (r == 0) {
            h = 0;
            continue;
        }
        {
            int j = sa[r - 1];
            while (i + h < N && j + h < N && u[i + h] == u[j + h]) ++h;
            lcp[r] = h;
            if (h > 0) --h;
        }
    }
}

static void build_sparse_table(void) {
    int i;
    int j;
    int levels;

    lg[1] = 0;
    for (i = 2; i <= N; ++i) lg[i] = lg[i / 2] + 1;
    levels = lg[N] + 1;

    for (i = 0; i < N; ++i) st[0][i] = lcp[i];
    for (j = 1; j < levels; ++j) {
        int span = 1 << (j - 1);
        int limit = N - (1 << j) + 1;
        for (i = 0; i < limit; ++i) {
            int a = st[j - 1][i];
            int b = st[j - 1][i + span];
            st[j][i] = a < b ? a : b;
        }
    }
}

static int lcp_query(int i, int j) {
    int a;
    int b;
    int len;
    int k;
    int x;
    int y;

    if (i == j) return N - i;
    a = rank_arr[i];
    b = rank_arr[j];
    if (a > b) {
        int t = a;
        a = b;
        b = t;
    }
    ++a;
    len = b - a + 1;
    k = lg[len];
    x = st[k][a];
    y = st[k][b - (1 << k) + 1];
    return x < y ? x : y;
}

int main(void) {
    int n;
    int i;
    int c;
    int best_len = 0;
    int best_start = 0;

    if (scanf("%100000s", s) != 1) {
        printf("0\n0\n");
        return 0;
    }
    n = (int)strlen(s);
    if (n == 0) {
        printf("0\n0\n");
        return 0;
    }

    N = 2 * n + 1;
    for (i = 0; i < n; ++i) u[i] = s[i];
    u[n] = '#';
    for (i = 0; i < n; ++i) u[n + 1 + i] = s[n - 1 - i];
    u[N] = '\0';

    build_suffix_array();
    build_lcp();
    build_sparse_table();

    for (c = 0; c < n; ++c) {
        int radius = c < n - 1 - c ? c : n - 1 - c;
        int lo = 0;
        int hi = radius;
        while (lo < hi) {
            int mid = (lo + hi + 1) / 2;
            if (lcp_query(c, 2 * n - c) >= mid + 1) {
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }
        {
            int len = 2 * lo + 1;
            int start = c - lo;
            if (len > best_len || (len == best_len && start < best_start)) {
                best_len = len;
                best_start = start;
            }
        }
    }

    for (c = 1; c < n; ++c) {
        int radius = c < n - c ? c : n - c;
        int lo = 0;
        int hi = radius;
        while (lo < hi) {
            int mid = (lo + hi + 1) / 2;
            if (lcp_query(c, 2 * n + 1 - c) >= mid) {
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }
        {
            int len = 2 * lo;
            int start = c - lo;
            if (len > best_len || (len == best_len && start < best_start)) {
                best_len = len;
                best_start = start;
            }
        }
    }

    printf("%d\n%d\n", best_len, best_start);
    return 0;
}
