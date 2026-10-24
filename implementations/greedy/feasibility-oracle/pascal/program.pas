{ Educational reference implementation: Pascal is not a USACO submission language. }

program FeasibilityOracleProgram;
{$mode objfpc}{$H+}

uses SysUtils;

type
  TWeightArray = array of Int64;

{ An iterative bottom-up merge sort, so the listing has no recursion and
  compiles under pas2js without a deep call stack. }
procedure MergeSort(var Values: TWeightArray; Count: Integer);
var
  Buffer: TWeightArray;
  Width, Left, Middle, Right, I, J, K: Integer;
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
      Right := Middle + Width;
      if Right > Count then
        Right := Count;

      I := Left;
      J := Middle;
      K := Left;
      while (I < Middle) and (J < Right) do
      begin
        if Values[J] < Values[I] then
        begin
          Buffer[K] := Values[J];
          Inc(J);
        end
        else
        begin
          Buffer[K] := Values[I];
          Inc(I);
        end;
        Inc(K);
      end;
      while I < Middle do
      begin
        Buffer[K] := Values[I];
        Inc(I);
        Inc(K);
      end;
      while J < Right do
      begin
        Buffer[K] := Values[J];
        Inc(J);
        Inc(K);
      end;

      Left := Right;
    end;

    for I := 0 to Count - 1 do
      Values[I] := Buffer[I];
    Width := Width * 2;
  end;

  SetLength(Buffer, 0);
end;

var
  N, I, Count: Integer;
  Capacity, Used: Int64;
  Weights: TWeightArray;
begin
  N := 0;
  Capacity := 0;
  Read(N);
  Read(Capacity);

  if N <= 0 then
  begin
    WriteLn(0);
    Exit;
  end;

  SetLength(Weights, N);
  for I := 0 to N - 1 do
  begin
    Weights[I] := 0;
    Read(Weights[I]);
  end;

  MergeSort(Weights, N);

  Used := 0;
  Count := 0;
  for I := 0 to N - 1 do
  begin
    if Weights[I] > Capacity - Used then
      Break;
    Used := Used + Weights[I];
    Inc(Count);
  end;

  WriteLn(Count);
end.
