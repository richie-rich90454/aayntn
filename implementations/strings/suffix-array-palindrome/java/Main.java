// The suffix-array-based palindrome method.
//
// Input: one nonempty string of lowercase Latin letters, length at most 100000.
// Output: the length of the longest palindromic substring and its first
// 0-based starting position, one per line.
//
// The program builds the suffix array and the LCP array of s # reverse(s),
// answers longest-common-prefix queries with a sparse table over the LCP
// array, and binary searches the palindrome radius at every center.

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Main {
    private static int N;
    private static int[] rank;
    private static int[] lg;
    private static int[][] st;

    private static int lcpQuery(int i, int j) {
        if (i == j) return N - i;
        int a = rank[i];
        int b = rank[j];
        if (a > b) {
            int t = a;
            a = b;
            b = t;
        }
        a += 1;
        int len = b - a + 1;
        int k = lg[len];
        int x = st[k][a];
        int y = st[k][b - (1 << k) + 1];
        return x < y ? x : y;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine();
        if (s == null) s = "";
        s = s.trim();
        int n = s.length();
        if (n == 0) {
            System.out.print("0\n0\n");
            return;
        }

        String u = s + "#" + new StringBuilder(s).reverse();
        N = u.length();
        char[] chars = u.toCharArray();

        int[] sa = new int[N];
        rank = new int[N];
        int[] tmp = new int[N];
        int[] y = new int[N];
        int[] cnt = new int[Math.max(N, 256)];

        for (int i = 0; i < N; ++i) ++cnt[chars[i]];
        for (int i = 1; i < 256; ++i) cnt[i] += cnt[i - 1];
        for (int i = N - 1; i >= 0; --i) {
            int c = chars[i];
            sa[--cnt[c]] = i;
        }

        int classes = 0;
        rank[sa[0]] = 0;
        for (int i = 1; i < N; ++i) {
            if (chars[sa[i]] != chars[sa[i - 1]]) ++classes;
            rank[sa[i]] = classes;
        }

        for (int k = 1; k < N && classes < N - 1; k <<= 1) {
            int p = 0;
            for (int i = N - k; i < N; ++i) y[p++] = i;
            for (int i = 0; i < N; ++i) {
                if (sa[i] >= k) y[p++] = sa[i] - k;
            }

            java.util.Arrays.fill(cnt, 0, classes + 1, 0);
            for (int i = 0; i < N; ++i) ++cnt[rank[i]];
            for (int i = 1; i <= classes; ++i) cnt[i] += cnt[i - 1];
            for (int i = N - 1; i >= 0; --i) {
                int v = y[i];
                sa[--cnt[rank[v]]] = v;
            }

            tmp = java.util.Arrays.copyOf(rank, N);
            classes = 0;
            rank[sa[0]] = 0;
            for (int i = 1; i < N; ++i) {
                int a = sa[i - 1];
                int b = sa[i];
                int a2 = (a + k < N) ? tmp[a + k] : -1;
                int b2 = (b + k < N) ? tmp[b + k] : -1;
                if (tmp[a] != tmp[b] || a2 != b2) ++classes;
                rank[b] = classes;
            }
        }

        for (int i = 0; i < N; ++i) rank[sa[i]] = i;

        int[] lcp = new int[N];
        int h = 0;
        for (int i = 0; i < N; ++i) {
            int r = rank[i];
            if (r == 0) {
                h = 0;
                continue;
            }
            int j = sa[r - 1];
            while (i + h < N && j + h < N && chars[i + h] == chars[j + h]) ++h;
            lcp[r] = h;
            if (h > 0) --h;
        }

        lg = new int[N + 1];
        for (int i = 2; i <= N; ++i) lg[i] = lg[i / 2] + 1;
        int levels = lg[N] + 1;
        st = new int[levels][N];
        System.arraycopy(lcp, 0, st[0], 0, N);
        for (int j = 1; j < levels; ++j) {
            int span = 1 << (j - 1);
            int limit = N - (1 << j) + 1;
            for (int i = 0; i < limit; ++i) {
                st[j][i] = Math.min(st[j - 1][i], st[j - 1][i + span]);
            }
        }

        int bestLen = 0;
        int bestStart = 0;

        for (int c = 0; c < n; ++c) {
            int radius = Math.min(c, n - 1 - c);
            int lo = 0;
            int hi = radius;
            while (lo < hi) {
                int mid = (lo + hi + 1) / 2;
                if (lcpQuery(c, 2 * n - c) >= mid + 1) {
                    lo = mid;
                } else {
                    hi = mid - 1;
                }
            }
            int len = 2 * lo + 1;
            int start = c - lo;
            if (len > bestLen || (len == bestLen && start < bestStart)) {
                bestLen = len;
                bestStart = start;
            }
        }

        for (int c = 1; c < n; ++c) {
            int radius = Math.min(c, n - c);
            int lo = 0;
            int hi = radius;
            while (lo < hi) {
                int mid = (lo + hi + 1) / 2;
                if (lcpQuery(c, 2 * n + 1 - c) >= mid) {
                    lo = mid;
                } else {
                    hi = mid - 1;
                }
            }
            int len = 2 * lo;
            int start = c - lo;
            if (len > bestLen || (len == bestLen && start < bestStart)) {
                bestLen = len;
                bestStart = start;
            }
        }

        StringBuilder out = new StringBuilder();
        out.append(bestLen).append('\n').append(bestStart).append('\n');
        System.out.print(out);
    }
}
