"""Compare two rooted trees with a deterministic bottom-up subtree hash."""

import sys

MASK = (1 << 32) - 1
BASE_FIRST = 1000003
BASE_SECOND = 999983


def mix_first(value: int) -> int:
    value &= MASK
    value ^= (value << 13) & MASK
    value ^= value >> 17
    value ^= (value << 5) & MASK
    return value & MASK


def mix_second(value: int) -> int:
    value = (value + 0x9E3779B9) & MASK
    value ^= (value << 5) & MASK
    value ^= value >> 13
    value ^= (value << 17) & MASK
    return value & MASK


def read_tree(tokens: list[bytes], index: int):
    """Read one parent array and return (size, root hash pair, new index)."""
    if index >= len(tokens):
        return None, index
    n = int(tokens[index])
    index += 1
    if n < 1:
        return None, index

    parent = [int(tokens[index + i]) for i in range(n)]
    index += n

    root = -1
    for i in range(n):
        if parent[i] < 0 or parent[i] >= n:
            parent[i] = -1
            if root < 0:
                root = i
    if root < 0:
        root = 0
        parent[0] = -1

    child_count = [0] * n
    for i in range(n):
        if i != root and parent[i] >= 0:
            child_count[parent[i]] += 1

    start = [0] * (n + 1)
    for i in range(n):
        start[i + 1] = start[i] + child_count[i]

    children = [0] * max(n - 1, 1)
    cursor = [0] * n
    for i in range(n):
        if i != root and parent[i] >= 0:
            p = parent[i]
            children[start[p] + cursor[p]] = i
            cursor[p] += 1

    order = [root]
    for u in order:
        order.extend(children[start[u] : start[u + 1]])

    first = [0] * n
    second = [0] * n
    for u in reversed(order):
        pairs = [(first[c], second[c]) for c in children[start[u] : start[u + 1]]]
        pairs.sort()

        fold_first = 0
        fold_second = 0
        for child_first, child_second in pairs:
            fold_first = (fold_first * BASE_FIRST + mix_first(child_first)) & MASK
            fold_second = (fold_second * BASE_SECOND + mix_second(child_second)) & MASK

        first[u] = (fold_first * BASE_FIRST + 1) & MASK
        second[u] = (fold_second * BASE_SECOND + 1) & MASK

    return (n, first[root], second[root]), index


def main() -> None:
    tokens = sys.stdin.buffer.read().split()
    first_tree, index = read_tree(tokens, 0)
    second_tree, _ = read_tree(tokens, index)

    same = (
        first_tree is not None
        and second_tree is not None
        and first_tree == second_tree
    )
    print("SAME" if same else "DIFFERENT")


if __name__ == "__main__":
    main()
