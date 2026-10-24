import java.io.IOException;

public class Main {
    private static final class FastScanner {
        private final byte[] data;
        private int index;

        FastScanner(byte[] data) {
            this.data = data;
        }

        long nextLong() {
            while (index < data.length && data[index] <= ' ') {
                index++;
            }
            boolean negative = false;
            if (index < data.length && data[index] == '-') {
                negative = true;
                index++;
            }
            long value = 0;
            while (index < data.length && data[index] > ' ') {
                value = value * 10 + (data[index] - '0');
                index++;
            }
            return negative ? -value : value;
        }
    }

    public static void main(String[] args) throws IOException {
        FastScanner scanner = new FastScanner(System.in.readAllBytes());

        int rows = (int) scanner.nextLong();
        int cols = (int) scanner.nextLong();
        long[][] diff = new long[rows + 2][cols + 2];

        for (int i = 1; i <= rows; i++) {
            for (int j = 1; j <= cols; j++) {
                diff[i][j] = scanner.nextLong();
            }
        }

        for (int i = 1; i <= rows; i++) {
            long previous = 0;
            for (int j = 1; j <= cols; j++) {
                long current = diff[i][j];
                diff[i][j] = current - previous;
                previous = current;
            }
        }

        for (int j = 1; j <= cols; j++) {
            for (int i = rows; i >= 2; i--) {
                diff[i][j] -= diff[i - 1][j];
            }
        }

        int queries = (int) scanner.nextLong();
        for (int k = 0; k < queries; k++) {
            int r1 = (int) scanner.nextLong();
            int c1 = (int) scanner.nextLong();
            int r2 = (int) scanner.nextLong();
            int c2 = (int) scanner.nextLong();
            long value = scanner.nextLong();
            diff[r1][c1] += value;
            diff[r2 + 1][c1] -= value;
            diff[r1][c2 + 1] -= value;
            diff[r2 + 1][c2 + 1] += value;
        }

        for (int i = 1; i <= rows; i++) {
            for (int j = 1; j <= cols; j++) {
                diff[i][j] += diff[i - 1][j] + diff[i][j - 1] - diff[i - 1][j - 1];
            }
        }

        StringBuilder output = new StringBuilder();
        for (int i = 1; i <= rows; i++) {
            for (int j = 1; j <= cols; j++) {
                if (j > 1) {
                    output.append(' ');
                }
                output.append(diff[i][j]);
            }
            output.append('\n');
        }
        System.out.print(output);
    }
}
