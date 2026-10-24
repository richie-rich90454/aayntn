program TwoDimDifference;
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

const
  MaxSide = 2002;

type
  TGrid = array[0..MaxSide - 1, 0..MaxSide - 1] of Int64;

var
  diff: TGrid;
  rows, cols, queries, i, j: Integer;
  r1, c1, r2, c2: Integer;
  value, current, previous: Int64;

begin
  Read(rows);
  Read(cols);

  for i := 1 to rows do
    for j := 1 to cols do
      Read(diff[i, j]);

  for i := 1 to rows do
  begin
    previous := 0;
    for j := 1 to cols do
    begin
      current := diff[i, j];
      diff[i, j] := current - previous;
      previous := current;
    end;
  end;

  for j := 1 to cols do
    for i := rows downto 2 do
      diff[i, j] := diff[i, j] - diff[i - 1, j];

  Read(queries);

  for i := 1 to queries do
  begin
    Read(r1);
    Read(c1);
    Read(r2);
    Read(c2);
    Read(value);
    diff[r1, c1] := diff[r1, c1] + value;
    diff[r2 + 1, c1] := diff[r2 + 1, c1] - value;
    diff[r1, c2 + 1] := diff[r1, c2 + 1] - value;
    diff[r2 + 1, c2 + 1] := diff[r2 + 1, c2 + 1] + value;
  end;

  for i := 1 to rows do
    for j := 1 to cols do
      diff[i, j] := diff[i, j] + diff[i - 1, j] + diff[i, j - 1] - diff[i - 1, j - 1];

  for i := 1 to rows do
  begin
    for j := 1 to cols do
    begin
      if j > 1 then
        Write(' ');
      Write(diff[i, j]);
    end;
    WriteLn;
  end;
end.
