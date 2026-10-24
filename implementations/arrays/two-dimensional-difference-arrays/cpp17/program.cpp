#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int rows, cols;
    if (!(std::cin >> rows >> cols)) {
        return 0;
    }

    std::vector<std::vector<long long>> diff(rows + 2, std::vector<long long>(cols + 2, 0));

    for (int i = 1; i <= rows; i++) {
        for (int j = 1; j <= cols; j++) {
            std::cin >> diff[i][j];
        }
    }

    for (int i = 1; i <= rows; i++) {
        long long previous = 0;
        for (int j = 1; j <= cols; j++) {
            long long current = diff[i][j];
            diff[i][j] = current - previous;
            previous = current;
        }
    }

    for (int j = 1; j <= cols; j++) {
        for (int i = rows; i >= 2; i--) {
            diff[i][j] -= diff[i - 1][j];
        }
    }

    int queries;
    std::cin >> queries;

    for (int k = 0; k < queries; k++) {
        int r1, c1, r2, c2;
        long long value;
        std::cin >> r1 >> c1 >> r2 >> c2 >> value;
        diff[r1][c1] += value;
        diff[r2 + 1][c1] -= value;
        diff[r1][c2 + 1] -= value;
        diff[r2 + 1][c2 + 1] += value;
    }

    for (int i = 1; i <= rows; i++) {
        for (int j = 1; j <= cols; j++) {
            diff[i][j] += diff[i - 1][j] + diff[i][j - 1] - diff[i - 1][j - 1];
        }
    }

    for (int i = 1; i <= rows; i++) {
        for (int j = 1; j <= cols; j++) {
            std::cout << diff[i][j] << (j == cols ? '\n' : ' ');
        }
    }

    return 0;
}
