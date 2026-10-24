{ Educational reference implementation: Pascal is not a USACO submission language. }
program MatroidsProgram;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

type
  TEdge = record
    U: Integer;
    V: Integer;
    Weight: Int64;
  end;
  TEdgeArray = array of TEdge;

var
  N, M, I: Integer;
  Edges, Scratch: TEdgeArray;
  Parent, TreeSize: array of Integer;
  Total: Int64;

function FindRoot(X: Integer): Integer;
begin
  while Parent[X] <> X do
  begin
    Parent[X] := Parent[Parent[X]];
    X := Parent[X];
  end;
  FindRoot := X;
end;

function Unite(A, B: Integer): Boolean;
var
  Ra, Rb, Temporary: Integer;
begin
  Ra := FindRoot(A);
  Rb := FindRoot(B);
  if Ra = Rb then
  begin
    Unite := False;
    Exit;
  end;
  if TreeSize[Ra] < TreeSize[Rb] then
  begin
    Temporary := Ra;
    Ra := Rb;
    Rb := Temporary;
  end;
  Parent[Rb] := Ra;
  TreeSize[Ra] := TreeSize[Ra] + TreeSize[Rb];
  Unite := True;
end;

procedure MergeSort(var A, Buffer: TEdgeArray; Count: Integer);
var
  Width, Left, Middle, Right, I, J, K: Integer;
begin
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
      I := Left;
      J := Middle;
      K := Left;
      while (I < Middle) and (J < Right) do
      begin
        if A[I].Weight >= A[J].Weight then
        begin
          Buffer[K] := A[I];
          Inc(I);
        end
        else
        begin
          Buffer[K] := A[J];
          Inc(J);
        end;
        Inc(K);
      end;
      while I < Middle do
      begin
        Buffer[K] := A[I];
        Inc(I);
        Inc(K);
      end;
      while J < Right do
      begin
        Buffer[K] := A[J];
        Inc(J);
        Inc(K);
      end;
      Left := Left + 2 * Width;
    end;
    for I := 0 to Count - 1 do
      A[I] := Buffer[I];
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

  SetLength(Edges, M);
  SetLength(Scratch, M);
  for I := 0 to M - 1 do
  begin
    Edges[I].U := 0;
    Edges[I].V := 0;
    Edges[I].Weight := 0;
    Read(Edges[I].U);
    Read(Edges[I].V);
    Read(Edges[I].Weight);
    Dec(Edges[I].U);
    Dec(Edges[I].V);
  end;

  if N = 0 then
  begin
    WriteLn(0);
    Exit;
  end;

  SetLength(Parent, N);
  SetLength(TreeSize, N);
  for I := 0 to N - 1 do
  begin
    Parent[I] := I;
    TreeSize[I] := 1;
  end;

  MergeSort(Edges, Scratch, M);

  Total := 0;
  for I := 0 to M - 1 do
    if Unite(Edges[I].U, Edges[I].V) then
      Total := Total + Edges[I].Weight;

  WriteLn(Total);
end.
