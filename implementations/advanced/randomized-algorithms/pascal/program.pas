{ Educational reference implementation: Pascal is not a USACO submission language. }
program RandomizedQuicksortProgram;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

const
  Mask32: Int64 = $FFFFFFFF;

var
  Values: array of LongInt;
  Comparisons: Int64;
  RngState: Int64;

function NextRandom: Int64;
begin
  RngState := (RngState xor ((RngState shl 13) and Mask32)) and Mask32;
  RngState := (RngState xor (RngState shr 17)) and Mask32;
  RngState := (RngState xor ((RngState shl 5) and Mask32)) and Mask32;
  NextRandom := RngState;
end;

procedure SwapValues(I, J: LongInt);
var
  Temporary: LongInt;
begin
  Temporary := Values[I];
  Values[I] := Values[J];
  Values[J] := Temporary;
end;

procedure Sort(Lo, Hi: LongInt);
var
  Pivot: LongInt;
  PivotIndex: LongInt;
  Lt, I, Gt: LongInt;
begin
  if Lo >= Hi then
    Exit;

  PivotIndex := Lo + LongInt(NextRandom mod (Hi - Lo + 1));
  Pivot := Values[PivotIndex];
  Lt := Lo;
  I := Lo;
  Gt := Hi;

  while I <= Gt do
  begin
    Comparisons := Comparisons + 1;
    if Values[I] < Pivot then
    begin
      SwapValues(Lt, I);
      Lt := Lt + 1;
      I := I + 1;
    end
    else if Values[I] > Pivot then
    begin
      SwapValues(I, Gt);
      Gt := Gt - 1;
    end
    else
      I := I + 1;
  end;

  Sort(Lo, Lt - 1);
  Sort(Gt + 1, Hi);
end;

var
  N, I: LongInt;

begin
  RngState := 2463534242;
  Comparisons := 0;
  N := 0;
  Read(N);
  if N <= 0 then
    Exit;

  SetLength(Values, N);
  for I := 0 to N - 1 do
  begin
    Values[I] := 0;
    Read(Values[I]);
  end;

  Sort(0, N - 1);

  for I := 0 to N - 1 do
  begin
    if I > 0 then
      Write(' ');
    Write(Values[I]);
  end;
  WriteLn;
  WriteLn(Comparisons);
end.
