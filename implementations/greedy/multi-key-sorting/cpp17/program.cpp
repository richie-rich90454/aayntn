#include <algorithm>
#include <iostream>
#include <vector>

/* One record of three integer keys. */
struct Record {
    int a;
    int b;
    int c;
};

/*
 * The required order: a ascending, then b descending, then c ascending.
 * The descending key is a reversed comparison rather than a negated value, so
 * the minimum representable integer needs no special case, and the comparator
 * returns false for two equal records, which is what std::sort requires.
 */
static bool comes_before(const Record &x, const Record &y) {
    if (x.a != y.a) {
        return x.a < y.a;
    }
    if (x.b != y.b) {
        return x.b > y.b;
    }
    return x.c < y.c;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n) || n <= 0) {
        return 0;
    }

    std::vector<Record> records(static_cast<size_t>(n));
    for (Record &r : records) {
        if (!(std::cin >> r.a >> r.b >> r.c)) {
            return 0;
        }
    }

    std::sort(records.begin(), records.end(), comes_before);

    for (const Record &r : records) {
        std::cout << r.a << ' ' << r.b << ' ' << r.c << '\n';
    }

    return 0;
}
