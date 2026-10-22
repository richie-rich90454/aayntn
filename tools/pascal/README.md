# The Pascal runner

The Pascal listings in this repository are real Free Pascal programs. They are compiled and run by the same validation that compiles the C, C++, Java, Python and JavaScript listings, and they are required to produce the same output.

## How it runs without anything being installed

The Free Pascal compiler is published on npm as a WebAssembly module:

```sh
pnpm add -D @live-codes/pascal-wasm
```

The module is the `pas2js` compiler, which is the Free Pascal team's own Pascal-to-JavaScript translator, compiled to WebAssembly. The whole toolchain therefore lives inside `node_modules`, and no compiler is installed on the machine.

The compiler needs one Node flag, for the WebAssembly exception-handling instructions it uses, and that flag cannot be set through the environment. The runner therefore does its work in a child process that carries it:

```sh
node --experimental-wasm-exnref --no-warnings tools/pascal/worker.mjs jobs.json
```

## The console unit

The browser build of the compiler cannot read from the console, because a browser console has no input. `aayntnconsole.pas` supplies the missing half: it reads the standard input that the host installs and parses the whitespace-separated tokens that a contest program expects.

The unit is injected for the run only. **A published listing is an ordinary Free Pascal program that reads from the standard input**, and it compiles and runs unchanged under a normal Free Pascal installation. The runner rewrites two things for the run: it adds the unit to the program's uses clause, and it replaces the calls to `Halt`, which the browser build does not provide.

## What a listing may use

A listing that is to be verifiable here reads its input with the ordinary console calls and nothing else.

**Do use**

- `Read(V)` for the next integer, which skips whitespace.
- `ReadLn(V)` for the next integer when the input is one value per line.
- `ReadLn(S)` for the rest of a line as a string.
- `Int64` for anything that can exceed the range of a 32-bit integer.
- Dynamic arrays, records and two-dimensional arrays.

**Do not use**

- `Text` files, `AssignFile`, `Reset`, `BlockRead` and `CONIN$`: the browser build of the compiler has no text files at all.
- `EOF(Input)`: the same reason. Read the exact number of values that the input contract specifies, which is what the other five languages do.
- A program name that is also the name of one of its own functions: Pascal puts the program in the global scope, so the two collide.

## The shape of a listing

```pascal
program iterative;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TIntArray = array of Integer;
  TAdjList = array of TIntArray;

function DfsIterative(const Adj: TAdjList; Source: Integer): TIntArray;
var
  Visited: array of Boolean;
  Stack: TIntArray;
  Order: TIntArray;
  Top: Integer;
  Count: Integer;
  I: Integer;
  V: Integer;
  W: Integer;
begin
  SetLength(Visited, Length(Adj));
  for I := 0 to High(Visited) do
    Visited[I] := False;
  SetLength(Order, Length(Adj));
  Count := 0;

  if (Source < 0) or (Source >= Length(Adj)) then
  begin
    Result := Copy(Order, 0, 0);
    Exit;
  end;

  SetLength(Stack, 1 + TotalDegree(Adj));
  Top := 1;
  Stack[0] := Source;

  while Top > 0 do
  begin
    Dec(Top);
    V := Stack[Top];
    if Visited[V] then
      Continue;
    Visited[V] := True;
    Order[Count] := V;
    Inc(Count);
    for I := 0 to High(Adj[V]) do
    begin
      W := Adj[V][I];
      if not Visited[W] then
      begin
        Stack[Top] := W;
        Inc(Top);
      end;
    end;
  end;

  Result := Copy(Order, 0, Count);
end;

var
  N: Integer;
  M: Integer;
  Source: Integer;
  I: Integer;
  U: Integer;
  V: Integer;
  Adj: TAdjList;
  Order: TIntArray;
  Reachable: array of Boolean;
  Row: string;
begin
  { The input is exactly the contract: n, m, the m edges and the source. }
  Read(N);
  Read(M);

  if N <= 0 then
  begin
    WriteLn('0');
    WriteLn('');
    Exit;
  end;

  SetLength(Adj, N);
  for I := 0 to N - 1 do
    SetLength(Adj[I], 0);

  for I := 0 to M - 1 do
  begin
    Read(U);
    Read(V);
    if (U < 0) or (U >= N) or (V < 0) or (V >= N) then
      Continue;
    SetLength(Adj[U], Length(Adj[U]) + 1);
    Adj[U][High(Adj[U])] := V;
    SetLength(Adj[V], Length(Adj[V]) + 1);
    Adj[V][High(Adj[V])] := U;
  end;

  Read(Source);

  Order := DfsIterative(Adj, Source);
  SetLength(Reachable, N);
  for I := 0 to N - 1 do
    Reachable[I] := False;
  for I := 0 to High(Order) do
    Reachable[Order[I]] := True;

  WriteLn(Length(Order));
  Row := '';
  for I := 0 to N - 1 do
    if Reachable[I] then
    begin
      if Row <> '' then
        Row := Row + ' ';
      Row := Row + IntToStr(I);
    end;
  WriteLn(Row);
end.
```

## Running the batch by hand

```sh
node --experimental-wasm-exnref --no-warnings tools/pascal/worker.mjs jobs.json
```

where `jobs.json` is

```json
{
    "jobs": [
        {
            "path": "implementations/graphs/dfs/pascal/iterative.pas",
            "input": "5 4\n0 1\n1 2\n2 3\n3 4\n0\n"
        }
    ]
}
```

The worker writes `{"results": [...]}` to the standard output, with the output and the error of each job.
