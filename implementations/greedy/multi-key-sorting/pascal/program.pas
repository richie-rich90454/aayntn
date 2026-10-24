{ Educational reference implementation: Pascal is not a USACO submission
  language. }

program MultiKeyProgram;
{$mode objfpc}{$H+}

uses SysUtils;

type
  { One record of three integer keys. }
  TRecord = record
    A: LongInt;
    B: LongInt;
    C: LongInt;
  end;

{ The required order: A ascending, then B descending, then C ascending.
  Equal records are never "before" each other, so the merge stays stable. }
function Before(const X, Y: TRecord): Boolean;
begin
  if X.A <> Y.A then
  begin
    Result := X.A < Y.A;
    Exit;
  end;
  if X.B <> Y.B then
  begin
    Result := X.B > Y.B;
    Exit;
  end;
  Result := X.C < Y.C;
end;

{ An iterative bottom-up merge sort, so the listing has no recursion and
  compiles under pas2js without a deep call stack. }
procedure MergeSort(var Records: array of TRecord; Count: Integer);
var
  Buffer: array of TRecord;
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
        if Before(Records[J], Records[I]) then
        begin
          Buffer[K] := Records[J];
          Inc(J);
        end
        else
        begin
          Buffer[K] := Records[I];
          Inc(I);
        end;
        Inc(K);
      end;
      while I < Middle do
      begin
        Buffer[K] := Records[I];
        Inc(I);
        Inc(K);
      end;
      while J < Right do
      begin
        Buffer[K] := Records[J];
        Inc(J);
        Inc(K);
      end;

      Left := Right;
    end;

    { The merged runs are in Buffer; copy them back for the next width. }
    for I := 0 to Count - 1 do
      Records[I] := Buffer[I];
    Width := Width * 2;
  end;

  SetLength(Buffer, 0);
end;

var
  N, I: Integer;
  Records: array of TRecord;
begin
  N := 0;
  Read(N);
  if N < 0 then
    N := 0;

  SetLength(Records, N);
  for I := 0 to N - 1 do
  begin
    Records[I].A := 0;
    Read(Records[I].A);
    Records[I].B := 0;
    Read(Records[I].B);
    Records[I].C := 0;
    Read(Records[I].C);
  end;

  MergeSort(Records, N);

  for I := 0 to N - 1 do
    WriteLn(IntToStr(Records[I].A) + ' ' + IntToStr(Records[I].B) + ' ' +
      IntToStr(Records[I].C));

  SetLength(Records, 0);
end.
