import java.io.IOException;

public class Main {
    private static final int WORD_BITS = 32;

    private static byte[] data = new byte[0];
    private static int at = 0;

    private static long nextLong() {
        while (at < data.length && data[at] <= ' ') {
            at++;
        }
        long value = 0;
        while (at < data.length && data[at] > ' ') {
            value = value * 10 + (data[at] - '0');
            at++;
        }
        return value;
    }

    public static void main(String[] args) throws IOException {
        data = System.in.readAllBytes();

        int n = (int) nextLong();
        long limit = nextLong();
        int words = (int) (limit / WORD_BITS) + 1;
        int topBits = (int) (limit % WORD_BITS) + 1;

        int[] reachable = new int[words];
        reachable[0] = 1;

        for (int k = 0; k < n; k++) {
            long weight = nextLong();
            if (weight <= 0 || weight > limit) {
                continue;
            }

            int wordShift = (int) (weight / WORD_BITS);
            int bitShift = (int) (weight % WORD_BITS);

            for (int i = words - 1; i >= wordShift; i--) {
                int moved = reachable[i - wordShift] << bitShift;
                if (bitShift > 0 && i - wordShift - 1 >= 0) {
                    moved |= reachable[i - wordShift - 1] >>> (WORD_BITS - bitShift);
                }
                reachable[i] |= moved;
            }

            if (topBits < WORD_BITS) {
                reachable[words - 1] &= (1 << topBits) - 1;
            }
        }

        long answer = 0;
        for (int i = 0; i < words; i++) {
            answer += Integer.bitCount(reachable[i]);
        }
        System.out.println(answer);
    }
}
