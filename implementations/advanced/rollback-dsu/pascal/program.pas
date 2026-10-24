{ Educational reference implementation: Pascal is not a USACO submission language. }
program RollbackDsu;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

const
  MAXN = 200005;
  MAXQ = 200005;

var
  N, Q, I, U, V: LongInt;
  Line, Discard: string;
  Parent: array[1..MAXN] of LongInt;
  Weight: array[1..MAXN] of LongInt;
  HistoryChild: array[1..MAXQ] of LongInt;
  HistoryRoot: array[1..MAXQ] of LongInt;
  HistoryWeight: array[1..MAXQ] of LongInt;
  HistoryTop: LongInt;

function FindRoot(Start: LongInt): LongInt;
var
  V: LongInt;
begin
  V := Start;
  while Parent[V] <> V do
    V := Parent[V];
  FindRoot := V;
end;

procedure Unite(A, B: LongInt);
var
  RA, RB, Swap: LongInt;
begin
  RA := FindRoot(A);
  RB := FindRoot(B);
  Inc(HistoryTop);
  if RA = RB then
  begin
    HistoryChild[HistoryTop] := 0;
    HistoryRoot[HistoryTop] := 0;
    HistoryWeight[HistoryTop] := 0;
    Exit;
  end;
  if Weight[RA] < Weight[RB] then
  begin
    Swap := RA;
    RA := RB;
    RB := Swap;
  end;
  HistoryChild[HistoryTop] := RB;
  HistoryRoot[HistoryTop] := RA;
  HistoryWeight[HistoryTop] := Weight[RA];
  Parent[RB] := RA;
  Weight[RA] := Weight[RA] + Weight[RB];
end;

procedure Rollback;
var
  Child, Root, OldWeight: LongInt;
begin
  if HistoryTop = 0 then
    Exit;
  Child := HistoryChild[HistoryTop];
  Root := HistoryRoot[HistoryTop];
  OldWeight := HistoryWeight[HistoryTop];
  Dec(HistoryTop);
  if Child = 0 then
    Exit;
  Parent[Child] := Child;
  Weight[Root] := OldWeight;
end;

function TakeInt(var S: string): LongInt;
var
  P, Value: LongInt;
begin
  S := Trim(S);
  P := 1;
  Value := 0;
  while (P <= Length(S)) and (S[P] >= '0') and (S[P] <= '9') do
  begin
    Value := Value * 10 + (Ord(S[P]) - Ord('0'));
    Inc(P);
  end;
  S := Trim(Copy(S, P, Length(S)));
  TakeInt := Value;
end;

begin
  N := 0;
  Q := 0;
  Read(N);
  Read(Q);
  ReadLn(Discard);

  for I := 1 to N do
  begin
    Parent[I] := I;
    Weight[I] := 1;
  end;
  HistoryTop := 0;

  for I := 1 to Q do
  begin
    Line := '';
    ReadLn(Line);
    if Copy(Line, 1, 5) = 'union' then
    begin
      Line := Copy(Line, 6, Length(Line));
      U := TakeInt(Line);
      V := TakeInt(Line);
      Unite(U, V);
    end
    else if Trim(Line) = 'rollback' then
      Rollback
    else
    begin
      Line := Copy(Line, 5, Length(Line));
      U := TakeInt(Line);
      V := TakeInt(Line);
      if FindRoot(U) = FindRoot(V) then
        WriteLn('YES')
      else
        WriteLn('NO');
    end;
  end;
end.
