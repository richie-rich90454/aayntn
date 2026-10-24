#include <algorithm>
#include <iostream>
#include <vector>

struct Item {
    long long color;
    long long weight;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) {
        return 0;
    }
    if (n <= 0) {
        std::cout << 0 << '\n';
        return 0;
    }

    std::vector<Item> items(static_cast<std::size_t>(n));
    for (Item &item : items) {
        if (!(std::cin >> item.color >> item.weight)) {
            return 0;
        }
    }

    std::sort(items.begin(), items.end(), [](const Item &a, const Item &b) {
        if (a.color != b.color) {
            return a.color < b.color;
        }
        return a.weight > b.weight;
    });

    long long total = 0;
    bool first = true;
    long long previous = 0;
    for (const Item &item : items) {
        if (first || item.color != previous) {
            total += item.weight;
            previous = item.color;
            first = false;
        }
    }

    std::cout << total << '\n';
    return 0;
}
