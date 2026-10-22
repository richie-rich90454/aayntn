program KnapsackProgram;
{$mode objfpc}{$H+}
{$I-}
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
  N: Integer;
  Capacity: Integer;
  I: Integer;
  Kept: Integer;
  Weight: Integer;
  Value: Int64;
  Weights: TIntArray;
  Values: TInt64Array;
begin
  { The input is exactly the contract: n, the capacity and the n items. }
  N := 0;
  Read(N);
  Capacity := 0;
  Read(Capacity);
  if Capacity < 0 then
    Capacity := 0;

  SetLength(Weights, N);
  SetLength(Values, N);

  Kept := 0;
  for I := 0 to N - 1 do
  begin
    Weight := 0;
    Value := 0;
    Read(Weight);
    Read(Value);
    Weights[Kept] := Weight;
    Values[Kept] := Value;
    Inc(Kept);
  end;
  { A truncated input leaves fewer items behind. }
  SetLength(Weights, Kept);
  SetLength(Values, Kept);

  WriteLn(IntToStr(KnapsackMaxValue(Weights, Values, Capacity)));
end.
