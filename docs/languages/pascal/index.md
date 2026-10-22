---
id: languages.pascal
title: The Pascal center
summary: An educational reference for Pascal written against Free Pascal, covering arrays, dynamic arrays, records, procedures, sorting, input and output, and the recursion behavior of the compiler.
division: []
subjects: [foundations]
level: intermediate
importance: extended-reference
keywords: [Pascal, Free Pascal, objfpc, dynamic arrays, records, sorting]
prerequisites:
    required: []
    recommended: [start.computational-foundations, start.data-structures, start.language-transition]
reviewed: false
draft: false
---

<Synonyms terms="Pascal, Free Pascal, Object Pascal, FPC, objfpc mode" />

**Pascal is an educational reference only. It is not a USACO submission language.** The published USACO contest instructions state plainly that Pascal support has been discontinued, and no Pascal program can be submitted today. Nothing in this center is a submission solution, and nothing in it should be described to a judge as one.

Pascal is here because it is the language many people meet first, in older textbooks and in problem sets written before the modern contest ecosystem. It is also a good language in which to see the shape of an algorithm without a container library getting in the way.

## The testing baseline

Every Pascal program in this encyclopedia is written for **Free Pascal 3.x** and is compiled in the `program` mode with the two directives that the house style requires.

```pascal
program Example;
{$mode objfpc}{$H+}

uses SysUtils;

begin
  WriteLn('hello');
end.
```

**`{$mode objfpc}`** selects the Object Pascal dialect that Free Pascal itself extends, which is a superset of Delphi's Object Pascal. It is what makes `string` a managed type, what enables `for..in` loops over containers, and what allows a function to assign to `Result`.

**`{$H+}`** selects the `ansistring` type for `string`, the long string whose length is limited only by memory. Without it, `string` is a `ShortString` of at most 255 characters, and the two types behave differently enough that a program written for one does not always compile for the other.

Both directives must appear in the program header, before the `uses` clause, and both are written explicitly so that the behavior of a program does not depend on the compiler's default mode.

The `uses SysUtils` clause brings in the conversion helpers that a contest program needs: `StrToInt`, `StrToIntDef`, `StrToInt64Def`, `IntToStr`, `Format` and `Exception`. A program that uses only `ReadLn` and `WriteLn` does not need it.

## Array indexing

A static array has a fixed range of indices, and the range is part of the type. The declaration `array[0..n - 1] of T` is the natural choice for a program that treats the array like a C array, because the first element is at index zero.

```pascal
program Arrays;
{$mode objfpc}{$H+}

var
  Values: array[0..4] of Integer;
  I: Integer;
begin
  for I := 0 to High(Values) do
    Values[I] := I * I;

  for I := 0 to High(Values) do
    WriteLn(Values[I]);
end.
```

`Low` and `High` give the first and the last index of the range, and `Length` gives the number of elements, which is `High - Low + 1`. Using `High` rather than a literal bound means the loop keeps working when the declaration changes.

A range that does not start at zero is legal, and every index must be inside it. An array declared `array[1..n]` is indexed from one, and a program that treats it as if it started at zero reads a different element on every access. This is the most common Pascal bug, and it is silent.

The `{$R+}` switch turns on range checking, so an out-of-range access raises runtime error 201 instead of reading whatever happens to be next in memory. It costs a comparison per access, and it is worth enabling while you are writing the program.

## Dynamic arrays

A dynamic array has a length that is decided at run time. It is declared with the open array syntax `array of T`, and its length is changed with `SetLength`.

```pascal
program Dynamic;
{$mode objfpc}{$H+}

var
  Values: array of Int64;
  I: Integer;
  Total: Int64;
begin
  SetLength(Values, 5);
  for I := 0 to High(Values) do
    Values[I] := I * I;

  Total := 0;
  for I := 0 to High(Values) do
    Total := Total + Values[I];

  WriteLn(Total);
end.
```

`SetLength` may copy the whole array to a new block, so calling it inside a loop is quadratic. The pattern that a growing array needs is to keep the capacity and the number of elements apart, and to double the capacity when the two meet, which makes the sequence of appends amortised $O(1)$.

```pascal
program Growing;
{$mode objfpc}{$H+}

type
  TInt64Vector = record
    Items: array of Int64;
    Count: Integer;
  end;

{ Grows the vector by doubling when it is full, so a sequence of pushes
  is amortised O(1). }
procedure Push(var V: TInt64Vector; Value: Int64);
var
  Capacity: Integer;
begin
  if V.Count = Length(V.Items) then
  begin
    if Length(V.Items) = 0 then
      Capacity := 8
    else
      Capacity := Length(V.Items) * 2;
    SetLength(V.Items, Capacity);
  end;
  V.Items[V.Count] := Value;
  Inc(V.Count);
end;

var
  V: TInt64Vector;
  I: Integer;
begin
  for I := 1 to 5 do
    Push(V, I * I);
  for I := 0 to V.Count - 1 do
    WriteLn(V.Items[I]);
end.
```

Two properties of dynamic arrays surprise people coming from C.

First, **assigning a dynamic array shares the same memory**. The array is a reference-counted managed type, so `B := A` makes `B` and `A` two names for one block, and writing to `B` writes to `A`. Use `Copy(A)` when an independent copy is wanted.

Second, **a dynamic array is released by the garbage collector**, so there is no `free` to call and no leak to hunt. That is the one thing Pascal is genuinely better than C at.

## Records

A record groups fields into a single type, and it is Pascal's answer to the C struct. The syntax is the same in every dialect, and it is the part of Pascal that has aged best.

```pascal
program Records;
{$mode objfpc}{$H+}

type
  TWeightedEdge = record
    Vertex: Integer;
    Weight: Int64;
  end;

var
  Edge: TWeightedEdge;
begin
  Edge.Vertex := 3;
  Edge.Weight := 17;
  WriteLn(Edge.Vertex, ' ', Edge.Weight);
end.
```

The `with` statement opens a record so that its fields can be named without the prefix. It is convenient and it is easy to misread, because a field name inside a `with` block shadows an outer variable of the same name.

```pascal
with Edge do
begin
  Vertex := 3;
  Weight := 17;
end;
```

## Procedures and functions

A procedure is a sequence of statements with parameters. A function is a procedure that returns a value, and in Object Pascal the value is assigned to the reserved variable `Result` before the function returns.

```pascal
program Procedures;
{$mode objfpc}{$H+}

type
  TIntVector = record
    Items: array of Integer;
    Count: Integer;
  end;

{ Passes the vector by reference, so the procedure can change it. }
procedure Push(var V: TIntVector; Value: Integer);
var
  Capacity: Integer;
begin
  if V.Count = Length(V.Items) then
  begin
    if Length(V.Items) = 0 then
      Capacity := 8
    else
      Capacity := Length(V.Items) * 2;
    SetLength(V.Items, Capacity);
  end;
  V.Items[V.Count] := Value;
  Inc(V.Count);
end;

{ Passes the vector by reference and removes the top element. }
function Pop(var V: TIntVector): Integer;
begin
  if V.Count = 0 then
  begin
    Result := 0;
    Exit;
  end;
  Dec(V.Count);
  Result := V.Items[V.Count];
end;

var
  V: TIntVector;
  Value: Integer;
begin
  Push(V, 1);
  Push(V, 2);
  Value := Pop(V);
  WriteLn(Value, ' ', V.Count);
end.
```

The three parameter modes are worth distinguishing.

`var` passes the variable itself, so the procedure can change it. This is what an output parameter or a modified container needs.

`const` passes the value, and the compiler guarantees that the callee does not modify it. A large `const` parameter of a record type is passed by reference, so it costs nothing to pass a big record as `const`.

`out` passes the variable itself and requires the callee to assign it before returning, which makes the direction of the data flow explicit.

## Sorting

Free Pascal's standard units have no ready-made sort for a numeric array, so a contest program writes one. Two implementations cover almost every need.

### Quicksort

```pascal
program QuickSort;
{$mode objfpc}{$H+}

type
  TInt64Array = array of Int64;

procedure Sort(var A: TInt64Array; Lo, Hi: Integer);
var
  I, J: Integer;
  Pivot, Temp: Int64;
begin
  if Lo >= Hi then
    Exit;
  I := Lo;
  J := Hi;
  Pivot := A[(Lo + Hi) div 2];
  while I <= J do
  begin
    while A[I] < Pivot do
      Inc(I);
    while A[J] > Pivot do
      Dec(J);
    if I <= J then
    begin
      Temp := A[I];
      A[I] := A[J];
      A[J] := Temp;
      Inc(I);
      Dec(J);
    end;
  end;
  if Lo < J then
    Sort(A, Lo, J);
  if I < Hi then
    Sort(A, I, Hi);
end;

var
  Values: TInt64Array;
  I: Integer;
begin
  SetLength(Values, 5);
  Values[0] := 5;
  Values[1] := 2;
  Values[2] := 9;
  Values[3] := 2;
  Values[4] := 7;
  Sort(Values, 0, High(Values));
  for I := 0 to High(Values) do
    Write(Values[I], ' ');
  WriteLn;
end.
```

The pivot is the middle element, so a sorted input is split in the middle, and the recursion depth is $O(\log n)$ even on the worst ordering. The average running time is $O(n \log n)$.

### Mergesort

Mergesort is stable and its running time is $O(n \log n)$ in every case, at the cost of an auxiliary array the size of the input.

```pascal
program MergeSort;
{$mode objfpc}{$H+}

type
  TInt64Array = array of Int64;

procedure Sort(var A: TInt64Array; var Buffer: TInt64Array; Lo, Hi: Integer);
var
  Mid, I, J, K: Integer;
begin
  if Lo >= Hi then
    Exit;
  Mid := (Lo + Hi) div 2;
  Sort(A, Buffer, Lo, Mid);
  Sort(A, Buffer, Mid + 1, Hi);
  I := Lo;
  J := Mid + 1;
  K := Lo;
  while (I <= Mid) and (J <= Hi) do
  begin
    if A[I] <= A[J] then
    begin
      Buffer[K] := A[I];
      Inc(I);
    end
    else
    begin
      Buffer[K] := A[J];
      Inc(J);
    end;
    Inc(K);
  end;
  while I <= Mid do
  begin
    Buffer[K] := A[I];
    Inc(I);
    Inc(K);
  end;
  while J <= Hi do
  begin
    Buffer[K] := A[J];
    Inc(J);
    Inc(K);
  end;
  for I := Lo to Hi do
    A[I] := Buffer[I];
end;

var
  Values, Buffer: TInt64Array;
  I: Integer;
begin
  SetLength(Values, 5);
  Values[0] := 5;
  Values[1] := 2;
  Values[2] := 9;
  Values[3] := 2;
  Values[4] := 7;
  SetLength(Buffer, Length(Values));
  Sort(Values, Buffer, 0, High(Values));
  for I := 0 to High(Values) do
    Write(Values[I], ' ');
  WriteLn;
end.
```

`TStringList` in the `Classes` unit has a `Sort` method, and it is the right tool when the elements are strings, because it keeps the list sorted as it changes.

## Input and output

The standard procedures read from and write to the standard input and output.

`ReadLn(X)` reads the next number from the current line and moves to the next one. `Read(X)` reads the next number without skipping to the next line, which is what a program that reads two numbers from one line wants. `WriteLn(X)` writes a value and a line break. `Write(X)` writes a value without one.

```pascal
program BasicIO;
{$mode objfpc}{$H+}

uses SysUtils;

var
  N, I, Value: Integer;
  Total: Int64;
begin
  if not TryReadln(N) then
    Halt(0);

  Total := 0;
  for I := 1 to N do
  begin
    ReadLn(Value);
    Total := Total + Value;
  end;

  WriteLn(Total);
end.
```

`ReadLn` raises runtime error 106 when the input does not hold a number where one is expected, which is a useful failure: it means the input is not shaped the way the program assumed. `TryReadLn` and `TryRead` return a boolean instead of raising, and they are the right choice at the top of a program, where the input might be empty.

Reading a file is four calls.

```pascal
program FileIO;
{$mode objfpc}{$H+}

var
  Handle: Text;
  Line: string;
begin
  Assign(Handle, 'cow.in');
  Reset(Handle);
  while not EOF(Handle) do
  begin
    ReadLn(Handle, Line);
    WriteLn(Line);
  end;
  Close(Handle);
end.
```

`Assign` names the file, `Reset` opens it for reading and `Rewrite` opens it for writing, and `Close` releases the handle. The published USACO instructions describe this convention for the problems that used file input before December 2020, and note that the file name is case sensitive and that a path must not be given.

A contest program usually prefers to read the whole of standard input and split it into tokens, because a token-based reader does not depend on where the line breaks fall. That is the pattern used by the templates below.

## Recursion in Pascal

A recursive procedure in Pascal pushes a frame onto the stack, exactly as in C, and the limit is a byte budget rather than a count of calls. The budget is controlled by the compiler's `-Cs` option, and exhausting it raises **runtime error 202**, a stack overflow. The number of levels you can reach therefore depends on how large each frame is, and a procedure with a large local array uses the budget far faster than one with only a few scalars.

**A chain-shaped graph gives recursion depth proportional to the number of vertices**, so an $O(V + E)$ recursive depth-first search over a long path will exhaust the stack even though its running time is linear. The time bound and the stack depth are separate resources, and a program has to bound both.

The recommendation for Pascal is: **use an explicit stack for any traversal whose depth is not provably small.** A recursive quicksort is safe, because its depth is $O(\log n)$. A recursive depth-first search over an arbitrary graph is not.

The explicit version is the same shape as in every other language in this encyclopedia.

```pascal
program IterativeDFS;
{$mode objfpc}{$H+}

type
  TIntArray = array of Integer;
  TAdjList = array of TIntArray;

{ The stack replaces the call stack, so a chain of any length is
  traversed without recursion. }
function ReachableCount(const Adj: TAdjList; Source: Integer): Integer;
var
  Visited: array of Boolean;
  Stack: TIntArray;
  Top, Count, I, W: Integer;
begin
  Count := 0;
  if (Source < 0) or (Source >= Length(Adj)) then
  begin
    Result := 0;
    Exit;
  end;

  SetLength(Visited, Length(Adj));
  for I := 0 to High(Visited) do
    Visited[I] := False;
  SetLength(Stack, Length(Adj));
  Top := 0;
  Stack[Top] := Source;
  Inc(Top);
  Visited[Source] := True;
  Count := 1;

  while Top > 0 do
  begin
    Dec(Top);
    I := Stack[Top];
    for W := 0 to High(Adj[I]) do
    begin
      if not Visited[Adj[I][W]] then
      begin
        Visited[Adj[I][W]] := True;
        Inc(Count);
        Stack[Top] := Adj[I][W];
        Inc(Top);
      end;
    end;
  end;

  Result := Count;
end;

var
  Adj: TAdjList;
begin
  SetLength(Adj, 2);
  SetLength(Adj[0], 1);
  Adj[0][0] := 1;
  SetLength(Adj[1], 1);
  Adj[1][0] := 0;
  WriteLn(ReachableCount(Adj, 0));
end.
```

The stack in that program is sized at the number of vertices, and a vertex is marked as visited at the moment it is pushed, so no vertex is ever pushed twice. The variant that marks a vertex when it is popped holds $O(E)$ entries instead, and needs a stack that grows.

## Debugging advice

Free Pascal has more runtime checking than most languages, and the switches are off by default, which means a program that works on your machine may be reading out of bounds without telling you.

Turn them on while you develop. `{$R+}` turns on range checking, so an array access outside the declared range raises runtime error 201 instead of reading a neighboring variable. `{$Q+}` turns on overflow checking, so an integer computation that overflows raises runtime error 215 instead of wrapping around silently. `{$I+}` turns on input and output checking, so a `ReadLn` that fails reports the problem instead of continuing with a stale value.

`Assert` checks an invariant that should hold by construction, and it costs nothing in a release build when it is disabled.

The most common Pascal bug in a contest program is an off-by-one in the index range of a static array, and the second most common is a `SetLength` that is called inside a loop, which copies the array every time and turns a linear program into a quadratic one. The third is a `with` block whose field name shadows an outer variable.

Read the runtime error number. 201 is a range error and names the offending access, 202 is a stack overflow and means the recursion went too deep, 203 is a heap overflow, 106 is an invalid numeric format and means the input did not match what the program expected, and 215 is an arithmetic overflow.

## Template library

**A general program.** Read the input as tokens, so that the program does not depend on where the line breaks fall.

```pascal
program GeneralProgram;
{$mode objfpc}{$H+}

uses SysUtils;

type
  TTokens = array of string;

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

var
  Tokens: TTokens;
  N, I: Integer;
  Total: Int64;
  Value: Int64;
begin
  Tokens := Tokenize(ReadAllInput);
  if Length(Tokens) < 1 then
    Halt(0);

  N := StrToIntDef(Tokens[0], 0);
  Total := 0;
  for I := 1 to N do
  begin
    if I >= Length(Tokens) then
      Break;
    Value := StrToInt64Def(Tokens[I], 0);
    Total := Total + Value;
  end;

  WriteLn(Total);
end.
```

**Graph input.** Read `n m`, then `m` edges, then a start vertex, into an adjacency list of dynamic arrays.

```pascal
program GraphProgram;
{$mode objfpc}{$H+}

uses SysUtils;

type
  TIntArray = array of Integer;
  TAdjList = array of TIntArray;
  TTokens = array of string;

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
  I, Start: Integer;
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

{ Appends an undirected edge to the adjacency list. }
procedure AddEdge(var Adj: TAdjList; U, V: Integer);
begin
  SetLength(Adj[U], Length(Adj[U]) + 1);
  Adj[U][High(Adj[U])] := V;
  SetLength(Adj[V], Length(Adj[V]) + 1);
  Adj[V][High(Adj[V])] := U;
end;

var
  Tokens: TTokens;
  N, M, I, U, V, Source, Index: Integer;
  Adj: TAdjList;
begin
  Tokens := Tokenize(ReadAllInput);
  if Length(Tokens) < 2 then
    Halt(0);

  N := StrToIntDef(Tokens[0], 0);
  M := StrToIntDef(Tokens[1], 0);
  if N <= 0 then
  begin
    WriteLn(0);
    Halt(0);
  end;

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
    AddEdge(Adj, U, V);
  end;

  Source := -1;
  if Index < Length(Tokens) then
    Source := StrToIntDef(Tokens[Index], -1);

  { Solve the problem here, using Adj and Source. }
end.
```

**A binary min-heap of (distance, vertex) pairs,** written by hand, because Free Pascal has no priority queue in its standard units.

```pascal
program HeapProgram;
{$mode objfpc}{$H+}

type
  THeapEntry = record
    Distance: Int64;
    Vertex: Integer;
  end;
  TMinHeap = array of THeapEntry;

{ Adds an entry, growing the heap when it is full. }
procedure HeapPush(var Heap: TMinHeap; Distance: Int64; Vertex: Integer);
var
  Index, Parent: Integer;
  Temp: THeapEntry;
begin
  SetLength(Heap, Length(Heap) + 1);
  Index := High(Heap);
  Heap[Index].Distance := Distance;
  Heap[Index].Vertex := Vertex;
  while Index > 0 do
  begin
    Parent := (Index - 1) div 2;
    if Heap[Parent].Distance <= Heap[Index].Distance then
      Break;
    Temp := Heap[Parent];
    Heap[Parent] := Heap[Index];
    Heap[Index] := Temp;
    Index := Parent;
  end;
end;

{ Removes the smallest entry and reports it through Entry. }
function HeapPopMin(var Heap: TMinHeap; var Entry: THeapEntry): Boolean;
var
  Index, Child: Integer;
  Temp: THeapEntry;
begin
  Result := Length(Heap) > 0;
  if not Result then
    Exit;
  Entry := Heap[0];
  SetLength(Heap, Length(Heap) - 1);
  if Length(Heap) = 0 then
    Exit;
  Heap[0] := Heap[High(Heap)];
  Index := 0;
  while True do
  begin
    Child := 2 * Index + 1;
    if Child > High(Heap) then
      Break;
    if (Child < High(Heap)) and (Heap[Child + 1].Distance < Heap[Child].Distance) then
      Inc(Child);
    if Heap[Index].Distance <= Heap[Child].Distance then
      Break;
    Temp := Heap[Index];
    Heap[Index] := Heap[Child];
    Heap[Child] := Temp;
    Index := Child;
  end;
end;

var
  Heap: TMinHeap;
  Entry: THeapEntry;
begin
  SetLength(Heap, 0);
  HeapPush(Heap, 40, 0);
  HeapPush(Heap, 10, 1);
  HeapPush(Heap, 30, 2);
  while HeapPopMin(Heap, Entry) do
    WriteLn(Entry.Distance);
end.
```

## What to remember

Pascal is a reference, not a submission language, and the difference matters when you read a solution in it or write one to check an idea.

The three things worth taking away are these. `{$mode objfpc}{$H+}` is the header every program here starts with, and it is what makes `string` a long string. The index range of a static array is part of its type, and `{$R+}` turns an out-of-range access into an error instead of a silent wrong answer. And the recursion limit is a byte budget that raises runtime error 202 when it runs out, so the depth of a traversal has to be bounded with an explicit stack.
