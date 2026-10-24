import sys

WORD_BITS = 32
WORD_MASK = (1 << WORD_BITS) - 1


def main() -> None:
    tokens = sys.stdin.buffer.read().split()
    if len(tokens) < 2:
        return

    n = int(tokens[0])
    limit = int(tokens[1])
    weights = [int(token) for token in tokens[2 : 2 + n]]

    words = limit // WORD_BITS + 1
    top_bits = limit % WORD_BITS + 1
    reachable = [0] * words
    reachable[0] = 1

    for weight in weights:
        if weight <= 0 or weight > limit:
            continue

        word_shift, bit_shift = divmod(weight, WORD_BITS)
        for i in range(words - 1, word_shift - 1, -1):
            moved = (reachable[i - word_shift] << bit_shift) & WORD_MASK
            if bit_shift and i - word_shift - 1 >= 0:
                moved |= reachable[i - word_shift - 1] >> (WORD_BITS - bit_shift)
            reachable[i] = (reachable[i] | moved) & WORD_MASK

        if top_bits < WORD_BITS:
            reachable[-1] &= (1 << top_bits) - 1

    print(sum(word.bit_count() for word in reachable))


if __name__ == "__main__":
    main()
