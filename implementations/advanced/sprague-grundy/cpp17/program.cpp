#include <algorithm>
#include <iostream>
#include <vector>

/**
 * Reads a set of allowed moves and a list of heap sizes, tabulates the Grundy
 * value of one heap, prints the value of every heap, and reports whether the
 * combined position is a win for the first player.
 *
 * The marker array is not cleared between sizes: seen[value] holds the size
 * that last marked the value, so an entry is live exactly when it equals the
 * current size.
 */
int main() {
    int k = 0;
    if (!(std::cin >> k)) {
        return 0;
    }
    if (k < 0) {
        k = 0;
    }

    std::vector<int> moves(static_cast<size_t>(k));
    for (int i = 0; i < k; ++i) {
        if (!(std::cin >> moves[static_cast<size_t>(i)])) {
            return 0;
        }
    }

    int h = 0;
    if (!(std::cin >> h)) {
        return 0;
    }
    if (h < 0) {
        h = 0;
    }

    std::vector<int> heaps(static_cast<size_t>(h));
    int maxHeap = 0;
    for (int i = 0; i < h; ++i) {
        if (!(std::cin >> heaps[static_cast<size_t>(i)])) {
            return 0;
        }
        maxHeap = std::max(maxHeap, heaps[static_cast<size_t>(i)]);
    }

    std::vector<int> grundy(static_cast<size_t>(maxHeap) + 1, 0);
    std::vector<int> seen(static_cast<size_t>(k) + 2, 0);

    for (int s = 1; s <= maxHeap; ++s) {
        for (int move : moves) {
            if (move <= s) {
                seen[static_cast<size_t>(grundy[static_cast<size_t>(s - move)])] = s;
            }
        }
        int g = 0;
        while (g <= k && seen[static_cast<size_t>(g)] == s) {
            ++g;
        }
        grundy[static_cast<size_t>(s)] = g;
    }

    int total = 0;
    for (int size : heaps) {
        int g = grundy[static_cast<size_t>(size)];
        std::cout << g << '\n';
        total ^= g;
    }
    std::cout << (total != 0 ? "first" : "second") << '\n';

    return 0;
}
