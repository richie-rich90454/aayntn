#include <stdio.h>
#include <stdlib.h>

/*
 * Longest substring with at most k distinct characters.
 *
 * The window is the longest mode of the state machine: push the next byte,
 * shrink while the distinct count is too large, then record the length.
 */

int main(void)
{
    char s[200005];

    if (scanf("%200000s", s) != 1) {
        printf("0\n");
        return EXIT_SUCCESS;
    }

    int k;

    if (scanf("%d", &k) != 1) {
        printf("0\n");
        return EXIT_SUCCESS;
    }

    if (k < 0) {
        k = 0;
    }

    int count[256] = {0};
    int left = 0;
    int distinct = 0;
    int best = 0;

    for (int right = 0; s[right] != '\0'; ++right) {
        unsigned char in = (unsigned char)s[right];

        if (count[in] == 0) {
            ++distinct;
        }
        ++count[in];

        while (distinct > k) {
            unsigned char out = (unsigned char)s[left];

            --count[out];
            if (count[out] == 0) {
                --distinct;
            }
            ++left;
        }

        int length = right - left + 1;

        if (length > best) {
            best = length;
        }
    }

    printf("%d\n", best);
    return EXIT_SUCCESS;
}
