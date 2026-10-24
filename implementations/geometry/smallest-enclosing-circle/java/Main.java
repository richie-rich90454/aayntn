import java.io.IOException;
import java.io.InputStream;

/**
 * The smallest enclosing circle, by the deterministic incremental
 * construction.
 *
 * <p>Input: n, then n lines with an integer x and an integer y. Output: the
 * squared radius of the smallest circle that contains every point, as an exact
 * integer.
 *
 * <p>The circle is stored as the points that define it, never as a center and
 * a radius: the center of a circumcircle is rational, and storing it would drag
 * rational arithmetic into every containment test.
 */
public final class Main {

    private Main() {
    }

    private static final class Point {
        final long x;
        final long y;

        Point(long x, long y) {
            this.x = x;
            this.y = y;
        }
    }

    /** Kind 0 is a point, 1 a diameter, and 2 a counterclockwise circumcircle. */
    private static final class Circle {
        final int kind;
        final Point a;
        final Point b;
        final Point c;

        Circle(int kind, Point a, Point b, Point c) {
            this.kind = kind;
            this.a = a;
            this.b = b;
            this.c = c;
        }
    }

    private static long dist2(Point a, Point b) {
        final long dx = a.x - b.x;
        final long dy = a.y - b.y;
        return dx * dx + dy * dy;
    }

    private static long cross(Point a, Point b, Point c) {
        return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    }

    private static long dot(long ax, long ay, long bx, long by) {
        return ax * bx + ay * by;
    }

    private static Circle pointCircle(Point p) {
        return new Circle(0, p, p, p);
    }

    private static Circle diameterCircle(Point a, Point b) {
        return new Circle(1, a, b, a);
    }

    private static boolean inside(Circle c, Point p) {
        if (c.kind == 0) {
            return c.a.x == p.x && c.a.y == p.y;
        }
        if (c.kind == 1) {
            return dot(p.x - c.a.x, p.y - c.a.y, p.x - c.b.x, p.y - c.b.y) <= 0;
        }
        final long ax = c.a.x - p.x;
        final long ay = c.a.y - p.y;
        final long bx = c.b.x - p.x;
        final long by = c.b.y - p.y;
        final long cx = c.c.x - p.x;
        final long cy = c.c.y - p.y;
        final long al = ax * ax + ay * ay;
        final long bl = bx * bx + by * by;
        final long cl = cx * cx + cy * cy;
        final long det = ax * (by * cl - bl * cy)
                - ay * (bx * cl - bl * cx)
                + al * (bx * cy - by * cx);
        return det >= 0;
    }

    /**
     * Three non-collinear points have exactly one circumcircle. Three
     * collinear points have none, and the smallest circle containing them is
     * the diameter of the farthest pair.
     */
    private static Circle circumcircleOrDiameter(Point a, Point b, Point d) {
        if (cross(a, b, d) < 0) {
            final Point t = b;
            b = d;
            d = t;
        }
        if (cross(a, b, d) == 0) {
            final long ab = dist2(a, b);
            final long ad = dist2(a, d);
            final long bd = dist2(b, d);
            if (ab >= ad && ab >= bd) {
                return diameterCircle(a, b);
            }
            if (ad >= bd) {
                return diameterCircle(a, d);
            }
            return diameterCircle(b, d);
        }
        return new Circle(2, a, b, d);
    }

    private static long squaredRadius(Circle c) {
        if (c.kind == 0) {
            return 0;
        }
        if (c.kind == 1) {
            return dist2(c.a, c.b) / 4;
        }
        final long ab = dist2(c.a, c.b);
        final long bc = dist2(c.b, c.c);
        final long ca = dist2(c.c, c.a);
        final long cr = cross(c.a, c.b, c.c);
        return (ab * bc * ca) / (4 * cr * cr);
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final int n = (int) fs.nextLong();
        if (n <= 0) {
            System.out.println(0);
            return;
        }

        final Point[] pts = new Point[n];
        for (int i = 0; i < n; i++) {
            pts[i] = new Point(fs.nextLong(), fs.nextLong());
        }

        Circle c = pointCircle(pts[0]);
        for (int i = 0; i < n; i++) {
            if (inside(c, pts[i])) {
                continue;
            }
            c = pointCircle(pts[i]);
            for (int j = 0; j < i; j++) {
                if (inside(c, pts[j])) {
                    continue;
                }
                c = diameterCircle(pts[i], pts[j]);
                for (int k = 0; k < j; k++) {
                    if (!inside(c, pts[k])) {
                        c = circumcircleOrDiameter(pts[i], pts[j], pts[k]);
                    }
                }
            }
        }

        System.out.println(squaredRadius(c));
    }

    /** Token scanner over standard input. */
    private static final class FastScanner {
        private final InputStream in = System.in;
        private final byte[] buffer = new byte[1 << 16];
        private int pointer = 0;
        private int available = 0;

        private int readByte() throws IOException {
            if (pointer == available) {
                available = in.read(buffer);
                pointer = 0;
                if (available <= 0) {
                    return -1;
                }
            }
            return buffer[pointer++];
        }

        long nextLong() throws IOException {
            int c = readByte();
            while (c != -1 && c <= ' ') {
                c = readByte();
            }
            int sign = 1;
            if (c == '-') {
                sign = -1;
                c = readByte();
            }
            long value = 0;
            while (c > ' ') {
                value = value * 10 + (c - '0');
                c = readByte();
            }
            return value * sign;
        }
    }
}
