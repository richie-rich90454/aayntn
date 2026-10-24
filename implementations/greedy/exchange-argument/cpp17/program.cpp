#include <algorithm>
#include <iostream>
#include <limits>
#include <vector>

struct Interval {
    long long start;
    long long end;
};

static bool compatible(const Interval &a, const Interval &b) {
    return a.end <= b.start || b.end <= a.start;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n) || n < 0 || n > 12) {
        return 0;
    }

    std::vector<Interval> intervals(static_cast<size_t>(n));
    for (Interval &interval : intervals) {
        std::cin >> interval.start >> interval.end;
    }

    std::vector<Interval> sorted = intervals;
    std::sort(sorted.begin(), sorted.end(), [](const Interval &a, const Interval &b) {
        if (a.end != b.end) {
            return a.end < b.end;
        }
        return a.start < b.start;
    });

    int greedy = 0;
    long long freeTime = std::numeric_limits<long long>::min() / 4;
    for (const Interval &interval : sorted) {
        if (interval.start >= freeTime) {
            ++greedy;
            freeTime = interval.end;
        }
    }

    int best = 0;
    for (int mask = 0; mask < (1 << n); ++mask) {
        int count = 0;
        bool ok = true;
        for (int left = 0; left < n && ok; ++left) {
            if ((mask & (1 << left)) == 0) {
                continue;
            }
            ++count;
            for (int right = left + 1; right < n; ++right) {
                if ((mask & (1 << right)) != 0 && !compatible(intervals[left], intervals[right])) {
                    ok = false;
                    break;
                }
            }
        }
        if (ok) {
            best = std::max(best, count);
        }
    }

    std::cout << greedy << ' ' << best << '\n';
    std::cout << (greedy == best ? "MATCH" : "DIFFER") << '\n';
    return 0;
}
