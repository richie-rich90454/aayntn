program DsuProgram;
{$mode objfpc}{$H+}
{$I-}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

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
  N: Integer;
  Q: Integer;
  I: Integer;
  Op: Integer;
  U: Integer;
  V: Integer;
  Valid: Boolean;
  Groups: TDisjointSet;
begin
  { The input is exactly the contract: n, q and the q operations. }
  N := 0;
  Read(N);
  Q := 0;
  Read(Q);

  Groups := TDisjointSet.Create(N);

  for I := 0 to Q - 1 do
  begin
    Op := 0;
    U := 0;
    V := 0;
    Read(Op);
    Read(U);
    Read(V);
    Valid := (U >= 0) and (U < N) and (V >= 0) and (V < N);
    if Op = 1 then
    begin
      if Valid then
        Groups.Unite(U, V);
    end
    else if Op = 2 then
    begin
      if Valid and Groups.Same(U, V) then
        WriteLn('yes')
      else
        WriteLn('no');
    end;
  end;

  Groups.Free;
end.
