program LcaProgram;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TTokens = array of string;
  TIntArray = array of Integer;
  TAdjList = array of TIntArray;

  { A binary-lifting table for a tree rooted at one vertex: Up[k * n + v] is
    the ancestor of v that lies 2^k edges above it, and Depth[v] is the number
    of edges from the root to v.

    Ownership: the constructor allocates the tables and the destructor
    releases them, so the caller owns the instance and must free it exactly
    once. }
  TLca = class
  private
    FN: Integer;
    FLevels: Integer;
    FDepth: TIntArray;
    FUp: TIntArray;
  public
    constructor Create(const Adj: TAdjList; Root: Integer);
    destructor Destroy; override;
    function Lift(V, K: Integer): Integer;
    function DepthOf(V: Integer): Integer;
    function Query(U, V: Integer): Integer;
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

constructor TLca.Create(const Adj: TAdjList; Root: Integer);
var
  I: Integer;
  Levels: Integer;
  Queue: TIntArray;
  Head: Integer;
  Tail: Integer;
  U: Integer;
  W: Integer;
  K: Integer;
  V: Integer;
  Middle: Integer;
begin
  inherited Create;
  FN := Length(Adj);
  Levels := 1;
  while (1 shl Levels) <= FN do
    Inc(Levels);
  FLevels := Levels;
  SetLength(FDepth, FN);
  for I := 0 to FN - 1 do
    FDepth[I] := -1;
  SetLength(FUp, Levels * FN);

  if (FN <= 0) or (Root < 0) or (Root >= FN) then
    Exit;

  { The root is its own ancestor, so the table stays defined everywhere. }
  FUp[Root] := Root;
  FDepth[Root] := 0;

  SetLength(Queue, FN);
  Head := 0;
  Tail := 0;
  Queue[Tail] := Root;
  Inc(Tail);
  while Head < Tail do
  begin
    U := Queue[Head];
    Inc(Head);
    for I := 0 to High(Adj[U]) do
    begin
      W := Adj[U][I];
      if FDepth[W] <> -1 then
        Continue;  { the vertex was already reached through another edge }
      FDepth[W] := FDepth[U] + 1;
      FUp[W] := U;
      Queue[Tail] := W;
      Inc(Tail);
    end;
  end;

  { The table of the 2^k ancestors is built from the table of the 2^(k-1). }
  for K := 1 to Levels - 1 do
    for V := 0 to FN - 1 do
    begin
      Middle := FUp[(K - 1) * FN + V];
      FUp[K * FN + V] := FUp[(K - 1) * FN + Middle];
    end;
end;

destructor TLca.Destroy;
begin
  SetLength(FDepth, 0);
  SetLength(FUp, 0);
  inherited Destroy;
end;

{ The lowest common ancestor of U and V. }
function TLca.Query(U, V: Integer): Integer;
var
  Difference: Integer;
  K: Integer;
  AncestorU: Integer;
  AncestorV: Integer;
  Swap: Integer;
begin
  if (U < 0) or (U >= FN) or (V < 0) or (V >= FN) then
  begin
    Result := -1;
    Exit;
  end;
  if (FDepth[U] < 0) or (FDepth[V] < 0) then
  begin
    { A vertex outside the component of the root has no ancestor. }
    Result := -1;
    Exit;
  end;
  if FDepth[U] < FDepth[V] then
  begin
    Swap := U;
    U := V;
    V := Swap;
  end;

  { Lift the deeper vertex until both stand at the same depth. }
  Difference := FDepth[U] - FDepth[V];
  for K := 0 to FLevels - 1 do
    if ((Difference shr K) and 1) <> 0 then
      U := FUp[K * FN + U];
  if U = V then
  begin
    Result := U;
    Exit;
  end;

  { From the largest jump downwards, the two vertices either stay together or
    they both move one step below the common ancestor. }
  for K := FLevels - 1 downto 0 do
  begin
    AncestorU := FUp[K * FN + U];
    AncestorV := FUp[K * FN + V];
    if AncestorU <> AncestorV then
    begin
      U := AncestorU;
      V := AncestorV;
    end;
  end;
  Result := FUp[U];
end;

var
  Tokens: TTokens;
  N: Integer;
  M: Integer;
  Q: Integer;
  I: Integer;
  U: Integer;
  V: Integer;
  Index: Integer;
  Adj: TAdjList;
  Lca: TLca;
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

  Lca := TLca.Create(Adj, 0);

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
    Write(IntToStr(Lca.Query(U, V)), #10);
  end;

  Lca.Free;
end.
