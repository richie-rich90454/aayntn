import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (!in.hasNextLong()) {
            return;
        }

        long n = in.nextLong();
        if (n < 0) {
            n = 0;
        }

        long copies = 0;
        long capacity = 1;
        while (capacity < n) {
            copies += capacity;
            capacity *= 2;
        }

        System.out.println(copies + " " + capacity);
    }
}
