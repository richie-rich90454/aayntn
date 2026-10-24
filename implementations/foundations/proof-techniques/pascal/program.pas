{ Educational reference implementation: Pascal is not a USACO submission language. }
program ProofTechniques;
{$mode objfpc}{$H+}

uses SysUtils;

var
  N, K: Int64;
  Square, Total: Int64;
begin
  Read(N);
  if N < 0 then
    Exit;

  Square := N * N;
  Total := 0;
  K := 1;
  while K <= N do
  begin
    Total := Total + (2 * K - 1);
    K := K + 1;
  end;

  WriteLn(IntToStr(Square));
  WriteLn(IntToStr(Total));
  if Square = Total then
    WriteLn('MATCH')
  else
    WriteLn('DIFFER');
end.
