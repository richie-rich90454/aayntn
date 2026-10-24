{ Educational reference implementation: Pascal is not a USACO submission language. }
program IntegerPartitions;
{$mode objfpc}{$H+}
{$I-}

uses
  SysUtils;

const
  MODULUS = 1000000007;

var
  N, I, K, First, Second, Total: LongInt;
  Partitions: array of LongInt;

begin
  N := 0;
  Read(N);

  if N >= 0 then
  begin
    SetLength(Partitions, N + 1);
    Partitions[0] := 1;

    for I := 1 to N do
    begin
      Total := 0;
      K := 1;
      while True do
      begin
        First := K * (3 * K - 1) div 2;
        if First > I then
          Break;
        Second := K * (3 * K + 1) div 2;

        if (K and 1) = 1 then
        begin
          Total := Total + Partitions[I - First];
          if Total >= MODULUS then
            Total := Total - MODULUS;
          if Second <= I then
          begin
            Total := Total + Partitions[I - Second];
            if Total >= MODULUS then
              Total := Total - MODULUS;
          end;
        end
        else
        begin
          Total := Total - Partitions[I - First];
          if Total < 0 then
            Total := Total + MODULUS;
          if Second <= I then
          begin
            Total := Total - Partitions[I - Second];
            if Total < 0 then
              Total := Total + MODULUS;
          end;
        end;

        Inc(K);
      end;

      Partitions[I] := Total;
    end;

    WriteLn(Partitions[N]);
  end;
end.
