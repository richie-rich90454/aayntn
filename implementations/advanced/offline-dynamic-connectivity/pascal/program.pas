{ Educational reference implementation: Pascal is not a USACO submission language. }
program OfflineDynamicConnectivity;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

const
  MAXN = 200005;
  MAXQ = 200005;

var
  N, Q, I, T, U, V: LongInt;

  OpType: array[1..MAXQ] of LongInt;
  OpU: array[1..MAXQ] of LongInt;
  OpV: array[1..MAXQ] of LongInt;

  EdgeU: array[1..MAXQ] of LongInt;
  EdgeV: array[1..MAXQ] of LongInt;
  EdgeCount: LongInt;

  Head: array of LongInt;
  NextEntry: array of LongInt;
  EntryEdge: array of LongInt;
  EntryCount: LongInt;

  HashSize, HashMask: LongInt;
  HashU: array of LongInt;
  HashV: array of LongInt;
  HashStart: array of LongInt;
  HashEdge: array of LongInt;

  Parent: array[1..MAXN] of LongInt;
  SetSize: array[1..MAXN] of LongInt;
  HistChild: array[1..MAXQ] of LongInt;
  HistRoot: array[1..MAXQ] of LongInt;
  HistSize: array[1..MAXQ] of LongInt;
  HistTop: LongInt;

  Answer: array[1..MAXQ] of Boolean;

function PairFind(A, B: LongInt): LongInt;
var
  H, Temp: LongInt;
begin
  if A > B then
  begin
    Temp := A;
    A := B;
    B := Temp;
  end;
  H := (A * 31 + B) and HashMask;
  while HashU[H] <> 0 do
  begin
    if (HashU[H] = A) and (HashV[H] = B) then
    begin
      PairFind := H;
      Exit;
    end;
    H := (H + 1) and HashMask;
  end;
  PairFind := -1;
end;

function PairSlot(A, B: LongInt): LongInt;
var
  H, Temp: LongInt;
begin
  if A > B then
  begin
    Temp := A;
    A := B;
    B := Temp;
  end;
  H := (A * 31 + B) and HashMask;
  while HashU[H] <> 0 do
  begin
    if (HashU[H] = A) and (HashV[H] = B) then
    begin
      PairSlot := H;
      Exit;
    end;
    H := (H + 1) and HashMask;
  end;
  HashU[H] := A;
  HashV[H] := B;
  HashStart[H] := 0;
  HashEdge[H] := 0;
  PairSlot := H;
end;

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
  RA, RB, Temp: LongInt;
begin
  RA := FindRoot(A);
  RB := FindRoot(B);
  if RA = RB then
    Exit;
  if SetSize[RA] < SetSize[RB] then
  begin
    Temp := RA;
    RA := RB;
    RB := Temp;
  end;
  Inc(HistTop);
  HistChild[HistTop] := RB;
  HistRoot[HistTop] := RA;
  HistSize[HistTop] := SetSize[RA];
  Parent[RB] := RA;
  SetSize[RA] := SetSize[RA] + SetSize[RB];
end;

procedure RollbackTo(Checkpoint: LongInt);
begin
  while HistTop > Checkpoint do
  begin
    Parent[HistChild[HistTop]] := HistChild[HistTop];
    SetSize[HistRoot[HistTop]] := HistSize[HistTop];
    Dec(HistTop);
  end;
end;

procedure AddInterval(Node, Lo, Hi, QL, QR, Edge: LongInt);
var
  Mid: LongInt;
begin
  if (QR < Lo) or (Hi < QL) then
    Exit;
  if (QL <= Lo) and (Hi <= QR) then
  begin
    Inc(EntryCount);
    NextEntry[EntryCount] := Head[Node];
    EntryEdge[EntryCount] := Edge;
    Head[Node] := EntryCount;
    Exit;
  end;
  Mid := (Lo + Hi) div 2;
  AddInterval(Node * 2, Lo, Mid, QL, QR, Edge);
  AddInterval(Node * 2 + 1, Mid + 1, Hi, QL, QR, Edge);
end;

procedure Solve(Node, Lo, Hi: LongInt);
var
  Checkpoint, Mid, E, Id: LongInt;
begin
  Checkpoint := HistTop;
  E := Head[Node];
  while E <> 0 do
  begin
    Id := EntryEdge[E];
    Unite(EdgeU[Id], EdgeV[Id]);
    E := NextEntry[E];
  end;
  if Lo = Hi then
  begin
    if OpType[Lo] = 3 then
      Answer[Lo] := FindRoot(OpU[Lo]) = FindRoot(OpV[Lo]);
  end
  else
  begin
    Mid := (Lo + Hi) div 2;
    Solve(Node * 2, Lo, Mid);
    Solve(Node * 2 + 1, Mid + 1, Hi);
  end;
  RollbackTo(Checkpoint);
end;

var
  H, L, E, Slot: LongInt;

begin
  Read(N);
  Read(Q);
  if Q <= 0 then
    Exit;

  SetLength(Head, 4 * Q + 5);
  SetLength(NextEntry, 40 * Q + 10);
  SetLength(EntryEdge, 40 * Q + 10);

  HashSize := 16;
  while HashSize < 4 * Q do
    HashSize := HashSize * 2;
  HashMask := HashSize - 1;
  SetLength(HashU, HashSize);
  SetLength(HashV, HashSize);
  SetLength(HashStart, HashSize);
  SetLength(HashEdge, HashSize);

  for I := 1 to N do
  begin
    Parent[I] := I;
    SetSize[I] := 1;
  end;
  EdgeCount := 0;
  EntryCount := 0;
  HistTop := 0;

  for I := 1 to Q do
  begin
    Read(T);
    Read(U);
    Read(V);
    OpType[I] := T;
    OpU[I] := U;
    OpV[I] := V;
    if T = 1 then
    begin
      Inc(EdgeCount);
      EdgeU[EdgeCount] := U;
      EdgeV[EdgeCount] := V;
      Slot := PairSlot(U, V);
      HashStart[Slot] := I;
      HashEdge[Slot] := EdgeCount;
    end
    else if T = 2 then
    begin
      Slot := PairFind(U, V);
      if (Slot >= 0) and (HashStart[Slot] <> 0) then
      begin
        L := HashStart[Slot];
        E := HashEdge[Slot];
        if L <= I - 1 then
          AddInterval(1, 1, Q, L, I - 1, E);
        HashStart[Slot] := 0;
      end;
    end;
  end;

  for H := 0 to HashMask do
    if HashStart[H] <> 0 then
      AddInterval(1, 1, Q, HashStart[H], Q, HashEdge[H]);

  Solve(1, 1, Q);

  for I := 1 to Q do
    if OpType[I] = 3 then
    begin
      if Answer[I] then
        WriteLn('YES')
      else
        WriteLn('NO');
    end;
end.
