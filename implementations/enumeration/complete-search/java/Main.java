import java.util.Scanner;

public class Main {
    private static int n;
    private static long target;
    private static long[] values;
    private static long answer;

    private static void search(int index, long running) {
        if (index == n) {
            if (running == target) {
                answer += 1;
            }
            return;
        }
        search(index + 1, running);
        search(index + 1, running + values[index]);
    }

    public static void main(String[] args) {
        try (Scanner scanner = new Scanner(System.in)) {
            n = scanner.nextInt();
            values = new long[n];
            for (int i = 0; i < n; i++) {
                values[i] = scanner.nextLong();
            }
            target = scanner.nextLong();
        }

        answer = 0;
        search(0, 0);
        System.out.println(answer);
    }
}
