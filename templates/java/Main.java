/*
 * aayntn: the general-purpose Java contest template.
 *
 * The public class is named Main, which is what the USACO judge expects.
 * The input is read through a buffered byte parser rather than through
 * Scanner, because Scanner is far too slow for a large contest input.
 */
import java.io.DataInputStream;
import java.io.IOException;

public class Main {

    /** A buffered reader that parses whitespace-separated integers. */
    private static final class FastScanner {
        private final DataInputStream in = new DataInputStream(System.in);
        private final byte[] buffer = new byte[1 << 16];
        private int position = 0;
        private int length = 0;

        /** Returns the next byte, or -1 at the end of the input. */
        private int read() throws IOException {
            if (position == length) {
                length = in.read(buffer, 0, buffer.length);
                position = 0;
                if (length <= 0) {
                    return -1;
                }
            }
            return buffer[position++] & 0xff;
        }

        /**
         * Reads the next integer.
         *
         * @throws IOException when the input ends before an integer is read
         * @throws IllegalArgumentException when the token is not an integer
         */
        long nextLong() throws IOException {
            int c = read();
            while (c != -1 && c <= ' ') {
                c = read();
            }
            if (c == -1) {
                throw new IOException("the input ended before an integer was read");
            }

            int sign = 1;
            if (c == '-') {
                sign = -1;
                c = read();
            }

            long value = 0;
            while (c > ' ') {
                if (c < '0' || c > '9') {
                    throw new IllegalArgumentException("the token is not an integer");
                }
                value = value * 10 + (c - '0');
                c = read();
            }
            return value * sign;
        }
    }

    public static void main(String[] args) throws IOException {
        FastScanner fs = new FastScanner();

        int n = (int) fs.nextLong();

        // The algorithm goes here.

        System.out.println(n);
    }
}
