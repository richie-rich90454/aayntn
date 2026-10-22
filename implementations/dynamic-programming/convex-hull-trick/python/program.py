"""The smallest value of a set of lines, driven from standard input.

Input: n q, then n lines m b that add the line y = m * x + b, then q lines x
that query the smallest value of the lines added so far.
Output: one line per query, holding the smallest value.
"""

import sys


class ConvexHull:
    """The smallest value of a set of lines, added and queried in monotone order.

    The lines are added with a non-decreasing slope and the queries arrive
    with a non-decreasing x, and the answer is the smallest value of the lines
    added so far.

    The hull is a stack of lines with increasing slopes. The line on top of
    the stack is the one that is smallest for the smallest x, and a query
    walks down the stack as the x grows.

    The instance owns its lists, so the hull is reclaimed with the object.
    """

    def __init__(self):
        self.slope = []
        self.intercept = []

    def add(self, m, b):
        """Add the line y = m * x + b.

        The slope must not be smaller than the slope of the line added before,
        which is what makes the amortised cost of the operations constant.
        """
        while self.slope and self.slope[-1] == m:
            if self.intercept[-1] <= b:
                # The new line is never the smallest, so it is dropped.
                return
            # The new line wins against the line with the same slope.
            self.slope.pop()
            self.intercept.pop()
        while len(self.slope) >= 2 and self._redundant(
            self.slope[-2],
            self.intercept[-2],
            self.slope[-1],
            self.intercept[-1],
            m,
            b,
        ):
            # The line on top of the stack is never the smallest.
            self.slope.pop()
            self.intercept.pop()
        self.slope.append(m)
        self.intercept.append(b)

    def query(self, x):
        """The smallest value of the lines added so far at the point x.

        The x values must not decrease, which is what lets the query drop the
        lines it walks past. The answer of a query with no line at all is 0.
        """
        if not self.slope:
            return 0
        while len(self.slope) >= 2:
            top = self.slope[-1] * x + self.intercept[-1]
            below = self.slope[-2] * x + self.intercept[-2]
            if below >= top:
                break
            # The line on top of the stack has the larger slope, so it stays
            # the worse of the two for every larger x and is dropped for good.
            self.slope.pop()
            self.intercept.pop()
        return self.slope[-1] * x + self.intercept[-1]

    @staticmethod
    def _redundant(m1, b1, m2, b2, m3, b3):
        """True when the middle line of the three never holds the minimum.

        The switch points of the neighbors have to decrease along the stack,
        and the comparison is done on the switch points, so the products of
        the coefficients never enter the arithmetic.
        """
        return float(b1 - b2) / float(m2 - m1) <= float(b2 - b3) / float(m3 - m2)


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    n = max(0, int(data[0]))
    q = max(0, int(data[1]))

    hull = ConvexHull()
    index = 2
    for _ in range(n):
        if index + 1 >= len(data):
            break
        m = int(data[index])
        b = int(data[index + 1])
        index += 2
        hull.add(m, b)

    lines = []
    for _ in range(q):
        if index >= len(data):
            break
        x = int(data[index])
        index += 1
        lines.append(str(hull.query(x)))

    if lines:
        # The language variants must agree byte for byte, so the line feed is
        # written as a byte and not translated by the text layer of Windows.
        sys.stdout.buffer.write(("\n".join(lines) + "\n").encode())


if __name__ == "__main__":
    main()
