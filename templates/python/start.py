"""
aayntn: the general-purpose Python contest template.

Two forms are published. This one reads the input a line at a time, which
uses the least memory. The bulk form is in bulk.py, which is faster but
materializes every token at once.

The code here uses no syntax newer than Python 3.6, so it runs on the
interpreter version the published contest instructions describe.
"""

import sys


def solve():
    read = sys.stdin.buffer.readline

    n = int(read())

    # The algorithm goes here.

    sys.stdout.write(str(n) + "\n")


if __name__ == "__main__":
    solve()
