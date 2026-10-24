#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MODULO 1000000007LL

static long long mod_pow(long long base, long long exponent) {
    long long result = 1;
    base %= MODULO;
    while (exponent > 0) {
        if (exponent % 2 == 1) {
            result = result * base % MODULO;
        }
        base = base * base % MODULO;
        exponent /= 2;
    }
    return result;
}

int main(void) {
    int capacity = 64;
    int length = 0;
    char *word = malloc((size_t)capacity);
    if (word == NULL) {
        return 1;
    }

    int ch;
    while ((ch = getchar()) != EOF && ch != '\n' && ch != '\r' && ch != ' ' && ch != '\t') {
        if (length + 1 >= capacity) {
            int grown_capacity = capacity * 2;
            char *grown = realloc(word, (size_t)grown_capacity);
            if (grown == NULL) {
                free(word);
                return 1;
            }
            word = grown;
            capacity = grown_capacity;
        }
        word[length] = (char)ch;
        ++length;
    }
    word[length] = '\0';

    int frequency[26] = {0};
    for (int i = 0; i < length; ++i) {
        ++frequency[word[i] - 'a'];
    }

    long long *factorial = malloc(((size_t)length + 1) * sizeof(long long));
    long long *inverse_factorial = malloc(((size_t)length + 1) * sizeof(long long));
    if (factorial == NULL || inverse_factorial == NULL) {
        free(factorial);
        free(inverse_factorial);
        free(word);
        return 1;
    }

    factorial[0] = 1;
    for (int i = 1; i <= length; ++i) {
        factorial[i] = factorial[i - 1] * i % MODULO;
    }

    inverse_factorial[length] = mod_pow(factorial[length], MODULO - 2);
    for (int i = length; i >= 1; --i) {
        inverse_factorial[i - 1] = inverse_factorial[i] * i % MODULO;
    }

    long long answer = factorial[length];
    for (int i = 0; i < 26; ++i) {
        answer = answer * inverse_factorial[frequency[i]] % MODULO;
    }

    printf("%lld\n", answer);

    free(factorial);
    free(inverse_factorial);
    free(word);
    return 0;
}
