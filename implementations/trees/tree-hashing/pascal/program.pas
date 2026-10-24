{ Educational reference implementation: JavaScript/Pascal is not a USACO submission language. }
program TreeHashing;
{$mode objfpc}{$H+}

uses SysUtils;

const
  BaseFirst = 1000003;
  BaseSecond = 999983;
  Mask32 = 4294967295;

type
  THash = record
    First: Int64;
    Second: Int64;
  end;

  THashArray = array of THash;
  TIntArray = array of Integer;

  TTreeHash = record
    Size: Integer;
    Value: THash;
  end;

var
  SortTemp: THashArray;

{ A fixed 32-bit permutation, used to keep the fold from being linear. }
function MixFirst(Value: Int64): Int64;
var
  X: Int64;
begin
  X := Value and Mask32;
  X := (X xor ((X shl 13) and Mask32)) and Mask32;
  X := X xor (X shr 17);
  X := (X xor ((X shl 5) and Mask32)) and Mask32;
  Result := X;
end;

{ A second, differently shaped permutation for the other fingerprint. }
function MixSecond(Value: Int64): Int64;
var
  X: Int64;
begin
  X := (Value + 2654435769) and Mask32;
  X := (X xor ((X shl 5) and Mask32)) and Mask32;
  X := X xor (X shr 13);
  X := (X xor ((X shl 17) and Mask32)) and Mask32;
  Result := X;
end;

function Less(const A, B: THash): Boolean;
begin
  if A.First <> B.First then
    Result := A.First < B.First
  else
    Result := A.Second < B.Second;
end;

procedure Merge(var Values: THashArray; Left, Middle, Right: Integer);
var
  I, J, K: Integer;
begin
  I := Left;
  J := Middle + 1;
  K := Left;
  while (I <= Middle) and (J <= Right) do
  begin
    if Less(Values[I], Values[J]) then
    begin
      SortTemp[K] := Values[I];
      Inc(I);
    end
    else
    begin
      SortTemp[K] := Values[J];
      Inc(J);
    end;
    Inc(K);
  end;
  while I <= Middle do
  begin
    SortTemp[K] := Values[I];
    Inc(I);
    Inc(K);
  end;
  while J <= Right do
  begin
    SortTemp[K] := Values[J];
    Inc(J);
    Inc(K);
  end;
  for K := Left to Right do
    Values[K] := SortTemp[K];
end;

procedure MergeSort(var Values: THashArray; Left, Right: Integer);
var
  Middle: Integer;
begin
  if Left >= Right then
    Exit;
  Middle := (Left + Right) div 2;
  MergeSort(Values, Left, Middle);
  MergeSort(Values, Middle + 1, Right);
  Merge(Values, Left, Middle, Right);
end;

{ Read one tree as a parent array and return its size and root hash. }
function ReadAndHash: TTreeHash;
var
  N, I, J, K, P, Root, Head, Count, U, C: Integer;
  A, B: Int64;
  Parent, ChildCount, Start, Cursor, Children, Order: TIntArray;
  FirstHash, SecondHash: array of Int64;
  Buffer: THashArray;
begin
  Result.Size := 0;
  Result.Value.First := 0;
  Result.Value.Second := 0;

  N := 0;
  Read(N);
  if N < 1 then
    Exit;
  Result.Size := N;

  SetLength(Parent, N);
  for I := 0 to N - 1 do
  begin
    P := 0;
    Read(P);
    Parent[I] := P;
  end;

  Root := -1;
  for I := 0 to N - 1 do
    if (Parent[I] < 0) or (Parent[I] >= N) then
    begin
      Parent[I] := -1;
      if Root < 0 then
        Root := I;
    end;
  if Root < 0 then
  begin
    Root := 0;
    Parent[0] := -1;
  end;

  SetLength(ChildCount, N);
  for I := 0 to N - 1 do
    if (I <> Root) and (Parent[I] >= 0) then
      Inc(ChildCount[Parent[I]]);

  SetLength(Start, N + 1);
  Start[0] := 0;
  for I := 0 to N - 1 do
    Start[I + 1] := Start[I] + ChildCount[I];

  if N > 1 then
    SetLength(Children, N - 1)
  else
    SetLength(Children, 1);
  SetLength(Cursor, N);
  for I := 0 to N - 1 do
    if (I <> Root) and (Parent[I] >= 0) then
    begin
      P := Parent[I];
      Children[Start[P] + Cursor[P]] := I;
      Inc(Cursor[P]);
    end;

  { A breadth-first order has every parent before its children. }
  SetLength(Order, N);
  Order[0] := Root;
  Count := 1;
  Head := 0;
  while Head < Count do
  begin
    U := Order[Head];
    Inc(Head);
    for J := Start[U] to Start[U + 1] - 1 do
    begin
      Order[Count] := Children[J];
      Inc(Count);
    end;
  end;

  SetLength(FirstHash, N);
  SetLength(SecondHash, N);
  SetLength(Buffer, N);
  SetLength(SortTemp, N);

  { The reverse of the order puts every child before its parent. }
  for I := Count - 1 downto 0 do
  begin
    U := Order[I];
    K := 0;
    for J := Start[U] to Start[U + 1] - 1 do
    begin
      C := Children[J];
      Buffer[K].First := FirstHash[C];
      Buffer[K].Second := SecondHash[C];
      Inc(K);
    end;
    MergeSort(Buffer, 0, K - 1);

    A := 0;
    B := 0;
    for J := 0 to K - 1 do
    begin
      A := ((A * BaseFirst) + MixFirst(Buffer[J].First)) and Mask32;
      B := ((B * BaseSecond) + MixSecond(Buffer[J].Second)) and Mask32;
    end;
    FirstHash[U] := ((A * BaseFirst) + 1) and Mask32;
    SecondHash[U] := ((B * BaseSecond) + 1) and Mask32;
  end;

  Result.Value.First := FirstHash[Root];
  Result.Value.Second := SecondHash[Root];
end;

var
  FirstTree, SecondTree: TTreeHash;
begin
  FirstTree := ReadAndHash;
  SecondTree := ReadAndHash;

  if (FirstTree.Size > 0) and (FirstTree.Size = SecondTree.Size) and
     (FirstTree.Value.First = SecondTree.Value.First) and
     (FirstTree.Value.Second = SecondTree.Value.Second) then
    WriteLn('SAME')
  else
    WriteLn('DIFFERENT');
end.
