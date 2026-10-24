{ Educational reference implementation: Pascal is not a USACO submission language. }
program AmortizedAnalysis;
{$mode objfpc}{$H+}

uses SysUtils;

var
  N: Int64;
  Copies: Int64;
  Capacity: Int64;
begin
  Read(N);
  if N < 0 then
    N := 0;

  Copies := 0;
  Capacity := 1;
  while Capacity < N do
  begin
    Copies := Copies + Capacity;
    Capacity := Capacity * 2;
  end;

  WriteLn(IntToStr(Copies), ' ', IntToStr(Capacity));
end.
