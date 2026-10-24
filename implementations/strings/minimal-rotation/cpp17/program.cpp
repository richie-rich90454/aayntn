#include <iostream>
#include <string>

/*
 * The minimal rotation of a string.
 *
 * Input: one nonempty string without spaces, of length at most 10^6.
 * Output: the lexicographically smallest rotation of the string.
 *
 * Two candidate start positions i and j advance through the string while k
 * counts the characters they agree on. When the candidates finally differ,
 * the loser and every start inside the matched block are eliminated at once,
 * so each character is compared a constant number of times.
 */

static int least_rotation(const std::string &s) {
    int n = static_cast<int>(s.size());
    int i = 0;
    int j = 1;
    int k = 0;

    while (i < n && j < n && k < n) {
        char a = s[(i + k) % n];
        char b = s[(j + k) % n];
        if (a == b) {
            ++k;
        } else if (a > b) {
            i = i + k + 1;
            if (i <= j) {
                i = j + 1;
            }
            k = 0;
        } else {
            j = j + k + 1;
            if (j <= i) {
                j = i + 1;
            }
            k = 0;
        }
    }
    return i < j ? i : j;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string s;
    if (!(std::cin >> s)) {
        return 0;
    }

    int start = least_rotation(s);
    int n = static_cast<int>(s.size());
    for (int t = 0; t < n; ++t) {
        std::cout << s[(start + t) % n];
    }
    std::cout << '\n';
    return 0;
}
