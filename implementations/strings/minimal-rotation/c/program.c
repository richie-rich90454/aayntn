#include <stdio.h>
#include <string.h>

/*
 * The minimal rotation of a string.
 *
 * Input: one nonempty string without spaces, of length at most 10^6.
 * Output: the lexicographically smallest rotation of the string.
 *
 * Two candidate start positions i and j advance through the string while k
 * counts the characters they agree on. When the candidates finally differ,
 * the loser and every start inside the matched block are eliminated at once,
 * so each character is compared a constant number of times.
 */

#define MAX_LENGTH 1000000

static char s[MAX_LENGTH + 2];

int main(void) {
    if (scanf("%1000001s", s) != 1) {
        return 0;
    }

    int n = (int)strlen(s);
    int i = 0;
    int j = 1;
    int k = 0;

    while (i < n && j < n && k < n) {
        unsigned char a = (unsigned char)s[(i + k) % n];
        unsigned char b = (unsigned char)s[(j + k) % n];
        if (a == b) {
            ++k;
        } else if (a > b) {
            i = i + k + 1;
            if (i <= j) {
                i = j + 1;
            }
            k = 0;
        } else {
            j = j + k + 1;
            if (j <= i) {
                j = i + 1;
            }
            k = 0;
        }
    }

    int start = i < j ? i : j;
    for (int t = 0; t < n; ++t) {
        putchar(s[(start + t) % n]);
    }
    putchar('\n');
    return 0;
}
