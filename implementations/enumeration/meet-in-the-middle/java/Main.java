import java.util.Arrays;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) {
            scanner.close();
            return;
        }
        int n = scanner.nextInt();
        long limit = scanner.nextLong();
        if (n < 0 || n > 40) {
            scanner.close();
            return;
        }
        long[] values = new long[n];
        for (int i = 0; i < n; i++) {
            values[i] = scanner.nextLong();
        }
        scanner.close();

        int middle = n / 2;
        long[] left = subsetSums(values, 0, middle);
        long[] right = subsetSums(values, middle, n);

        Arrays.sort(right);

        long answer = 0;
        for (long value : left) {
            answer += upperBound(right, limit - value);
        }
        System.out.println(answer);
    }

    private static long[] subsetSums(long[] values, int from, int to) {
        long[] sums = new long[1 << (to - from)];
        int size = 1;
        for (int i = from; i < to; i++) {
            for (int j = 0; j < size; j++) {
                sums[size + j] = sums[j] + values[i];
            }
            size *= 2;
        }
        return sums;
    }

    private static int upperBound(long[] values, long target) {
        int low = 0;
        int high = values.length;
        while (low < high) {
            int middle = (low + high) >>> 1;
            if (values[middle] <= target) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        return low;
    }
}
