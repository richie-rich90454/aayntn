import java.util.Scanner;

public class Main {
    private static int n;
    private static int full;
    private static long count;
    private static long nodes;

    private static void search(int row, int cols, int down, int anti) {
        nodes += 1;
        if (row == n) {
            count += 1;
            return;
        }
        int available = full & ~(cols | down | anti);
        while (available != 0) {
            int bit = available & -available;
            available ^= bit;
            search(row + 1, cols | bit, ((down | bit) << 1) & full, (anti | bit) >> 1);
        }
    }

    public static void main(String[] args) {
        try (Scanner scanner = new Scanner(System.in)) {
            if (!scanner.hasNextInt()) {
                return;
            }
            n = scanner.nextInt();
        }

        full = (1 << n) - 1;
        search(0, 0, 0, 0);
        System.out.println(count + " " + nodes);
    }
}
