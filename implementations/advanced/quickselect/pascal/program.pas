{ Educational reference implementation: Pascal is not a USACO submission language. }
program QuickselectProgram;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

type
  TIntArray = array of LongInt;

procedure SwapValues(var A: TIntArray; I, J: Integer);
var
  Temporary: LongInt;
begin
  Temporary := A[I];
  A[I] := A[J];
  A[J] := Temporary;
end;

function MedianOfThree(const A: TIntArray; Lo, Mid, Hi: Integer): LongInt;
var
  X, Y, Z, Temporary: LongInt;
begin
  X := A[Lo];
  Y := A[Mid];
  Z := A[Hi];
  if X > Y then
  begin
    Temporary := X;
    X := Y;
    Y := Temporary;
  end;
  if Y > Z then
  begin
    Temporary := Y;
    Y := Z;
    Z := Temporary;
  end;
  if X > Y then
  begin
    Temporary := X;
    X := Y;
    Y := Temporary;
  end;
  MedianOfThree := Y;
end;

function SelectKth(var A: TIntArray; N, K: Integer): LongInt;
var
  Lo, Hi, Target, Mid, Lt, I, Gt: Integer;
  Pivot: LongInt;
begin
  Lo := 0;
  Hi := N - 1;
  Target := K - 1;

  while Lo < Hi do
  begin
    Mid := Lo + (Hi - Lo) div 2;
    Pivot := MedianOfThree(A, Lo, Mid, Hi);
    Lt := Lo;
    I := Lo;
    Gt := Hi;

    while I <= Gt do
    begin
      if A[I] < Pivot then
      begin
        SwapValues(A, Lt, I);
        Lt := Lt + 1;
        I := I + 1;
      end
      else if A[I] > Pivot then
      begin
        SwapValues(A, I, Gt);
        Gt := Gt - 1;
      end
      else
        I := I + 1;
    end;

    if Target < Lt then
      Hi := Lt - 1
    else if Target > Gt then
      Lo := Gt + 1
    else
    begin
      SelectKth := Pivot;
      Exit;
    end;
  end;

  SelectKth := A[Lo];
end;

procedure Run;
var
  N, I, K: Integer;
  Value: LongInt;
  A: TIntArray;
begin
  N := 0;
  Read(N);
  if N <= 0 then
    Exit;

  SetLength(A, N);
  for I := 0 to N - 1 do
  begin
    Value := 0;
    Read(Value);
    A[I] := Value;
  end;

  K := 0;
  Read(K);
  if (K < 1) or (K > N) then
    Exit;

  WriteLn(SelectKth(A, N, K));
end;

begin
  Run;
end.
