import sys

MODULO = 1000000007


def main() -> None:
    data = sys.stdin.read().split()
    word = data[0] if data else ""
    n = len(word)

    frequency = [0] * 26
    for letter in word:
        frequency[ord(letter) - ord("a")] += 1

    factorial = [1] * (n + 1)
    for i in range(1, n + 1):
        factorial[i] = factorial[i - 1] * i % MODULO

    inverse_factorial = [1] * (n + 1)
    inverse_factorial[n] = pow(factorial[n], MODULO - 2, MODULO)
    for i in range(n, 0, -1):
        inverse_factorial[i - 1] = inverse_factorial[i] * i % MODULO

    answer = factorial[n]
    for count in frequency:
        answer = answer * inverse_factorial[count] % MODULO

    print(answer)


if __name__ == "__main__":
    main()
