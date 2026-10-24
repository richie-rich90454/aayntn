{ Educational reference implementation: Pascal is not a USACO submission language. }
program TwoPointerPatternsProgram;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

var
  N, I, Left, Right: LongInt;
  Target, Total: Int64;
  Values: array of Int64;

begin
  N := 0;
  Read(N);
  if N < 0 then
    N := 0;

  SetLength(Values, N);
  for I := 0 to N - 1 do
  begin
    Values[I] := 0;
    Read(Values[I]);
  end;

  Target := 0;
  Read(Target);

  Total := 0;
  Left := 0;
  Right := N - 1;

  while Left < Right do
  begin
    if Values[Left] + Values[Right] <= Target then
    begin
      Total := Total + (Right - Left);
      Inc(Left);
    end
    else
      Dec(Right);
  end;

  WriteLn(IntToStr(Total));
end.
