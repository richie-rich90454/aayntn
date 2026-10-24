program JohnsonProgram;
{$mode objfpc}{$H+}
{$I-}
{ Educational reference implementation: Pascal is not a USACO submission language. }

uses SysUtils;

const
  { Larger than any shortest path this program can build from two finite
    values. The reference compiler represents Int64 as a JavaScript number, so
    the sentinel is kept below 2^53 and every distance the fixtures use is
    exact. }
  Infinity: Int64 = 4000000000000000;

type
  TInt64Array = array of Int64;
  TIntArray = array of Integer;

var
  N: Integer;
  M: Integer;
  I: Integer;
  U: Integer;
  V: Integer;
  E: Integer;
  Count: Integer;
  Pass: Integer;
  Source: Integer;
  HeapSize: Integer;
  At: Integer;
  Spot: Integer;
  Parent: Integer;
  Left: Integer;
  Right: Integer;
  Child: Integer;
  Changed: Boolean;
  NegativeCycle: Boolean;
  W: Int64;
  Candidate: Int64;
  PopKey: Int64;
  PopVertex: Integer;

  EdgeFrom: TIntArray;
  EdgeTo: TIntArray;
  EdgeWeight: TInt64Array;

  Head: TIntArray;
  NextArc: TIntArray;
  ArcTo: TIntArray;
  ArcWeight: TInt64Array;

  Height: TInt64Array;
  Distance: TInt64Array;
  HeapKey: TInt64Array;
  HeapVertex: TIntArray;

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
  if N < 0 then
    N := 0;
  M := 0;
  Read(M);
  if N <= 0 then
  begin
    WriteLn;
    Exit;
  end;
  if M < 0 then
    M := 0;

  SetLength(EdgeFrom, M + 1);
  SetLength(EdgeTo, M + 1);
  SetLength(EdgeWeight, M + 1);
  Count := 0;
  for E := 0 to M - 1 do
  begin
    U := 0;
    V := 0;
    W := 0;
    Read(U);
    Read(V);
    Read(W);
    if (U < 0) or (U >= N) or (V < 0) or (V >= N) then
      Continue;
    EdgeFrom[Count] := U;
    EdgeTo[Count] := V;
    EdgeWeight[Count] := W;
    Count := Count + 1;
  end;

  { Every vertex starts at zero, as if a virtual source were joined to it by an
    edge of weight zero. N relaxation passes then either produce the potentials
    or expose a negative cycle. }
  SetLength(Height, N);
  for I := 0 to N - 1 do
    Height[I] := 0;
  NegativeCycle := False;
  for Pass := 0 to N - 1 do
  begin
    Changed := False;
    for E := 0 to Count - 1 do
    begin
      Candidate := Height[EdgeFrom[E]] + EdgeWeight[E];
      if Candidate < Height[EdgeTo[E]] then
      begin
        Height[EdgeTo[E]] := Candidate;
        Changed := True;
      end;
    end;
    if not Changed then
      Break;
    if Pass = N - 1 then
      NegativeCycle := True;
  end;
  if NegativeCycle then
  begin
    WriteLn('NEGATIVE CYCLE');
    Exit;
  end;

  SetLength(Head, N);
  for I := 0 to N - 1 do
    Head[I] := -1;
  SetLength(NextArc, Count + 1);
  SetLength(ArcTo, Count + 1);
  SetLength(ArcWeight, Count + 1);
  for E := 0 to Count - 1 do
  begin
    U := EdgeFrom[E];
    V := EdgeTo[E];
    { The reduced weight is nonnegative: Height[V] <= Height[U] + W. }
    ArcTo[E] := V;
    ArcWeight[E] := EdgeWeight[E] + Height[U] - Height[V];
    NextArc[E] := Head[U];
    Head[U] := E;
  end;

  SetLength(Distance, N);
  SetLength(HeapKey, M + N + 1);
  SetLength(HeapVertex, M + N + 1);
  for Source := 0 to N - 1 do
  begin
    for I := 0 to N - 1 do
      Distance[I] := Infinity;
    Distance[Source] := 0;
    HeapSize := 0;
    HeapPush(0, Source);
    while HeapSize > 0 do
    begin
      HeapPop;
      if PopKey <> Distance[PopVertex] then
        Continue;
      At := Head[PopVertex];
      while At <> -1 do
      begin
        Candidate := PopKey + ArcWeight[At];
        if Candidate < Distance[ArcTo[At]] then
        begin
          Distance[ArcTo[At]] := Candidate;
          HeapPush(Candidate, ArcTo[At]);
        end;
        At := NextArc[At];
      end;
    end;
    for I := 0 to N - 1 do
    begin
      if I > 0 then
        Write(' ');
      if Distance[I] = Infinity then
        Write(-1)
      else
        Write(Distance[I] - Height[Source] + Height[I]);
    end;
    WriteLn;
  end;
end.
