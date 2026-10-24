{ Educational reference implementation: Pascal is not a USACO submission language. }
program VirtualTreeProgram;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

type
  TIntArray = array of Integer;
  TLongArray = array of Int64;
  TEdge = record
    Target: Integer;
    Weight: Int64;
    Next: Integer;
  end;
  TEdgeArray = array of TEdge;

var
  N, M, Q, I, J, K, V, U, E, Top, Timer, Count, TotalNodes, Unique: Integer;
  StackPointer, QueryId, Levels, EdgeCount: Integer;
  Head, Parent, Depth, Tin, Tout, Cursor, Stack: TIntArray;
  Marks, Nodes, VirtualStack, Stamp, Up: TIntArray;
  Distance: TLongArray;
  Edges: TEdgeArray;
  Total, W: Int64;

function IsAncestor(A, B: Integer): Boolean;
begin
  Result := (Tin[A] <= Tin[B]) and (Tin[B] < Tout[A]);
end;

function Lca(U, V: Integer): Integer;
var
  Difference, Level, AncestorU, AncestorV, Swap: Integer;
begin
  if (U < 0) or (U >= N) or (V < 0) or (V >= N) then
  begin
    Result := -1;
    Exit;
  end;
  if (Depth[U] < 0) or (Depth[V] < 0) then
  begin
    Result := -1;
    Exit;
  end;
  if Depth[U] < Depth[V] then
  begin
    Swap := U;
    U := V;
    V := Swap;
  end;
  Difference := Depth[U] - Depth[V];
  Level := 0;
  while Difference > 0 do
  begin
    if (Difference and 1) <> 0 then
      U := Up[Level * N + U];
    Difference := Difference shr 1;
    Inc(Level);
  end;
  if U = V then
  begin
    Result := U;
    Exit;
  end;
  for Level := Levels - 1 downto 0 do
  begin
    AncestorU := Up[Level * N + U];
    AncestorV := Up[Level * N + V];
    if AncestorU <> AncestorV then
    begin
      U := AncestorU;
      V := AncestorV;
    end;
  end;
  Result := Up[U];
end;

procedure SortByTin(var A: TIntArray; Count: Integer);
var
  Buffer: TIntArray;
  Width, Left, Middle, Right, First, Second, OutPos, P: Integer;
begin
  if Count < 2 then
    Exit;
  SetLength(Buffer, Count);
  Width := 1;
  while Width < Count do
  begin
    Left := 0;
    while Left < Count do
    begin
      Middle := Left + Width;
      if Middle > Count then
        Middle := Count;
      Right := Left + 2 * Width;
      if Right > Count then
        Right := Count;
      First := Left;
      Second := Middle;
      OutPos := Left;
      while (First < Middle) and (Second < Right) do
      begin
        if Tin[A[First]] <= Tin[A[Second]] then
        begin
          Buffer[OutPos] := A[First];
          Inc(First);
        end
        else
        begin
          Buffer[OutPos] := A[Second];
          Inc(Second);
        end;
        Inc(OutPos);
      end;
      while First < Middle do
      begin
        Buffer[OutPos] := A[First];
        Inc(First);
        Inc(OutPos);
      end;
      while Second < Right do
      begin
        Buffer[OutPos] := A[Second];
        Inc(Second);
        Inc(OutPos);
      end;
      Left := Right;
    end;
    for P := 0 to Count - 1 do
      A[P] := Buffer[P];
    Width := Width * 2;
  end;
end;

begin
  N := 0;
  M := 0;
  Read(N);
  Read(M);
  if N < 0 then
    N := 0;
  if M < 0 then
    M := 0;

  SetLength(Head, N);
  for I := 0 to N - 1 do
    Head[I] := -1;
  SetLength(Edges, 2 * M);
  EdgeCount := 0;
  for I := 0 to M - 1 do
  begin
    U := 0;
    V := 0;
    W := 0;
    Read(U);
    Read(V);
    Read(W);
    if (U < 0) or (U >= N) or (V < 0) or (V >= N) then
      Continue;
    Edges[EdgeCount].Target := V;
    Edges[EdgeCount].Weight := W;
    Edges[EdgeCount].Next := Head[U];
    Head[U] := EdgeCount;
    Inc(EdgeCount);
    Edges[EdgeCount].Target := U;
    Edges[EdgeCount].Weight := W;
    Edges[EdgeCount].Next := Head[V];
    Head[V] := EdgeCount;
    Inc(EdgeCount);
  end;

  Levels := 1;
  while (1 shl Levels) <= N do
    Inc(Levels);
  SetLength(Parent, N);
  SetLength(Depth, N);
  SetLength(Tin, N);
  SetLength(Tout, N);
  SetLength(Distance, N);
  SetLength(Up, Levels * N);
  if N > 0 then
  begin
    for I := 0 to N - 1 do
    begin
      Parent[I] := -1;
      Depth[I] := -1;
      Tin[I] := -1;
      Tout[I] := -1;
      Distance[I] := 0;
    end;
    Parent[0] := 0;
    Depth[0] := 0;
    Tin[0] := 0;
    Timer := 1;
    SetLength(Cursor, N);
    for I := 0 to N - 1 do
      Cursor[I] := Head[I];
    SetLength(Stack, N);
    Top := 0;
    Stack[0] := 0;
    while Top >= 0 do
    begin
      V := Stack[Top];
      E := Cursor[V];
      while (E <> -1) and (Parent[Edges[E].Target] <> -1) do
        E := Edges[E].Next;
      Cursor[V] := E;
      if E = -1 then
      begin
        Tout[V] := Timer;
        Dec(Top);
      end
      else
      begin
        Cursor[V] := Edges[E].Next;
        U := Edges[E].Target;
        Parent[U] := V;
        Depth[U] := Depth[V] + 1;
        Distance[U] := Distance[V] + Edges[E].Weight;
        Tin[U] := Timer;
        Inc(Timer);
        Inc(Top);
        Stack[Top] := U;
      end;
    end;

    { The root is its own ancestor, so every entry of the table is defined. }
    for I := 0 to N - 1 do
      if Parent[I] >= 0 then
        Up[I] := Parent[I]
      else
        Up[I] := I;
    for K := 1 to Levels - 1 do
      for V := 0 to N - 1 do
        Up[K * N + V] := Up[(K - 1) * N + Up[(K - 1) * N + V]];
  end;

  Q := 0;
  Read(Q);
  if Q < 0 then
    Q := 0;

  SetLength(Stamp, N);
  for I := 0 to N - 1 do
    Stamp[I] := 0;
  SetLength(Marks, N);
  SetLength(Nodes, 2 * N + 1);
  SetLength(VirtualStack, 2 * N + 1);

  for I := 0 to Q - 1 do
  begin
    K := 0;
    Read(K);
    if K < 0 then
      K := 0;
    QueryId := I + 1;
    Count := 0;
    for J := 0 to K - 1 do
    begin
      V := -1;
      Read(V);
      if (V >= 0) and (V < N) and (Depth[V] >= 0) and (Stamp[V] <> QueryId) then
      begin
        Stamp[V] := QueryId;
        Marks[Count] := V;
        Inc(Count);
      end;
    end;

    if Count < 2 then
    begin
      WriteLn(0);
      Continue;
    end;

    SortByTin(Marks, Count);
    TotalNodes := Count;
    for J := 0 to Count - 1 do
      Nodes[J] := Marks[J];
    for J := 0 to Count - 2 do
    begin
      U := Lca(Marks[J], Marks[J + 1]);
      if U >= 0 then
      begin
        Nodes[TotalNodes] := U;
        Inc(TotalNodes);
      end;
    end;
    SortByTin(Nodes, TotalNodes);

    Unique := 0;
    for J := 0 to TotalNodes - 1 do
      if (Unique = 0) or (Nodes[J] <> Nodes[Unique - 1]) then
      begin
        Nodes[Unique] := Nodes[J];
        Inc(Unique);
      end;

    Total := 0;
    StackPointer := 0;
    for J := 0 to Unique - 1 do
    begin
      V := Nodes[J];
      while (StackPointer > 0) and (not IsAncestor(VirtualStack[StackPointer - 1], V)) do
        Dec(StackPointer);
      if StackPointer > 0 then
        Total := Total + (Distance[V] - Distance[VirtualStack[StackPointer - 1]]);
      VirtualStack[StackPointer] := V;
      Inc(StackPointer);
    end;
    WriteLn(Total);
  end;
end.
