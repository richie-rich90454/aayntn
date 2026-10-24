#include <cstddef>
#include <cstdio>
#include <utility>
#include <vector>

struct Line {
    long long slope = 0;
    long long intercept = 0;
    int groups = 0;
    bool present = false;
};

static bool better(const Line &left, const Line &right, long long x) {
    const long long left_value = left.slope * x + left.intercept;
    const long long right_value = right.slope * x + right.intercept;
    if (left_value != right_value) {
        return left_value < right_value;
    }
    return left.groups > right.groups;
}

class LiChaoTree {
  public:
    explicit LiChaoTree(const std::vector<long long> &prefix)
        : prefix_(prefix), tree_(4 * prefix.size() + 8), n_(static_cast<int>(prefix.size()) - 1) {}

    void insert(Line line) { insert(1, 0, n_, line); }

    Line query(int index) const {
        int node = 1;
        int left = 0;
        int right = n_;
        const long long x = prefix_[index];
        Line best;
        while (true) {
            if (tree_[node].present && (!best.present || better(tree_[node], best, x))) {
                best = tree_[node];
            }
            if (left == right) {
                break;
            }
            const int mid = left + (right - left) / 2;
            if (index <= mid) {
                node *= 2;
                right = mid;
            } else {
                node = 2 * node + 1;
                left = mid + 1;
            }
        }
        return best;
    }

  private:
    void insert(int node, int left, int right, Line line) {
        if (!tree_[node].present) {
            tree_[node] = line;
            tree_[node].present = true;
            return;
        }
        const int mid = left + (right - left) / 2;
        if (better(line, tree_[node], prefix_[mid])) {
            std::swap(line, tree_[node]);
        }
        if (left == right) {
            return;
        }
        if (better(line, tree_[node], prefix_[left])) {
            insert(2 * node, left, mid, line);
        } else if (better(line, tree_[node], prefix_[right])) {
            insert(2 * node + 1, mid + 1, right, line);
        }
    }

    const std::vector<long long> &prefix_;
    std::vector<Line> tree_;
    int n_;
};

static long long penalized(const std::vector<long long> &prefix, long long penalty,
                           int &out_groups) {
    const int n = static_cast<int>(prefix.size()) - 1;
    LiChaoTree tree(prefix);
    tree.insert(Line{});

    long long value = 0;
    int groups = 0;
    for (int i = 1; i <= n; i++) {
        const long long x = prefix[i];
        const Line line = tree.query(i);
        value = line.slope * x + line.intercept + x * x + penalty;
        groups = line.groups + 1;
        tree.insert(Line{-2 * x, value + x * x, groups, true});
    }
    out_groups = groups;
    return value;
}

int main() {
    int n = 0;
    int k = 0;
    if (std::scanf("%d %d", &n, &k) != 2) {
        return 0;
    }
    if (n <= 0) {
        std::printf("0\n");
        return 0;
    }
    if (k < 1) {
        k = 1;
    }
    if (k > n) {
        k = n;
    }

    std::vector<long long> prefix(static_cast<std::size_t>(n) + 1, 0);
    for (int i = 1; i <= n; i++) {
        long long value = 0;
        if (std::scanf("%lld", &value) != 1) {
            value = 0;
        }
        prefix[i] = prefix[i - 1] + value;
    }

    const long long total = prefix[n];
    long long low = 0;
    long long high = total * total + 1;
    while (low < high) {
        const long long mid = low + (high - low + 1) / 2;
        int groups = 0;
        penalized(prefix, mid, groups);
        if (groups >= k) {
            low = mid;
        } else {
            high = mid - 1;
        }
    }

    int groups = 0;
    const long long value = penalized(prefix, low, groups);
    std::printf("%lld\n", value - low * static_cast<long long>(k));
    return 0;
}
