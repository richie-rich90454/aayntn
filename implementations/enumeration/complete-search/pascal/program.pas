{ Educational reference implementation: Pascal is not a USACO submission language. }

program CompleteSearch;
{$mode objfpc}{$H+}

uses SysUtils;

var
  N, I: Integer;
  Target, Answer: Int64;
  Values: array[0..19] of Int64;

procedure Search(Index: Integer; Running: Int64);
begin
  if Index = N then
  begin
    if Running = Target then
      Inc(Answer);
    Exit;
  end;
  Search(Index + 1, Running);
  Search(Index + 1, Running + Values[Index]);
end;

begin
  Read(N);
  for I := 0 to N - 1 do
    Read(Values[I]);
  Read(Target);
  Answer := 0;
  Search(0, 0);
  WriteLn(IntToStr(Answer));
end.
