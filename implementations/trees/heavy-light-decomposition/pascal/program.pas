program HldProgram;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TTokens = array of string;
  TIntArray = array of Integer;
  TInt64Array = array of Int64;
  TAdjList = array of TIntArray;

  { A heavy-light decomposition of a tree rooted at one vertex: Size[v] is the
    number of vertices in the subtree of v, Heavy[v] is the child of v with the
    largest subtree, Head[v] is the top of the chain of v and Pos[v] is its
    index in the flattened array.

    Ownership: the constructor allocates the tables and the destructor
    releases them, so the caller owns the instance and must free it exactly
    once. }
  THld = class
  private
    FN: Integer;
    FParent: TIntArray;
    FDepth: TIntArray;
    FSize: TIntArray;
    FHeavy: TIntArray;
    FHead: TIntArray;
    FPos: TIntArray;
    FFlat: TInt64Array;
    FPrefix: TInt64Array;
  public
    constructor Create(const Adj: TAdjList; Root: Integer; const Values: TInt64Array);
    destructor Destroy; override;
    function PathSum(U, V: Integer): Int64;
  end;

{ Reads the whole standard input so that the tokens can be split without
  depending on where the line breaks fall. }
function ReadAllInput: string;
var
  Row: string;
begin
  Result := '';
  while not EOF(Input) do
  begin
    ReadLn(Row);
    Result := Result + Row + ' ';
  end;
end;

function Tokenize(const Content: string): TTokens;
var
  I: Integer;
  Start: Integer;
begin
  SetLength(Result, 0);
  I := 1;
  while I <= Length(Content) do
  begin
    while (I <= Length(Content)) and (Content[I] <= ' ') do
      Inc(I);
    if I > Length(Content) then
      Break;
    Start := I;
    while (I <= Length(Content)) and (Content[I] > ' ') do
      Inc(I);
    SetLength(Result, Length(Result) + 1);
    Result[High(Result)] := Copy(Content, Start, I - Start);
  end;
end;

constructor THld.Create(const Adj: TAdjList; Root: Integer; const Values: TInt64Array);
var
  I: Integer;
  J: Integer;
  U: Integer;
  V: Integer;
  W: Integer;
  Order: TIntArray;
  Head: Integer;
  Tail: Integer;
  Timer: Integer;
begin
  inherited Create;
  FN := Length(Adj);
  SetLength(FParent, FN);
  SetLength(FDepth, FN);
  SetLength(FSize, FN);
  SetLength(FHeavy, FN);
  SetLength(FHead, FN);
  SetLength(FPos, FN);
  SetLength(FFlat, FN);
  SetLength(FPrefix, FN + 1);
  for I := 0 to FN - 1 do
  begin
    FDepth[I] := -1;
    FSize[I] := 1;
    FHeavy[I] := -1;
  end;
  if (FN <= 0) or (Root < 0) or (Root >= FN) then
    Exit;

  { A breadth-first walk from the root fixes the parents and the depths. }
  FParent[Root] := Root;
  FDepth[Root] := 0;
  SetLength(Order, FN);
  Head := 0;
  Tail := 0;
  Order[Tail] := Root;
  Inc(Tail);
  while Head < Tail do
  begin
    U := Order[Head];
    Inc(Head);
    for I := 0 to High(Adj[U]) do
    begin
      W := Adj[U][I];
      if FDepth[W] <> -1 then
        Continue;  { the vertex was already reached through another edge }
      FDepth[W] := FDepth[U] + 1;
      FParent[W] := U;
      Order[Tail] := W;
      Inc(Tail);
    end;
  end;

  { The subtree sizes are known from the leaves upwards, and the heavy child
    of a vertex is the child with the largest subtree. }
  for I := Tail - 1 downto 0 do
  begin
    U := Order[I];
    for J := 0 to High(Adj[U]) do
    begin
      W := Adj[U][J];
      if (W = U) or (FParent[W] <> U) then
        Continue;  { the vertex is not a child of U }
      FSize[U] := FSize[U] + FSize[W];
      if (FHeavy[U] = -1) or (FSize[W] > FSize[FHeavy[U]]) then
        FHeavy[U] := W;
    end;
  end;

  { The flattened array holds one chain after the other, so the vertices of a
    chain occupy a contiguous range of indices. }
  Timer := 0;
  for I := 0 to Tail - 1 do
  begin
    U := Order[I];
    if (U <> Root) and (FHeavy[FParent[U]] = U) then
      Continue;  { the vertex continues the chain of its parent }
    V := U;
    while V <> -1 do
    begin
      FHead[V] := U;
      FPos[V] := Timer;
      FFlat[Timer] := Values[V];
      Inc(Timer);
      V := FHeavy[V];
    end;
  end;

  { The prefix sums turn every chain segment into a single subtraction, so a
    path query costs one step per chain instead of a segment tree walk. }
  for I := 0 to FN - 1 do
    FPrefix[I + 1] := FPrefix[I] + FFlat[I];
end;

destructor THld.Destroy;
begin
  SetLength(FParent, 0);
  SetLength(FDepth, 0);
  SetLength(FSize, 0);
  SetLength(FHeavy, 0);
  SetLength(FHead, 0);
  SetLength(FPos, 0);
  SetLength(FFlat, 0);
  SetLength(FPrefix, 0);
  inherited Destroy;
end;

{ The sum of the values of the vertices on the path from U to V. }
function THld.PathSum(U, V: Integer): Int64;
var
  Total: Int64;
  Top: Integer;
  Swap: Integer;
begin
  if (U < 0) or (U >= FN) or (V < 0) or (V >= FN) then
  begin
    Result := 0;
    Exit;
  end;
  if (FDepth[U] < 0) or (FDepth[V] < 0) then
  begin
    { A vertex outside the component of the root lies on no path. }
    Result := 0;
    Exit;
  end;

  Total := 0;
  while FHead[U] <> FHead[V] do
  begin
    if FDepth[FHead[U]] < FDepth[FHead[V]] then
    begin
      Swap := U;
      U := V;
      V := Swap;
    end;
    { The chain of U is a contiguous range of the flattened array. }
    Top := FHead[U];
    Total := Total + (FPrefix[FPos[U] + 1] - FPrefix[FPos[Top]]);
    U := FParent[Top];
  end;
  if FDepth[U] > FDepth[V] then
  begin
    Swap := U;
    U := V;
    V := Swap;
  end;
  Total := Total + (FPrefix[FPos[V] + 1] - FPrefix[FPos[U]]);
  Result := Total;
end;

var
  Tokens: TTokens;
  Values: TInt64Array;
  N: Integer;
  M: Integer;
  Q: Integer;
  I: Integer;
  U: Integer;
  V: Integer;
  Index: Integer;
  Adj: TAdjList;
  Hld: THld;
begin
  Tokens := Tokenize(ReadAllInput);
  if Length(Tokens) < 2 then
    Halt(0);

  N := StrToIntDef(Tokens[0], 0);
  M := StrToIntDef(Tokens[1], 0);
  if N < 0 then
    N := 0;
  if M < 0 then
    M := 0;

  SetLength(Adj, N);
  for I := 0 to N - 1 do
    SetLength(Adj[I], 0);

  Index := 2;
  for I := 1 to M do
  begin
    if Index + 1 >= Length(Tokens) then
      Break;
    U := StrToIntDef(Tokens[Index], -1);
    V := StrToIntDef(Tokens[Index + 1], -1);
    Inc(Index, 2);
    if (U < 0) or (U >= N) or (V < 0) or (V >= N) then
      Continue;
    SetLength(Adj[U], Length(Adj[U]) + 1);
    Adj[U][High(Adj[U])] := V;
    SetLength(Adj[V], Length(Adj[V]) + 1);
    Adj[V][High(Adj[V])] := U;
  end;

  { The value of the vertex i is i + 1, so the vertex 0 has the value 1. }
  SetLength(Values, N);
  for I := 0 to N - 1 do
    Values[I] := I + 1;

  Hld := THld.Create(Adj, 0, Values);

  Q := 0;
  if Index < Length(Tokens) then
    Q := StrToIntDef(Tokens[Index], 0);
  Inc(Index);

  for I := 1 to Q do
  begin
    if Index + 1 >= Length(Tokens) then
      Break;
    U := StrToIntDef(Tokens[Index], -1);
    V := StrToIntDef(Tokens[Index + 1], -1);
    Inc(Index, 2);
    { An explicit line feed keeps the output identical on every platform. }
    Write(IntToStr(Hld.PathSum(U, V)), #10);
  end;

  Hld.Free;
end.
