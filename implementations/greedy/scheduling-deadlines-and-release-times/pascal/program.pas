{ Educational reference implementation: Pascal is not a USACO submission language. }

program DeadlineProgram;
{$mode objfpc}{$H+}

uses SysUtils;

type
  { One job: it takes one unit of time and must finish by its deadline. }
  TJob = record
    Deadline: LongInt;
    Profit: Int64;
  end;

  TJobArray = array of TJob;
  THeap = array of Int64;

{ Nondecreasing deadline; profit only breaks ties deterministically. }
function Before(const X, Y: TJob): Boolean;
begin
  if X.Deadline <> Y.Deadline then
  begin
    Result := X.Deadline < Y.Deadline;
    Exit;
  end;
  Result := X.Profit < Y.Profit;
end;

{ An iterative bottom-up merge sort, so the listing needs no recursion. }
procedure MergeSort(var Jobs: TJobArray; Count: Integer);
var
  Buffer: TJobArray;
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
        if Before(Jobs[J], Jobs[I]) then
        begin
          Buffer[K] := Jobs[J];
          Inc(J);
        end
        else
        begin
          Buffer[K] := Jobs[I];
          Inc(I);
        end;
        Inc(K);
      end;
      while I < Middle do
      begin
        Buffer[K] := Jobs[I];
        Inc(I);
        Inc(K);
      end;
      while J < Right do
      begin
        Buffer[K] := Jobs[J];
        Inc(J);
        Inc(K);
      end;

      Left := Right;
    end;

    for I := 0 to Count - 1 do
      Jobs[I] := Buffer[I];
    Width := Width * 2;
  end;

  SetLength(Buffer, 0);
end;

procedure HeapPush(var Heap: THeap; var Size: Integer; Value: Int64);
var
  I, Parent: Integer;
  Temporary: Int64;
begin
  I := Size;
  Heap[I] := Value;
  Inc(Size);

  while I > 0 do
  begin
    Parent := (I - 1) div 2;
    if Heap[Parent] <= Heap[I] then
      Break;
    Temporary := Heap[Parent];
    Heap[Parent] := Heap[I];
    Heap[I] := Temporary;
    I := Parent;
  end;
end;

{ Removes the smallest profit from the min-heap. }
procedure HeapPop(var Heap: THeap; var Size: Integer);
var
  I, Left, Right, Smallest: Integer;
  Temporary: Int64;
begin
  Dec(Size);
  if Size = 0 then
    Exit;

  Heap[0] := Heap[Size];
  I := 0;
  while True do
  begin
    Left := 2 * I + 1;
    Right := Left + 1;
    Smallest := I;

    if (Left < Size) and (Heap[Left] < Heap[Smallest]) then
      Smallest := Left;
    if (Right < Size) and (Heap[Right] < Heap[Smallest]) then
      Smallest := Right;
    if Smallest = I then
      Break;

    Temporary := Heap[I];
    Heap[I] := Heap[Smallest];
    Heap[Smallest] := Temporary;
    I := Smallest;
  end;
end;

var
  N, I, Size: Integer;
  Jobs: TJobArray;
  Heap: THeap;
  Total: Int64;
begin
  N := 0;
  Read(N);

  if N <= 0 then
  begin
    WriteLn(0);
  end
  else
  begin
    SetLength(Jobs, N);
    for I := 0 to N - 1 do
    begin
      Jobs[I].Deadline := 0;
      Read(Jobs[I].Deadline);
      Jobs[I].Profit := 0;
      Read(Jobs[I].Profit);
    end;

    MergeSort(Jobs, N);

    SetLength(Heap, N);
    Size := 0;
    for I := 0 to N - 1 do
    begin
      HeapPush(Heap, Size, Jobs[I].Profit);
      if Size > Jobs[I].Deadline then
        HeapPop(Heap, Size);
    end;

    Total := 0;
    for I := 0 to Size - 1 do
      Total := Total + Heap[I];

    WriteLn(Total);
  end;
end.
