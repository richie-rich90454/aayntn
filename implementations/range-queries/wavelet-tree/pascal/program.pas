{ Educational reference implementation: Pascal is not a USACO submission language. }
program WaveletTreeProgram;
{$mode objfpc}{$H+}

{
  A wavelet tree over a static array, stored level by level (the layout is
  also called a wavelet matrix).

  Every level keeps a prefix count of the elements that descend to the left
  child, and the values are stable partitioned before the next level. A k-th
  smallest query descends one level at a time.

  Input: n q, then the n values, then q lines "l r k" with 0-based half-open
  bounds [l, r). Output: one line per query, holding the k-th smallest value
  in a[l..r).
}

uses SysUtils;

type
  TInt64Array = array of Int64;
  TIntArray = array of LongInt;
  TLevels = array of TIntArray;

{ A bottom-up merge sort, so the sort cannot exhaust the stack. }
procedure SortValues(var Values: TInt64Array);
var
  N, Width, Left, Middle, Right, I, J, K: Integer;
  Temp: TInt64Array;
begin
  N := Length(Values);
  if N < 2 then
    Exit;

  SetLength(Temp, N);
  Width := 1;
  while Width < N do
  begin
    Left := 0;
    while Left < N do
    begin
      Middle := Left + Width;
      if Middle > N then
        Middle := N;
      Right := Left + 2 * Width;
      if Right > N then
        Right := N;

      I := Left;
      J := Middle;
      K := Left;
      while (I < Middle) and (J < Right) do
      begin
        if Values[I] <= Values[J] then
        begin
          Temp[K] := Values[I];
          Inc(I);
        end
        else
        begin
          Temp[K] := Values[J];
          Inc(J);
        end;
        Inc(K);
      end;
      while I < Middle do
      begin
        Temp[K] := Values[I];
        Inc(I);
        Inc(K);
      end;
      while J < Right do
      begin
        Temp[K] := Values[J];
        Inc(J);
        Inc(K);
      end;

      Left := Right;
    end;

    for I := 0 to N - 1 do
      Values[I] := Temp[I];
    Width := Width * 2;
  end;
end;

{ The first position whose value is not less than Target. }
function LowerBound(const Values: TInt64Array; Size: Integer; Target: Int64): Integer;
var
  Low, High, Middle: Integer;
begin
  Low := 0;
  High := Size;
  while Low < High do
  begin
    Middle := Low + (High - Low) div 2;
    if Values[Middle] < Target then
      Low := Middle + 1
    else
      High := Middle;
  end;
  Result := Low;
end;

var
  N, Q, I, D, M, Bits, Shift, Zeros, ZeroPosition, OnePosition: Integer;
  L, R, Rank: Integer;
  K: Int64;
  Values, Sorted: TInt64Array;
  Cur, Next, SwapBuffer: TIntArray;
  Prefix: TLevels;
  ZeroCount: TIntArray;

begin
  Read(N);
  Read(Q);
  if N <= 0 then
    Exit;

  SetLength(Values, N);
  SetLength(Sorted, N);
  for I := 0 to N - 1 do
  begin
    Read(Values[I]);
    Sorted[I] := Values[I];
  end;

  SortValues(Sorted);

  M := 0;
  for I := 0 to N - 1 do
  begin
    if M = 0 then
    begin
      Sorted[M] := Sorted[I];
      Inc(M);
    end
    else if Sorted[I] <> Sorted[M - 1] then
    begin
      Sorted[M] := Sorted[I];
      Inc(M);
    end;
  end;
  SetLength(Sorted, M);

  Bits := 0;
  while (Int64(1) shl Bits) < M do
    Inc(Bits);

  SetLength(Cur, N);
  SetLength(Next, N);
  for I := 0 to N - 1 do
    Cur[I] := LowerBound(Sorted, M, Values[I]);

  SetLength(Prefix, Bits);
  SetLength(ZeroCount, Bits);

  for D := 0 to Bits - 1 do
  begin
    Shift := Bits - 1 - D;
    SetLength(Prefix[D], N + 1);
    Prefix[D][0] := 0;
    Zeros := 0;
    for I := 0 to N - 1 do
    begin
      if ((Cur[I] shr Shift) and 1) = 0 then
        Inc(Zeros);
      Prefix[D][I + 1] := Zeros;
    end;
    ZeroCount[D] := Zeros;

    ZeroPosition := 0;
    OnePosition := Zeros;
    for I := 0 to N - 1 do
    begin
      if ((Cur[I] shr Shift) and 1) = 0 then
      begin
        Next[ZeroPosition] := Cur[I];
        Inc(ZeroPosition);
      end
      else
      begin
        Next[OnePosition] := Cur[I];
        Inc(OnePosition);
      end;
    end;

    SwapBuffer := Cur;
    Cur := Next;
    Next := SwapBuffer;
  end;

  for I := 0 to Q - 1 do
  begin
    Read(L);
    Read(R);
    Read(K);

    Rank := 0;
    for D := 0 to Bits - 1 do
    begin
      Zeros := Prefix[D][R] - Prefix[D][L];
      if K <= Zeros then
      begin
        L := Prefix[D][L];
        R := Prefix[D][R];
        Rank := Rank shl 1;
      end
      else
      begin
        K := K - Zeros;
        L := ZeroCount[D] + (L - Prefix[D][L]);
        R := ZeroCount[D] + (R - Prefix[D][R]);
        Rank := (Rank shl 1) or 1;
      end;
    end;
    WriteLn(Sorted[Rank]);
  end;
end.
