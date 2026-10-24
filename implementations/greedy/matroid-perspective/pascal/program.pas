{ Educational reference implementation: Pascal is not a USACO submission language. }

program MatroidPerspectiveProgram;
{$mode objfpc}{$H+}

uses SysUtils;

type
  TItem = record
    Color: Int64;
    Weight: Int64;
  end;

  TItemArray = array of TItem;

function ItemBefore(const A, B: TItem): Boolean;
begin
  if A.Color <> B.Color then
    ItemBefore := A.Color < B.Color
  else
    ItemBefore := A.Weight > B.Weight;
end;

{ An iterative bottom-up merge sort, so the listing has no recursion and
  compiles under pas2js without a deep call stack. }
procedure MergeSortItems(var Values: TItemArray; Count: Integer);
var
  Buffer: TItemArray;
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
        if ItemBefore(Values[J], Values[I]) then
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
  N, I: Integer;
  Total: Int64;
  First: Boolean;
  Previous: Int64;
  Items: TItemArray;
begin
  N := 0;
  Read(N);

  if N <= 0 then
  begin
    WriteLn(0);
    Exit;
  end;

  SetLength(Items, N);
  for I := 0 to N - 1 do
  begin
    Items[I].Color := 0;
    Items[I].Weight := 0;
    Read(Items[I].Color);
    Read(Items[I].Weight);
  end;

  MergeSortItems(Items, N);

  Total := 0;
  First := True;
  Previous := 0;
  for I := 0 to N - 1 do
  begin
    if First or (Items[I].Color <> Previous) then
    begin
      Total := Total + Items[I].Weight;
      Previous := Items[I].Color;
      First := False;
    end;
  end;

  WriteLn(Total);
end.
