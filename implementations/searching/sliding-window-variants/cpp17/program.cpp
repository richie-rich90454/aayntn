#include <algorithm>
#include <array>
#include <cstddef>
#include <iostream>
#include <string>

/*
 * Longest substring with at most k distinct characters.
 *
 * The window is the longest mode of the state machine: push the next byte,
 * shrink while the distinct count is too large, then record the length.
 */

int main()
{
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string s;

    if (!(std::cin >> s)) {
        std::cout << 0 << '\n';
        return 0;
    }

    int k = 0;

    if (!(std::cin >> k)) {
        std::cout << 0 << '\n';
        return 0;
    }

    if (k < 0) {
        k = 0;
    }

    std::array<int, 256> count{};
    int left = 0;
    int distinct = 0;
    int best = 0;

    for (int right = 0; right < static_cast<int>(s.size()); ++right) {
        const unsigned char in = static_cast<unsigned char>(s[static_cast<std::size_t>(right)]);

        if (count[in] == 0) {
            ++distinct;
        }
        ++count[in];

        while (distinct > k) {
            const unsigned char out =
                static_cast<unsigned char>(s[static_cast<std::size_t>(left)]);

            --count[out];
            if (count[out] == 0) {
                --distinct;
            }
            ++left;
        }

        best = std::max(best, right - left + 1);
    }

    std::cout << best << '\n';
    return 0;
}
