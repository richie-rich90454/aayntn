"""Palindrome tree (eertree) over the lowercase Latin alphabet, driven from standard input.

Input: one line holding the string.
Output: two lines, the number of distinct nonempty palindromic substrings and the
number of palindromic substrings counting multiplicity.

Two roots are kept. Node 0 has length -1 and stands for the imaginary string
that makes a single character the child of a real node. Node 1 has length 0 and
stands for the empty palindrome. Every other node is one distinct palindrome.
An edge labeled c adds c to both ends of its parent, and the suffix link of a
node is its longest proper palindromic suffix.
"""

import sys


def main():
    text = sys.stdin.readline()
    if text.endswith("\n"):
        text = text[:-1]
    if text.endswith("\r"):
        text = text[:-1]

    n = len(text)
    size = n + 2
    length = [0] * size
    link = [0] * size
    head = [-1] * size
    to = [0] * size
    nxt = [0] * size
    label = [0] * size
    occ = [0] * size

    length[0] = -1
    nodes = 2
    last = 1
    edges = 0

    for i, character in enumerate(text):
        code = ord(character)
        cur = last
        while True:
            at = i - 1 - length[cur]
            if at >= 0 and text[at] == character:
                break
            cur = link[cur]

        child = -1
        edge = head[cur]
        while edge != -1:
            if label[edge] == code:
                child = to[edge]
                break
            edge = nxt[edge]

        if child == -1:
            child = nodes
            nodes += 1
            length[child] = length[cur] + 2
            head[child] = -1
            label[edges] = code
            to[edges] = child
            nxt[edges] = head[cur]
            head[cur] = edges
            edges += 1

            if length[child] == 1:
                link[child] = 1
            else:
                temp = link[cur]
                while True:
                    at = i - 1 - length[temp]
                    if at >= 0 and text[at] == character:
                        break
                    temp = link[temp]
                found = -1
                edge = head[temp]
                while edge != -1:
                    if label[edge] == code:
                        found = to[edge]
                        break
                    edge = nxt[edge]
                link[child] = found

        last = child
        occ[last] += 1

    for v in range(nodes - 1, 1, -1):
        occ[link[v]] += occ[v]

    total = sum(occ[2:nodes])
    sys.stdout.write(f"{nodes - 2}\n{total}\n")


if __name__ == "__main__":
    main()
