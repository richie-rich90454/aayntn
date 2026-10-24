#include <iostream>

namespace {

int n;
int full;
long long count = 0;
long long nodes = 0;

void search(int row, int cols, int down, int anti) {
    ++nodes;
    if (row == n) {
        ++count;
        return;
    }
    int available = full & ~(cols | down | anti);
    while (available != 0) {
        int bit = available & -available;
        available ^= bit;
        search(row + 1, cols | bit, ((down | bit) << 1) & full, (anti | bit) >> 1);
    }
}

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    if (!(std::cin >> n)) {
        return 0;
    }
    full = (1 << n) - 1;
    search(0, 0, 0, 0);
    std::cout << count << ' ' << nodes << '\n';
    return 0;
}
