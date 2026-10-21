"""
aayntn: the bulk-input Python contest template.

Reading every token at once is faster than reading a line at a time, because
the interpreter makes one call rather than one per line. The cost is memory:
the whole input is held as a list of tokens, so this form is the wrong choice
when the input is large enough for the list to matter.

The code here uses no syntax newer than Python 3.6.
"""

import sys


def solve():
    data = list(map(int, sys.stdin.buffer.read().split()))

    if not data:
        return

    n = data[0]

    # The algorithm goes here.

    sys.stdout.write(str(n) + "\n")


if __name__ == "__main__":
    solve()
