#include <iostream>
#include <vector>

/**
 * Square-root decomposition over a 1-indexed array. The array is cut into
 * blocks of about sqrt(n) positions, and sum[b] holds the total of block b.
 */
class SqrtDecomposition {
public:
    explicit SqrtDecomposition(int n) : n_(n), block_(1) {
        while (static_cast<long long>(block_) * block_ < n_) {
            ++block_;
        }
        const int blocks = (n_ + block_ - 1) / block_;
        value_.assign(static_cast<size_t>(n_), 0);
        sum_.assign(static_cast<size_t>(blocks), 0);
    }

    // Adds delta to the value at the 1-based index.
    void add(int index, long long delta) {
        --index;
        if (index < 0 || index >= n_) {
            return;
        }
        value_[static_cast<size_t>(index)] += delta;
        sum_[static_cast<size_t>(index / block_)] += delta;
    }

    // The sum of the positions left..right, both inclusive.
    long long rangeSum(int left, int right) const {
        --left;
        --right;
        if (left < 0) {
            left = 0;
        }
        if (right >= n_) {
            right = n_ - 1;
        }
        if (left > right) {
            return 0;
        }

        const int firstFull = (left + block_ - 1) / block_;
        const int lastFull = (right + 1) / block_ - 1;
        if (firstFull > lastFull) {
            long long total = 0;
            for (int i = left; i <= right; ++i) {
                total += value_[static_cast<size_t>(i)];
            }
            return total;
        }

        long long total = 0;
        for (int i = left; i < firstFull * block_; ++i) {
            total += value_[static_cast<size_t>(i)];
        }
        for (int b = firstFull; b <= lastFull; ++b) {
            total += sum_[static_cast<size_t>(b)];
        }
        for (int i = (lastFull + 1) * block_; i <= right; ++i) {
            total += value_[static_cast<size_t>(i)];
        }
        return total;
    }

private:
    int n_;
    int block_;
    std::vector<long long> value_;
    std::vector<long long> sum_;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int q = 0;
    if (!(std::cin >> n >> q)) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }

    SqrtDecomposition array(n);

    for (int k = 0; k < q; ++k) {
        int kind = 0;
        if (!(std::cin >> kind)) {
            break;
        }
        if (kind == 1) {
            int index = 0;
            long long delta = 0;
            if (!(std::cin >> index >> delta)) {
                break;
            }
            array.add(index, delta);
        } else if (kind == 2) {
            int left = 0;
            int right = 0;
            if (!(std::cin >> left >> right)) {
                break;
            }
            std::cout << array.rangeSum(left, right) << '\n';
        } else {
            break;
        }
    }

    return 0;
}
