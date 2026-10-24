{ Educational reference implementation: Pascal is not a USACO submission language. }
program SortedRangeSearchProgram;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

var
  N, I, Lo, Hi, Mid, Answer: LongInt;
  Point: Int64;
  Lefts, Rights: array of Int64;

begin
  Read(N);
  if N < 0 then
  begin
    WriteLn(-1);
    Halt(0);
  end;

  SetLength(Lefts, N);
  SetLength(Rights, N);

  for I := 0 to N - 1 do
  begin
    Read(Lefts[I]);
    Read(Rights[I]);
  end;

  Read(Point);

  Lo := 0;
  Hi := N - 1;
  Answer := -1;

  while Lo <= Hi do
  begin
    Mid := Lo + (Hi - Lo) div 2;
    if Point < Lefts[Mid] then
      Hi := Mid - 1
    else if Point > Rights[Mid] then
      Lo := Mid + 1
    else
    begin
      Answer := Mid;
      Break;
    end;
  end;

  WriteLn(Answer);
end.
