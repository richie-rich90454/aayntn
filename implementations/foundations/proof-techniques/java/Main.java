import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (!in.hasNextLong()) {
            return;
        }

        long n = in.nextLong();
        if (n < 0) {
            return;
        }

        long square = n * n;
        long total = 0;
        for (long k = 1; k <= n; k++) {
            total += 2 * k - 1;
        }

        System.out.println(square);
        System.out.println(total);
        System.out.println(square == total ? "MATCH" : "DIFFER");
    }
}
