#include <iostream>

int main() {
    long long n = 0;
    if (!(std::cin >> n)) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }

    long long copies = 0;
    long long capacity = 1;
    while (capacity < n) {
        copies += capacity;
        capacity *= 2;
    }

    std::cout << copies << ' ' << capacity << '\n';
    return 0;
}
