#include <stdio.h>

static int n;
static long long target;
static long long values[20];
static long long answer;

static void search(int index, long long running) {
    if (index == n) {
        if (running == target) {
            ++answer;
        }
        return;
    }
    search(index + 1, running);
    search(index + 1, running + values[index]);
}

int main(void) {
    if (scanf("%d", &n) != 1) {
        return 0;
    }
    for (int i = 0; i < n; ++i) {
        if (scanf("%lld", &values[i]) != 1) {
            return 0;
        }
    }
    if (scanf("%lld", &target) != 1) {
        return 0;
    }
    search(0, 0);
    printf("%lld\n", answer);
    return 0;
}
