#include <algorithm>
#include <array>
#include <cstdio>
#include <iostream>
#include <string>
#include <vector>

/*
 * The suffix automaton of a string.
 *
 * Input: one line holding a nonempty string of lowercase Latin letters.
 * Output: the number of distinct nonempty substrings, then the number of
 * occurrences of the lexicographically smallest nonempty substring.
 *
 * Each state stores the length of its longest string, a suffix link, and 26
 * transitions. The build extends the automaton by one character at a time and
 * clones a class when the new suffix does not fit its length interval.
 */

struct State {
    int len = 0;
    int link = -1;
    std::array<int, 26> next;

    State() { next.fill(-1); }
};

int main() {
    std::string s;
    if (!std::getline(std::cin, s)) {
        return 0;
    }
    if (!s.empty() && s.back() == '\r') {
        s.pop_back();
    }

    const int n = static_cast<int>(s.size());
    if (n == 0) {
        std::printf("0\n0\n");
        return 0;
    }

    std::vector<State> st(2 * n + 2);
    std::vector<long long> count(2 * n + 2, 0);
    int size = 1;
    int last = 0;

    for (char ch : s) {
        const int c = ch - 'a';
        const int cur = size++;
        st[cur].len = st[last].len + 1;
        count[cur] = 1;

        int p = last;
        while (p != -1 && st[p].next[c] == -1) {
            st[p].next[c] = cur;
            p = st[p].link;
        }

        if (p == -1) {
            st[cur].link = 0;
        } else {
            const int q = st[p].next[c];
            if (st[p].len + 1 == st[q].len) {
                st[cur].link = q;
            } else {
                const int clone = size++;
                st[clone].len = st[p].len + 1;
                st[clone].next = st[q].next;
                st[clone].link = st[q].link;
                count[clone] = 0;

                while (p != -1 && st[p].next[c] == q) {
                    st[p].next[c] = clone;
                    p = st[p].link;
                }
                st[q].link = clone;
                st[cur].link = clone;
            }
        }
        last = cur;
    }

    std::vector<int> bucket(n + 1, 0);
    for (int v = 1; v < size; ++v) {
        ++bucket[st[v].len];
    }
    for (int i = 1; i <= n; ++i) {
        bucket[i] += bucket[i - 1];
    }

    std::vector<int> order(size - 1);
    for (int v = size - 1; v >= 1; --v) {
        order[--bucket[st[v].len]] = v;
    }
    for (int i = size - 2; i >= 0; --i) {
        const int v = order[i];
        count[st[v].link] += count[v];
    }

    long long distinct = 0;
    for (int v = 1; v < size; ++v) {
        distinct += static_cast<long long>(st[v].len - st[st[v].link].len);
    }

    int smallest = 25;
    for (char ch : s) {
        smallest = std::min(smallest, ch - 'a');
    }
    const int target = st[0].next[smallest];

    std::printf("%lld\n%lld\n", distinct, count[target]);
    return 0;
}
