#include <algorithm>
#include <iostream>
#include <queue>
#include <vector>

/* One job: it takes one unit of time and must finish by its deadline. */
struct Job {
    long long deadline;
    long long profit;
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

    std::vector<Job> jobs(static_cast<size_t>(n));
    for (Job &job : jobs) {
        if (!(std::cin >> job.deadline >> job.profit)) {
            return 0;
        }
    }

    std::sort(jobs.begin(), jobs.end(), [](const Job &x, const Job &y) {
        return x.deadline < y.deadline;
    });

    /*
     * std::priority_queue is a max-heap by default; std::greater reverses it so
     * pop() removes the least profitable selected job.
     */
    std::priority_queue<long long, std::vector<long long>, std::greater<long long>> selected;

    for (const Job &job : jobs) {
        selected.push(job.profit);
        if (static_cast<long long>(selected.size()) > job.deadline) {
            selected.pop();
        }
    }

    long long total = 0;
    while (!selected.empty()) {
        total += selected.top();
        selected.pop();
    }

    std::cout << total << '\n';
    return 0;
}
