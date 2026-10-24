import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * A half-plane a*x + b*y <= c is a directed line together with the side on
 * which it is feasible. The feasible region is the intersection of all the
 * half-planes. The polygon is kept in the dual form: a cyclic list of the
 * lines that support its edges, so the vertex between two consecutive lines is
 * their intersection and no coordinate is stored until the area is printed.
 */
public final class Main {

    private Main() {
    }

    private static final class Line {
        final long a;
        final long b;
        final long c;

        Line(long a, long b, long c) {
            this.a = a;
            this.b = b;
            this.c = c;
        }
    }

    private static long gcd64(long a, long b) {
        if (a < 0) {
            a = -a;
        }
        if (b < 0) {
            b = -b;
        }
        while (b != 0) {
            final long remainder = a % b;
            a = b;
            b = remainder;
        }
        return a;
    }

    /**
     * Whether the intersection of u and v lies in the closed half-plane h.
     * With w = det(u, v), x = X/w and y = Y/w, the value of h at that point
     * has the sign of (h.a*X + h.b*Y - h.c*w) multiplied by the sign of w.
     */
    private static boolean inside(Line u, Line v, Line h) {
        final long w = u.a * v.b - v.a * u.b;
        if (w == 0) {
            return true;
        }
        final long x = u.c * v.b - v.c * u.b;
        final long y = u.a * v.c - v.a * u.c;
        final long numerator = h.a * x + h.b * y - h.c * w;
        return w > 0 ? numerator <= 0 : numerator >= 0;
    }

    /**
     * The intersection of u and v as the reduced homogeneous point (x/w, y/w).
     * The three values are written into result; the method returns whether the
     * lines meet.
     */
    private static boolean intersect(Line u, Line v, long[] result) {
        result[2] = u.a * v.b - v.a * u.b;
        result[0] = u.c * v.b - v.c * u.b;
        result[1] = u.a * v.c - v.a * u.c;
        if (result[2] == 0) {
            return false;
        }
        final long divisor = gcd64(gcd64(result[0], result[1]), result[2]);
        result[0] /= divisor;
        result[1] /= divisor;
        result[2] /= divisor;
        if (result[2] < 0) {
            result[0] = -result[0];
            result[1] = -result[1];
            result[2] = -result[2];
        }
        return true;
    }

    public static void main(String[] args) throws IOException {
        final String input = new String(System.in.readAllBytes(), StandardCharsets.UTF_8).trim();
        if (input.isEmpty()) {
            return;
        }
        final String[] tokens = input.split("\\s+");

        int n = Math.max(0, Integer.parseInt(tokens[0]));
        final Line[] planes = new Line[n];
        long maxA = 1;
        long maxC = 0;
        int pointer = 1;
        for (int i = 0; i < n; i++) {
            if (pointer + 2 >= tokens.length) {
                n = i;
                break;
            }
            final long a = Long.parseLong(tokens[pointer]);
            final long b = Long.parseLong(tokens[pointer + 1]);
            final long c = Long.parseLong(tokens[pointer + 2]);
            pointer += 3;
            planes[i] = new Line(a, b, c);
            maxA = Math.max(maxA, Math.max(Math.abs(a), Math.abs(b)));
            maxC = Math.max(maxC, Math.abs(c));
        }

        /*
         * Every vertex of a bounded region is the intersection of two input
         * lines, so its coordinates are at most 2*maxA*maxC in absolute value.
         * The box is larger than every such vertex.
         */
        final long m = 2 * maxA * maxC + 2;

        final List<Line> lines = new ArrayList<>();
        lines.add(new Line(0, -1, m));
        lines.add(new Line(1, 0, m));
        lines.add(new Line(0, 1, m));
        lines.add(new Line(-1, 0, m));
        final List<Integer> poly = new ArrayList<>();
        poly.add(0);
        poly.add(1);
        poly.add(2);
        poly.add(3);

        for (int step = 0; step < n; step++) {
            final Line h = planes[step];
            final int index = lines.size();
            lines.add(h);

            final int k = poly.size();
            final boolean[] ins = new boolean[k];
            boolean anyInside = false;
            for (int i = 0; i < k; i++) {
                final int j = (i + 1) % k;
                ins[i] = inside(lines.get(poly.get(i)), lines.get(poly.get(j)), h);
                anyInside = anyInside || ins[i];
            }
            if (!anyInside) {
                poly.clear();
                continue;
            }

            final List<Integer> next = new ArrayList<>(k + 1);
            for (int i = 0; i < k; i++) {
                final int j = (i + 1) % k;
                if (ins[i] || ins[j]) {
                    next.add(poly.get(j));
                }
                if (ins[i] && !ins[j]) {
                    next.add(index);
                }
            }
            poly.clear();
            poly.addAll(next);
        }

        if (poly.isEmpty()) {
            System.out.println("0");
            return;
        }

        /*
         * The region is unbounded exactly when some nonzero direction d
         * satisfies a*d.x + b*d.y <= 0 for every constraint. An extreme ray
         * of that cone is parallel to one of the constraint lines, so testing
         * both directions of every line is enough.
         */
        boolean hasNormal = false;
        for (int i = 0; i < n; i++) {
            if (planes[i].a != 0 || planes[i].b != 0) {
                hasNormal = true;
            }
        }
        if (!hasNormal) {
            System.out.println("UNBOUNDED");
            return;
        }

        boolean unbounded = false;
        for (int i = 0; i < n && !unbounded; i++) {
            if (planes[i].a == 0 && planes[i].b == 0) {
                continue;
            }
            for (int direction = 0; direction < 2 && !unbounded; direction++) {
                final long dx = direction == 0 ? -planes[i].b : planes[i].b;
                final long dy = direction == 0 ? planes[i].a : -planes[i].a;
                boolean feasible = true;
                for (int j = 0; j < n; j++) {
                    if (planes[j].a * dx + planes[j].b * dy > 0) {
                        feasible = false;
                        break;
                    }
                }
                if (feasible) {
                    unbounded = true;
                }
            }
        }
        if (unbounded) {
            System.out.println("UNBOUNDED");
            return;
        }

        if (poly.size() < 3) {
            System.out.println("0");
            return;
        }

        final int k = poly.size();
        final long[] vx = new long[k];
        final long[] vy = new long[k];
        final long[] vw = new long[k];
        final long[] point = new long[3];
        for (int i = 0; i < k; i++) {
            final int j = (i + 1) % k;
            if (!intersect(lines.get(poly.get(i)), lines.get(poly.get(j)), point)) {
                System.out.println("0");
                return;
            }
            vx[i] = point[0];
            vy[i] = point[1];
            vw[i] = point[2];
        }

        long numerator = 0;
        long denominator = 1;
        for (int i = 0; i < k; i++) {
            final int j = (i + 1) % k;
            long term = vx[i] * vy[j] - vy[i] * vx[j];
            long scale = vw[i] * vw[j];
            if (scale < 0) {
                term = -term;
                scale = -scale;
            }
            long divisor = gcd64(term, scale);
            term /= divisor;
            scale /= divisor;
            numerator = numerator * scale + term * denominator;
            denominator *= scale;
            divisor = gcd64(numerator, denominator);
            numerator /= divisor;
            denominator /= divisor;
        }
        if (numerator < 0) {
            numerator = -numerator;
        }

        if (denominator == 1) {
            System.out.println(numerator);
        } else {
            System.out.println(numerator + "/" + denominator);
        }
    }
}
