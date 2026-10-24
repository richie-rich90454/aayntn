{ Educational reference implementation: Pascal is not a USACO submission language. }

program HungarianProgram;
{$mode objfpc}{$H+}

uses SysUtils;

const
  BigValue = High(Int64) div 4;

type
  TInt64Array = array of Int64;
  TIntArray = array of LongInt;
  TBoolArray = array of Boolean;
  TMatrix = array of TInt64Array;

var
  N, I, J, I0, J0, J1: LongInt;
  Delta, Cur, Total: Int64;
  Cost: TMatrix;
  U, V, MinV: TInt64Array;
  P, Way, Assignment: TIntArray;
  Used: TBoolArray;
  Row: string;

begin
  Read(N);
  if N <= 0 then
  begin
    WriteLn(0);
    WriteLn;
    Exit;
  end;

  SetLength(Cost, N);
  for I := 0 to N - 1 do
    SetLength(Cost[I], N);
  for I := 0 to N - 1 do
    for J := 0 to N - 1 do
      Read(Cost[I][J]);

  SetLength(U, N + 1);
  SetLength(V, N + 1);
  SetLength(MinV, N + 1);
  SetLength(P, N + 1);
  SetLength(Way, N + 1);
  SetLength(Used, N + 1);
  for I := 0 to N do
  begin
    U[I] := 0;
    V[I] := 0;
    MinV[I] := 0;
    P[I] := 0;
    Way[I] := 0;
    Used[I] := False;
  end;

  { Row minima are feasible dual potentials for costs of either sign. }
  for I := 1 to N do
  begin
    U[I] := Cost[I - 1][0];
    for J := 1 to N - 1 do
      if Cost[I - 1][J] < U[I] then
        U[I] := Cost[I - 1][J];
  end;

  for I := 1 to N do
  begin
    P[0] := I;
    J0 := 0;
    for J := 0 to N do
    begin
      MinV[J] := BigValue;
      Used[J] := False;
      Way[J] := 0;
    end;
    repeat
      Used[J0] := True;
      I0 := P[J0];
      Delta := BigValue;
      J1 := 0;
      for J := 1 to N do
        if not Used[J] then
        begin
          Cur := Cost[I0 - 1][J - 1] - U[I0] - V[J];
          if Cur < MinV[J] then
          begin
            MinV[J] := Cur;
            Way[J] := J0;
          end;
          if MinV[J] < Delta then
          begin
            Delta := MinV[J];
            J1 := J;
          end;
        end;
      for J := 0 to N do
        if Used[J] then
        begin
          U[P[J]] := U[P[J]] + Delta;
          V[J] := V[J] - Delta;
        end
        else
          MinV[J] := MinV[J] - Delta;
      J0 := J1;
    until P[J0] = 0;
    repeat
      J1 := Way[J0];
      P[J0] := P[J1];
      J0 := J1;
    until J0 = 0;
  end;

  SetLength(Assignment, N);
  for J := 1 to N do
    Assignment[P[J] - 1] := J - 1;
  Total := 0;
  for I := 0 to N - 1 do
    Total := Total + Cost[I][Assignment[I]];
  WriteLn(Total);
  Row := '';
  for I := 0 to N - 1 do
  begin
    if I > 0 then
      Row := Row + ' ';
    Row := Row + IntToStr(Assignment[I]);
  end;
  WriteLn(Row);
end.
