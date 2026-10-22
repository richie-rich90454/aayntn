{ The console unit used by the pas2js runner.

  The Free Pascal compiler that ships as a WebAssembly module cannot read
  from the console, because a browser console has no input. This unit
  supplies the missing half: it reads the standard input, which the host
  installs as a single string, and parses the whitespace-separated tokens
  that a contest program expects.

  The unit is only injected for the pas2js run. The published listings are
  ordinary Free Pascal programs that read from the standard input, and they
  compile and run unchanged under a normal Free Pascal installation.
}
unit aayntnconsole;

{$mode objfpc}{$H+}

interface

uses
  SysUtils;

procedure Read(var V: Integer);
procedure Read(var V: Int64);
procedure ReadLn(var V: Integer);
procedure ReadLn(var V: Int64);
procedure ReadLn(var S: string);

{ The stand-in for Halt, which the browser build of the compiler does not
  provide. The runner rewrites every call to it when it prepares a run. }
procedure AayntnHalt(Code: Integer);

implementation

{ The host installs the whole of the standard input as one string. }
function aayntnInput: string; external name 'aayntnInput';

var
  Buffer: string;
  Position: Integer;
  Ready: Boolean;

procedure EnsureBuffer;
begin
  if not Ready then
  begin
    Buffer := aayntnInput;
    Position := 1;
    Ready := True;
  end;
end;

{ Moves to the next character that is not a space. Returns False at the end
  of the input. }
function SkipSpaces: Boolean;
var
  C: Char;
begin
  EnsureBuffer;
  while Position <= Length(Buffer) do
  begin
    C := Buffer[Position];
    if C > ' ' then Exit(True);
    Inc(Position);
  end;
  Result := False;
end;

{ Reads an optionally signed decimal integer. When the input is exhausted the
  value is left unchanged, which is what Free Pascal does when the input
  checking is switched off. }
procedure ReadInt64(var V: Int64);
var
  Negative: Boolean;
  C: Char;
  Accumulated: Int64;
begin
  if not SkipSpaces then Exit;
  Negative := False;
  if Buffer[Position] = '-' then
  begin
    Negative := True;
    Inc(Position);
  end;
  Accumulated := 0;
  while Position <= Length(Buffer) do
  begin
    C := Buffer[Position];
    if (C < '0') or (C > '9') then Break;
    Accumulated := Accumulated * 10 + (Ord(C) - Ord('0'));
    Inc(Position);
  end;
  if Negative then Accumulated := -Accumulated;
  V := Accumulated;
end;

procedure Read(var V: Integer);
var
  Big: Int64;
begin
  ReadInt64(Big);
  V := Integer(Big);
end;

procedure Read(var V: Int64);
begin
  ReadInt64(V);
end;

{ Consumes the rest of the current line. }
procedure SkipLine;
begin
  EnsureBuffer;
  while Position <= Length(Buffer) do
  begin
    if Buffer[Position] = #10 then
    begin
      Inc(Position);
      Exit;
    end;
    Inc(Position);
  end;
end;

procedure ReadLn(var V: Integer);
begin
  Read(V);
  SkipLine;
end;

procedure ReadLn(var V: Int64);
begin
  Read(V);
  SkipLine;
end;

{ Reads the rest of the current line as a string. }
procedure ReadLn(var S: string);
var
  Start: Integer;
begin
  EnsureBuffer;
  Start := Position;
  while Position <= Length(Buffer) do
  begin
    if Buffer[Position] = #10 then Break;
    Inc(Position);
  end;
  S := Copy(Buffer, Start, Position - Start);
  SkipLine;
end;

procedure AayntnHalt(Code: Integer);
begin
  { The host reads the code out of the message. }
  raise Exception.Create('halt ' + IntToStr(Code));
end;

end.
