#include <algorithm>
#include <iostream>
#include <vector>

/**
 * Mo's algorithm over a static array. The queries are sorted by the block of
 * the left endpoint, the right endpoint alternates direction between blocks,
 * and one window is moved from query to query. The maintained answer is the
 * number of distinct values in the window.
 */

struct Query {
    int left;
    int right;
    int id;
    int block;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int q = 0;
    if (!(std::cin >> n >> q)) {
        return 0;
    }
    n = std::max(0, n);
    q = std::max(0, q);

    std::vector<int> a(static_cast<std::size_t>(n));
    std::vector<int> sorted(static_cast<std::size_t>(n));
    for (int i = 0; i < n; ++i) {
        std::cin >> a[static_cast<std::size_t>(i)];
        sorted[static_cast<std::size_t>(i)] = a[static_cast<std::size_t>(i)];
    }

    std::sort(sorted.begin(), sorted.end());
    sorted.erase(std::unique(sorted.begin(), sorted.end()), sorted.end());
    const int distinctValues = static_cast<int>(sorted.size());

    std::vector<int> rank(static_cast<std::size_t>(n));
    for (int i = 0; i < n; ++i) {
        rank[static_cast<std::size_t>(i)] =
            static_cast<int>(std::lower_bound(sorted.begin(), sorted.end(),
                                              a[static_cast<std::size_t>(i)]) -
                             sorted.begin());
    }

    int block = 1;
    while (static_cast<long long>(block + 1) * (block + 1) <= n) {
        ++block;
    }

    std::vector<Query> queries(static_cast<std::size_t>(q));
    for (int k = 0; k < q; ++k) {
        int l = 1;
        int r = 1;
        std::cin >> l >> r;
        queries[static_cast<std::size_t>(k)] = {l, r, k, (l - 1) / block};
    }

    std::sort(queries.begin(), queries.end(), [](const Query &x, const Query &y) {
        if (x.block != y.block) {
            return x.block < y.block;
        }
        if ((x.block & 1) == 0) {
            return x.right < y.right;
        }
        return x.right > y.right;
    });

    std::vector<int> frequency(static_cast<std::size_t>(distinctValues) + 1, 0);
    std::vector<int> answers(static_cast<std::size_t>(q), 0);

    int curLeft = 1;
    int curRight = 0;
    int distinct = 0;

    for (const Query &query : queries) {
        while (curLeft > query.left) {
            --curLeft;
            const int value = rank[static_cast<std::size_t>(curLeft - 1)];
            if (frequency[static_cast<std::size_t>(value)] == 0) {
                ++distinct;
            }
            ++frequency[static_cast<std::size_t>(value)];
        }
        while (curRight < query.right) {
            ++curRight;
            const int value = rank[static_cast<std::size_t>(curRight - 1)];
            if (frequency[static_cast<std::size_t>(value)] == 0) {
                ++distinct;
            }
            ++frequency[static_cast<std::size_t>(value)];
        }
        while (curLeft < query.left) {
            const int value = rank[static_cast<std::size_t>(curLeft - 1)];
            --frequency[static_cast<std::size_t>(value)];
            if (frequency[static_cast<std::size_t>(value)] == 0) {
                --distinct;
            }
            ++curLeft;
        }
        while (curRight > query.right) {
            const int value = rank[static_cast<std::size_t>(curRight - 1)];
            --frequency[static_cast<std::size_t>(value)];
            if (frequency[static_cast<std::size_t>(value)] == 0) {
                --distinct;
            }
            --curRight;
        }

        answers[static_cast<std::size_t>(query.id)] = distinct;
    }

    for (int k = 0; k < q; ++k) {
        std::cout << answers[static_cast<std::size_t>(k)] << '\n';
    }

    return 0;
}
