program minimal;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TIntArray = array of Integer;
  TInt64Array = array of Int64;

{ Maximum total value of a subset of the items whose total weight is at most
  Capacity. Weights and Values hold one entry per item. }
function KnapsackMaxValue(const Weights: TIntArray; const Values: TInt64Array;
  Capacity: Integer): Int64;
var
  Table: TInt64Array;
  I: Integer;
  C: Integer;
  Weight: Integer;
  Candidate: Int64;
begin
  if Capacity < 0 then
  begin
    Result := 0;
    Exit;
  end;

  SetLength(Table, Capacity + 1);
  for C := 0 to Capacity do
    Table[C] := 0;

  for I := 0 to High(Weights) do
  begin
    Weight := Weights[I];
    if Weight < 0 then
      Weight := 0;

    { The capacity must run downwards: Table[C - Weight] has to still hold the
      answer for the items before item I. With an upwards sweep that cell
      would already include item I, so the item would be counted more than
      once and the table would solve the unbounded knapsack. }
    for C := Capacity downto Weight do
    begin
      Candidate := Table[C - Weight] + Values[I];
      if Candidate > Table[C] then
        Table[C] := Candidate;
    end;
  end;

  Result := Table[Capacity];
end;

var
  Weights: TIntArray;
  Values: TInt64Array;
begin
  { Self-check only: the routine above is the reusable part, so this file
    asserts the documented contract instead of reading input. }
  SetLength(Weights, 4);
  SetLength(Values, 4);
  Weights[0] := 3;
  Values[0] := 4;
  Weights[1] := 4;
  Values[1] := 5;
  Weights[2] := 5;
  Values[2] := 7;
  Weights[3] := 2;
  Values[3] := 3;

  if KnapsackMaxValue(Weights, Values, 7) <> 10 then
    Halt(1);

  { An item that fits twice is still worth its value only once. }
  SetLength(Weights, 1);
  SetLength(Values, 1);
  Weights[0] := 2;
  Values[0] := 3;
  if KnapsackMaxValue(Weights, Values, 4) <> 3 then
    Halt(1);

  { An item heavier than the budget is never taken. }
  if KnapsackMaxValue(Weights, Values, 1) <> 0 then
    Halt(1);

  { No items at all. }
  SetLength(Weights, 0);
  SetLength(Values, 0);
  if KnapsackMaxValue(Weights, Values, 7) <> 0 then
    Halt(1);
end.
