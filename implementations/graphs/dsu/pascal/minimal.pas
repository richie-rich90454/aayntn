program minimal;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

type
  { A disjoint set over the elements 0..n-1.

    Union by size keeps the trees shallow and path compression flattens them,
    so the two together make every operation take amortised constant time.

    Ownership: the constructor allocates the parent and size arrays and the
    destructor releases them, so the caller owns the instance and must free it
    exactly once. }
  TDisjointSet = class
  private
    FParent: array of Integer;
    FSize: array of Integer;
  public
    constructor Create(N: Integer);
    destructor Destroy; override;
    function Find(X: Integer): Integer;
    procedure Unite(A, B: Integer);
    function Same(A, B: Integer): Boolean;
  end;

constructor TDisjointSet.Create(N: Integer);
var
  I: Integer;
begin
  inherited Create;
  if N < 0 then
    N := 0;
  SetLength(FParent, N);
  SetLength(FSize, N);
  for I := 0 to N - 1 do
  begin
    FParent[I] := I;
    FSize[I] := 1;
  end;
end;

destructor TDisjointSet.Destroy;
begin
  SetLength(FParent, 0);
  SetLength(FSize, 0);
  inherited Destroy;
end;

{ The representative of the set holding X, compressing the path to it. }
function TDisjointSet.Find(X: Integer): Integer;
var
  Root: Integer;
  Next: Integer;
begin
  Root := X;
  while FParent[Root] <> Root do
    Root := FParent[Root];
  { Every element on the path now points at the root. }
  while FParent[X] <> X do
  begin
    Next := FParent[X];
    FParent[X] := Root;
    X := Next;
  end;
  Result := Root;
end;

{ Merges the sets holding A and B. }
procedure TDisjointSet.Unite(A, B: Integer);
var
  RootA: Integer;
  RootB: Integer;
  Temp: Integer;
begin
  RootA := Find(A);
  RootB := Find(B);
  if RootA = RootB then
    Exit;
  { The larger set absorbs the smaller one, which keeps the trees shallow. }
  if FSize[RootA] < FSize[RootB] then
  begin
    Temp := RootA;
    RootA := RootB;
    RootB := Temp;
  end;
  FParent[RootB] := RootA;
  FSize[RootA] := FSize[RootA] + FSize[RootB];
end;

{ Whether A and B belong to the same set. }
function TDisjointSet.Same(A, B: Integer): Boolean;
begin
  Result := Find(A) = Find(B);
end;

var
  Groups: TDisjointSet;
begin
  { Self-check only: the class above is the reusable part, so this file asserts
    the documented contract instead of reading input. }
  Groups := TDisjointSet.Create(5);
  Groups.Unite(0, 1);
  Groups.Unite(2, 3);
  if not Groups.Same(0, 1) then
    Halt(1);
  if Groups.Same(0, 2) then
    Halt(1);
  if Groups.Same(0, 3) then
    Halt(1);
  if Groups.Find(0) <> Groups.Find(1) then
    Halt(1);
  if Groups.Find(0) = Groups.Find(2) then
    Halt(1);

  Groups.Unite(1, 3);
  if not Groups.Same(0, 3) then
    Halt(1);
  if not Groups.Same(2, 3) then
    Halt(1);
  if Groups.Same(0, 4) then
    Halt(1);

  Groups.Free;
end.
