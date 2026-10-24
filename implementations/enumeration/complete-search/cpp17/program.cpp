#include <cstddef>
#include <iostream>
#include <vector>

namespace {

int n;
long long target;
std::vector<long long> values;

long long search(int index, long long running) {
    if (index == n) {
        return running == target ? 1 : 0;
    }
    return search(index + 1, running) + search(index + 1, running + values[index]);
}

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::cin >> n;
    values.resize(static_cast<std::size_t>(n));
    for (long long &value : values) {
        std::cin >> value;
    }
    std::cin >> target;

    std::cout << search(0, 0) << '\n';
    return 0;
}
