import java.io.IOException;

public class Main {
    private static final long BASE = 911382323L;

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

        int n = (int) scanner.nextLong();
        long[] prefix = new long[n + 1];
        long[] power = new long[n + 1];
        prefix[0] = 0;
        power[0] = 1;

        for (int i = 1; i <= n; i++) {
            long value = scanner.nextLong();
            prefix[i] = prefix[i - 1] * BASE + value;
            power[i] = power[i - 1] * BASE;
        }

        int q = (int) scanner.nextLong();
        StringBuilder output = new StringBuilder();
        for (int k = 0; k < q; k++) {
            int l1 = (int) scanner.nextLong();
            int r1 = (int) scanner.nextLong();
            int l2 = (int) scanner.nextLong();
            int r2 = (int) scanner.nextLong();

            if (r1 - l1 != r2 - l2) {
                output.append("NO\n");
                continue;
            }

            int length = r1 - l1 + 1;
            long first = prefix[r1] - prefix[l1 - 1] * power[length];
            long second = prefix[r2] - prefix[l2 - 1] * power[length];
            output.append(first == second ? "YES\n" : "NO\n");
        }

        System.out.print(output);
    }
}
