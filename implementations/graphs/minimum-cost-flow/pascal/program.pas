{ Educational reference implementation: Pascal is not a USACO submission language. }
program MinimumCostFlowProgram;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

const
  { Kept below 2^53 because the reference compiler maps Int64 to a JavaScript
    number, and every distance this program builds is exact in that range. }
  Infinity: Int64 = 4000000000000000;

type
  TIntArray = array of Integer;
  TInt64Array = array of Int64;

var
  N: Integer;
  M: Integer;
  S: Integer;
  T: Integer;
  I: Integer;
  U: Integer;
  V: Integer;
  E: Integer;
  Count: Integer;
  At: Integer;
  HeapSize: Integer;
  Spot: Integer;
  Parent: Integer;
  Left: Integer;
  Right: Integer;
  Child: Integer;
  PopVertex: Integer;
  Cap: Int64;
  Cost: Int64;
  Flow: Int64;
  Total: Int64;
  Add: Int64;
  Candidate: Int64;
  PopKey: Int64;
  EdgeTo: TIntArray;
  EdgeNext: TIntArray;
  Head: TIntArray;
  PrevEdge: TIntArray;
  HeapVertex: TIntArray;
  EdgeCap: TInt64Array;
  EdgeCost: TInt64Array;
  Height: TInt64Array;
  Distance: TInt64Array;
  HeapKey: TInt64Array;

procedure HeapPush(Key: Int64; Vertex: Integer);
begin
  Spot := HeapSize;
  HeapSize := HeapSize + 1;
  while Spot > 0 do
  begin
    Parent := (Spot - 1) div 2;
    if HeapKey[Parent] <= Key then
      Break;
    HeapKey[Spot] := HeapKey[Parent];
    HeapVertex[Spot] := HeapVertex[Parent];
    Spot := Parent;
  end;
  HeapKey[Spot] := Key;
  HeapVertex[Spot] := Vertex;
end;

procedure HeapPop;
var
  TopKey: Int64;
  TopVertex: Integer;
  LastKey: Int64;
  LastVertex: Integer;
begin
  TopKey := HeapKey[0];
  TopVertex := HeapVertex[0];
  HeapSize := HeapSize - 1;
  LastKey := HeapKey[HeapSize];
  LastVertex := HeapVertex[HeapSize];
  Spot := 0;
  while True do
  begin
    Left := 2 * Spot + 1;
    if Left >= HeapSize then
      Break;
    Right := Left + 1;
    if (Right < HeapSize) and (HeapKey[Right] < HeapKey[Left]) then
      Child := Right
    else
      Child := Left;
    if HeapKey[Child] >= LastKey then
      Break;
    HeapKey[Spot] := HeapKey[Child];
    HeapVertex[Spot] := HeapVertex[Child];
    Spot := Child;
  end;
  if HeapSize > 0 then
  begin
    HeapKey[Spot] := LastKey;
    HeapVertex[Spot] := LastVertex;
  end;
  PopKey := TopKey;
  PopVertex := TopVertex;
end;

begin
  N := 0;
  Read(N);
  M := 0;
  Read(M);
  S := 0;
  Read(S);
  T := 0;
  Read(T);
  if (N <= 0) or (S < 0) or (S >= N) or (T < 0) or (T >= N) or (S = T) then
  begin
    WriteLn('0 0');
    Exit;
  end;
  if M < 0 then
    M := 0;

  SetLength(Head, N);
  for I := 0 to N - 1 do
    Head[I] := -1;
  SetLength(EdgeTo, 2 * M + 2);
  SetLength(EdgeNext, 2 * M + 2);
  SetLength(EdgeCap, 2 * M + 2);
  SetLength(EdgeCost, 2 * M + 2);
  Count := 0;
  for E := 0 to M - 1 do
  begin
    U := 0;
    V := 0;
    Cap := 0;
    Cost := 0;
    Read(U);
    Read(V);
    Read(Cap);
    Read(Cost);
    if (U < 0) or (U >= N) or (V < 0) or (V >= N) or (Cap < 0) then
      Continue;
    EdgeTo[Count] := V;
    EdgeCap[Count] := Cap;
    EdgeCost[Count] := Cost;
    EdgeNext[Count] := Head[U];
    Head[U] := Count;
    Count := Count + 1;
    EdgeTo[Count] := U;
    EdgeCap[Count] := 0;
    EdgeCost[Count] := -Cost;
    EdgeNext[Count] := Head[V];
    Head[V] := Count;
    Count := Count + 1;
  end;

  SetLength(Height, N);
  for I := 0 to N - 1 do
    Height[I] := 0;
  SetLength(Distance, N);
  SetLength(PrevEdge, N);
  SetLength(HeapKey, 2 * M + 3);
  SetLength(HeapVertex, 2 * M + 3);
  Flow := 0;
  Total := 0;

  while True do
  begin
    for I := 0 to N - 1 do
    begin
      Distance[I] := Infinity;
      PrevEdge[I] := -1;
    end;
    Distance[S] := 0;
    HeapSize := 0;
    HeapPush(0, S);
    while HeapSize > 0 do
    begin
      HeapPop;
      if PopKey <> Distance[PopVertex] then
        Continue;
      At := Head[PopVertex];
      while At <> -1 do
      begin
        if EdgeCap[At] > 0 then
        begin
          { The reduced cost is nonnegative while the potentials are feasible. }
          Candidate := PopKey + EdgeCost[At] + Height[PopVertex] - Height[EdgeTo[At]];
          if Candidate < Distance[EdgeTo[At]] then
          begin
            Distance[EdgeTo[At]] := Candidate;
            PrevEdge[EdgeTo[At]] := At;
            HeapPush(Candidate, EdgeTo[At]);
          end;
        end;
        At := EdgeNext[At];
      end;
    end;
    if Distance[T] = Infinity then
      Break;
    for I := 0 to N - 1 do
      if Distance[I] < Infinity then
        Height[I] := Height[I] + Distance[I];

    Add := -1;
    V := T;
    while V <> S do
    begin
      E := PrevEdge[V];
      if (Add < 0) or (EdgeCap[E] < Add) then
        Add := EdgeCap[E];
      V := EdgeTo[E xor 1];
    end;
    V := T;
    while V <> S do
    begin
      E := PrevEdge[V];
      EdgeCap[E] := EdgeCap[E] - Add;
      EdgeCap[E xor 1] := EdgeCap[E xor 1] + Add;
      V := EdgeTo[E xor 1];
    end;
    Flow := Flow + Add;
    Total := Total + Add * (Height[T] - Height[S]);
  end;

  Write(Flow);
  Write(' ');
  WriteLn(Total);
end.
