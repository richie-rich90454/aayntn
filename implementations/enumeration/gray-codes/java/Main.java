import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) {
            scanner.close();
            return;
        }
        int n = scanner.nextInt();
        scanner.close();
        if (n < 1 || n > 20) {
            return;
        }

        OutputStream out = new BufferedOutputStream(System.out);
        int total = 1 << n;
        for (int i = 0; i < total; i++) {
            int gray = i ^ (i >>> 1);
            for (int bit = n - 1; bit >= 0; bit--) {
                out.write(((gray >>> bit) & 1) == 1 ? '1' : '0');
            }
            out.write('\n');
        }
        out.flush();
    }
}
