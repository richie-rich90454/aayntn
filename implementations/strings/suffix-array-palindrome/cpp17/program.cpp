// The suffix-array-based palindrome method.
//
// Input: one nonempty string of lowercase Latin letters, length at most 100000.
// Output: the length of the longest palindromic substring and its first
// 0-based starting position, one per line.
//
// The program builds the suffix array and the LCP array of s # reverse(s),
// answers longest-common-prefix queries with a sparse table over the LCP
// array, and binary searches the palindrome radius at every center.

#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string s;
    if (!(std::cin >> s)) {
        std::cout << "0\n0\n";
        return 0;
    }
    const int n = static_cast<int>(s.size());
    if (n == 0) {
        std::cout << "0\n0\n";
        return 0;
    }

    std::string u = s;
    u.push_back('#');
    for (int i = n - 1; i >= 0; --i) u.push_back(s[i]);
    const int N = static_cast<int>(u.size());

    std::vector<int> sa(N), rank_(N), tmp(N), y(N);
    std::vector<int> cnt(std::max(N, 256), 0);

    for (int i = 0; i < N; ++i) ++cnt[static_cast<unsigned char>(u[i])];
    for (int i = 1; i < 256; ++i) cnt[i] += cnt[i - 1];
    for (int i = N - 1; i >= 0; --i) {
        const int c = static_cast<unsigned char>(u[i]);
        sa[--cnt[c]] = i;
    }

    int classes = 0;
    rank_[sa[0]] = 0;
    for (int i = 1; i < N; ++i) {
        if (u[sa[i]] != u[sa[i - 1]]) ++classes;
        rank_[sa[i]] = classes;
    }

    for (int k = 1; k < N && classes < N - 1; k <<= 1) {
        int p = 0;
        for (int i = N - k; i < N; ++i) y[p++] = i;
        for (int i = 0; i < N; ++i) {
            if (sa[i] >= k) y[p++] = sa[i] - k;
        }

        std::fill(cnt.begin(), cnt.begin() + classes + 1, 0);
        for (int i = 0; i < N; ++i) ++cnt[rank_[i]];
        for (int i = 1; i <= classes; ++i) cnt[i] += cnt[i - 1];
        for (int i = N - 1; i >= 0; --i) {
            const int v = y[i];
            sa[--cnt[rank_[v]]] = v;
        }

        tmp = rank_;
        classes = 0;
        rank_[sa[0]] = 0;
        for (int i = 1; i < N; ++i) {
            const int a = sa[i - 1];
            const int b = sa[i];
            const int a2 = (a + k < N) ? tmp[a + k] : -1;
            const int b2 = (b + k < N) ? tmp[b + k] : -1;
            if (tmp[a] != tmp[b] || a2 != b2) ++classes;
            rank_[b] = classes;
        }
    }

    for (int i = 0; i < N; ++i) rank_[sa[i]] = i;

    std::vector<int> lcp(N, 0), lg(N + 1, 0);
    int h = 0;
    for (int i = 0; i < N; ++i) {
        const int r = rank_[i];
        if (r == 0) {
            h = 0;
            continue;
        }
        const int j = sa[r - 1];
        while (i + h < N && j + h < N && u[i + h] == u[j + h]) ++h;
        lcp[r] = h;
        if (h > 0) --h;
    }

    for (int i = 2; i <= N; ++i) lg[i] = lg[i / 2] + 1;
    const int levels = lg[N] + 1;
    std::vector<std::vector<int>> st(levels, std::vector<int>(N, 0));
    st[0] = lcp;
    for (int j = 1; j < levels; ++j) {
        const int span = 1 << (j - 1);
        const int limit = N - (1 << j) + 1;
        for (int i = 0; i < limit; ++i) {
            st[j][i] = std::min(st[j - 1][i], st[j - 1][i + span]);
        }
    }

    auto lcp_query = [&](int i, int j) {
        if (i == j) return N - i;
        int a = rank_[i];
        int b = rank_[j];
        if (a > b) std::swap(a, b);
        ++a;
        const int len = b - a + 1;
        const int k = lg[len];
        return std::min(st[k][a], st[k][b - (1 << k) + 1]);
    };

    int best_len = 0;
    int best_start = 0;

    for (int c = 0; c < n; ++c) {
        const int radius = std::min(c, n - 1 - c);
        int lo = 0;
        int hi = radius;
        while (lo < hi) {
            const int mid = (lo + hi + 1) / 2;
            if (lcp_query(c, 2 * n - c) >= mid + 1) {
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }
        const int len = 2 * lo + 1;
        const int start = c - lo;
        if (len > best_len || (len == best_len && start < best_start)) {
            best_len = len;
            best_start = start;
        }
    }

    for (int c = 1; c < n; ++c) {
        const int radius = std::min(c, n - c);
        int lo = 0;
        int hi = radius;
        while (lo < hi) {
            const int mid = (lo + hi + 1) / 2;
            if (lcp_query(c, 2 * n + 1 - c) >= mid) {
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }
        const int len = 2 * lo;
        const int start = c - lo;
        if (len > best_len || (len == best_len && start < best_start)) {
            best_len = len;
            best_start = start;
        }
    }

    std::cout << best_len << '\n' << best_start << '\n';
    return 0;
}
