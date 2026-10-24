{ Educational reference implementation: Pascal is not a USACO submission language. }
program LoopInvariants;
{$mode objfpc}{$H+}

uses SysUtils;

var
  N, I, Lo, Hi, Mid, Probes: LongInt;
  Target: Int64;
  A: array of Int64;
begin
  Read(N);
  SetLength(A, N);
  for I := 0 to N - 1 do
    Read(A[I]);
  Read(Target);

  Lo := 0;
  Hi := N;
  Probes := 0;
  while Lo < Hi do
  begin
    Mid := Lo + (Hi - Lo) div 2;
    Probes := Probes + 1;
    if A[Mid] < Target then
      Lo := Mid + 1
    else
      Hi := Mid;
  end;

  WriteLn(IntToStr(Lo), ' ', IntToStr(Probes));
end.
