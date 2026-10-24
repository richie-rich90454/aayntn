#include <array>
#include <iostream>
#include <string>
#include <vector>

/**
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
int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }

    std::string line;
    std::getline(std::cin, line);  // consume the rest of the first line

    std::vector<std::string> patterns;
    patterns.reserve(static_cast<std::size_t>(n));
    std::size_t total = 0;
    for (int i = 0; i < n; ++i) {
        std::string pattern;
        std::getline(std::cin, pattern);
        if (!pattern.empty() && pattern.back() == '\r') {
            pattern.pop_back();
        }
        total += pattern.size();
        patterns.push_back(std::move(pattern));
    }

    std::vector<std::array<int, 26>> go(total + 1);
    for (std::array<int, 26>& row : go) {
        row.fill(-1);
    }
    std::vector<int> fail(total + 1, 0);
    std::vector<long long> count(total + 1, 0);
    std::vector<int> terminal(static_cast<std::size_t>(n), 0);
    std::vector<int> order;
    order.reserve(total);

    // Insert every pattern, remembering the terminal node of each one.
    int nodes = 1;
    for (int i = 0; i < n; ++i) {
        int v = 0;
        for (char ch : patterns[static_cast<std::size_t>(i)]) {
            int c = ch - 'a';
            if (c < 0 || c >= 26) {
                continue;
            }
            int& edge = go[static_cast<std::size_t>(v)][c];
            if (edge == -1) {
                edge = nodes;
                ++nodes;
            }
            v = edge;
        }
        terminal[static_cast<std::size_t>(i)] = v;
    }

    // Build the failure links and complete the transition table.
    for (int c = 0; c < 26; ++c) {
        int u = go[0][c];
        if (u == -1) {
            go[0][c] = 0;
        } else {
            fail[static_cast<std::size_t>(u)] = 0;
            order.push_back(u);
        }
    }
    for (std::size_t head = 0; head < order.size(); ++head) {
        int v = order[head];
        int fv = fail[static_cast<std::size_t>(v)];
        for (int c = 0; c < 26; ++c) {
            int u = go[static_cast<std::size_t>(v)][c];
            if (u == -1) {
                go[static_cast<std::size_t>(v)][c] = go[static_cast<std::size_t>(fv)][c];
            } else {
                fail[static_cast<std::size_t>(u)] = go[static_cast<std::size_t>(fv)][c];
                order.push_back(u);
            }
        }
    }

    std::string text;
    std::getline(std::cin, text);
    if (!text.empty() && text.back() == '\r') {
        text.pop_back();
    }

    int state = 0;
    for (char ch : text) {
        int c = ch - 'a';
        if (c < 0 || c >= 26) {
            continue;
        }
        state = go[static_cast<std::size_t>(state)][c];
        ++count[static_cast<std::size_t>(state)];
    }

    for (int i = static_cast<int>(order.size()) - 1; i >= 0; --i) {
        int v = order[static_cast<std::size_t>(i)];
        count[static_cast<std::size_t>(fail[static_cast<std::size_t>(v)])] +=
            count[static_cast<std::size_t>(v)];
    }

    for (int i = 0; i < n; ++i) {
        std::cout << count[static_cast<std::size_t>(terminal[static_cast<std::size_t>(i)])] << '\n';
    }

    return 0;
}
