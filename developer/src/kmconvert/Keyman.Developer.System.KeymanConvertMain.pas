unit Keyman.Developer.System.KeymanConvertMain;

interface

procedure Run;

implementation

uses
  System.Classes,
  System.SysUtils,
  Winapi.ActiveX,

  Keyman.Developer.System.KMConvertParameters,
  Keyman.Developer.System.ImportWindowsKeyboard,
  Keyman.Developer.System.KeyboardProjectTemplate,
  Keyman.Developer.System.LDMLKeyboardProjectTemplate,
  Keyman.Developer.System.ModelProjectTemplate,
  KeymanVersion,
  VersionInfo;

function DoRun: Boolean; forward;

procedure Run;
begin
  CoInitializeEx(nil, COINIT_APARTMENTTHREADED);
  try
    if DoRun then
      ExitCode := 0
    else
      ExitCode := 1;
  finally
    CoUninitialize;
  end;
end;

function DoImportWindowsKeyboard(FParameters: TKMConvertParameters): Boolean;
var
  iwk: TImportWindowsKeyboard;
  FTargetFolder: string;
  v: Integer;
begin
  if not TryStrToInt('$'+FParameters.KLID, v) then
  begin
    writeln('ERROR: The format of the input parameter -klid '+FParameters.KLID+' is incorrect');
    Exit(False);
  end;

  iwk := TImportWindowsKeyboard.Create;
  try
    iwk.SourceKLID := FParameters.KLID;
    iwk.DestinationPath := FParameters.Destination;
    iwk.KeyboardIDTemplate := FParameters.KeyboardID;
    iwk.NameTemplate := FParameters.Name;
    iwk.Description := FParameters.Description;
    iwk.Copyright := FParameters.Copyright;
    iwk.FullCopyright := FParameters.FullCopyright;
    iwk.Version := FParameters.Version;
    iwk.BCP47Tags := FParameters.BCP47Tags;
    iwk.Author := FParameters.Author;

    FTargetFolder := ExtractFileDir(iwk.ProjectFilename);
    if DirectoryExists(FTargetFolder) then
    begin
      writeln('ERROR: The directory "'+FTargetFolder+'" already exists.');
      Exit(False);
    end;

    Result := iwk.Execute;
  finally
    iwk.Free;
  end;
end;

function DoCreateKeyboardTemplate(FParameters: TKMConvertParameters): Boolean;
var
  kpt: TKeyboardProjectTemplate;
  FTargetFolder: string;
begin
  kpt := TKeyboardProjectTemplate.Create(FParameters.Destination, FParameters.KeyboardID, FParameters.Targets);
  try
    if FParameters.Name = ''
      then kpt.Name := FParameters.KeyboardID
      else kpt.Name := FParameters.Name;
    kpt.Copyright := FParameters.Copyright;
    kpt.FullCopyright := FParameters.FullCopyright;
    kpt.Version := FParameters.Version;
    kpt.BCP47Tags := FParameters.BCP47Tags;
    kpt.Author := FParameters.Author;
    kpt.IncludeIcon := True;

    FTargetFolder := ExtractFileDir(kpt.ProjectFilename);
    if DirectoryExists(FTargetFolder) then
    begin
      writeln('ERROR: The directory "'+FTargetFolder+'" already exists.');
      Exit(False);
    end;

    try
      kpt.Generate;
    except
      on E:EKeyboardProjectTemplate do
      begin
        writeln('ERROR: Unable to create project: '+E.Message);
        Exit(False);
      end;
      on E:EFOpenError do
      begin
        writeln('ERROR: Unable to create project; template files may be missing: '+E.Message);
        Exit(False);
      end;
    end;
    Result := True;
  finally
    kpt.Free;
  end;
end;

function DoCreateLDMLKeyboardTemplate(FParameters: TKMConvertParameters): Boolean;
var
  kpt: TLDMLKeyboardProjectTemplate;
  FTargetFolder: string;
begin
  kpt := TLDMLKeyboardProjectTemplate.Create(FParameters.Destination, FParameters.KeyboardID);
  try
    if FParameters.Name = ''
      then kpt.Name := FParameters.KeyboardID
      else kpt.Name := FParameters.Name;
    kpt.Copyright := FParameters.Copyright;
    kpt.FullCopyright := FParameters.FullCopyright;
    kpt.Version := FParameters.Version;
    kpt.BCP47Tags := FParameters.BCP47Tags;
    kpt.Author := FParameters.Author;

    FTargetFolder := ExtractFileDir(kpt.ProjectFilename);
    if DirectoryExists(FTargetFolder) then
    begin
      writeln('ERROR: The directory "'+FTargetFolder+'" already exists.');
      Exit(False);
    end;

    try
      kpt.Generate;
    except
      on E:ELDMLKeyboardProjectTemplate do
      begin
        writeln('ERROR: Unable to create project: '+E.Message);
        Exit(False);
      end;
      on E:EFOpenError do
      begin
        writeln('ERROR: Unable to create project; template files may be missing: '+E.Message);
        Exit(False);
      end;
    end;
    Result := True;
  finally
    kpt.Free;
  end;
end;

function DoCreateModelTemplate(FParameters: TKMConvertParameters): Boolean;
var
  mpt: TModelProjectTemplate;
  FTargetFolder: string;
  ModelID: string;
begin
  ModelID := FParameters.ModelIdAuthor + '.' + FParameters.ModelIdLanguage + '.' + FParameters.ModelIdUniq;
  mpt := TModelProjectTemplate.Create(FParameters.Destination, ModelID);
  try
    mpt.Name := FParameters.Name;
    mpt.Copyright := FParameters.Copyright;
    mpt.FullCopyright := FParameters.FullCopyright;
    mpt.Version := FParameters.Version;
    mpt.BCP47Tags := FParameters.BCP47Tags;
    mpt.Author := FParameters.Author;

    FTargetFolder := ExtractFileDir(mpt.ProjectFilename);
    if DirectoryExists(FTargetFolder) then
    begin
      writeln('ERROR: The directory "'+FTargetFolder+'" already exists.');
      Exit(False);
    end;

    try
      mpt.Generate;
    except
      on E:EModelProjectTemplate do
      begin
        writeln('ERROR: Unable to create project: '+E.Message);
        Exit(False);
      end;
      on E:EFOpenError do
      begin
        writeln('ERROR: Unable to create project; template files may be missing: '+E.Message);
        Exit(False);
      end;
    end;
    Result := True;
  finally
    mpt.Free;
  end;
end;

function DoConvertProject(FParameters: TKMConvertParameters; const ToFormat: string): Boolean;
var
  cmd: string;
  cmdOutput: string;
  exitCode: Integer;
begin
  // Build kmc command
  cmd := '"' + ExtractFilePath(ParamStr(0)) + '..\..\..\node_modules\.bin\kmc.cmd" convert project';
  cmd := cmd + ' "' + FParameters.SourceProject + '"';
  cmd := cmd + ' --format ' + ToFormat;
  cmd := cmd + ' --output "' + FParameters.Destination + '"';

  if FParameters.SourceKmn <> '' then
    cmd := cmd + ' --source-kmn "' + FParameters.SourceKmn + '"';

  writeln('Executing: kmc convert project');
  writeln('Source: ' + FParameters.SourceProject);
  writeln('Destination: ' + FParameters.Destination);
  writeln('Format: ' + ToFormat);
  writeln;

  // Execute kmc and capture output
  Result := ExecuteCommandLine(cmd, cmdOutput, exitCode);

  if Result and (exitCode = 0) then
  begin
    writeln(cmdOutput);
    writeln;
    writeln('Conversion completed successfully.');
    Result := True;
  end
  else
  begin
    writeln('ERROR: Conversion failed');
    writeln(cmdOutput);
    Result := False;
  end;
end;

function ExecuteCommandLine(const CommandLine: string; var Output: string; var ExitCode: Integer): Boolean;
var
  StartupInfo: TStartupInfo;
  ProcessInfo: TProcessInformation;
  SecurityAttr: TSecurityAttributes;
  PipeRead, PipeWrite: THandle;
  Buffer: array[0..255] of AnsiChar;
  BytesRead: DWORD;
  Success: Boolean;
begin
  Result := False;
  Output := '';
  ExitCode := -1;

  // Set up security attributes for pipe
  SecurityAttr.nLength := SizeOf(TSecurityAttributes);
  SecurityAttr.bInheritHandle := True;
  SecurityAttr.lpSecurityDescriptor := nil;

  // Create pipe for stdout
  if not CreatePipe(PipeRead, PipeWrite, @SecurityAttr, 0) then
    Exit;

  try
    // Set up startup info
    FillChar(StartupInfo, SizeOf(TStartupInfo), 0);
    StartupInfo.cb := SizeOf(TStartupInfo);
    StartupInfo.dwFlags := STARTF_USESHOWWINDOW or STARTF_USESTDHANDLES;
    StartupInfo.wShowWindow := SW_HIDE;
    StartupInfo.hStdOutput := PipeWrite;
    StartupInfo.hStdError := PipeWrite;

    // Create process
    Success := CreateProcess(
      nil,
      PChar(CommandLine),
      nil,
      nil,
      True,
      CREATE_NO_WINDOW,
      nil,
      nil,
      StartupInfo,
      ProcessInfo
    );

    if not Success then
      Exit;

    try
      CloseHandle(PipeWrite);
      PipeWrite := 0;

      // Read output
      repeat
        Success := ReadFile(PipeRead, Buffer, SizeOf(Buffer), BytesRead, nil);
        if BytesRead > 0 then
          Output := Output + Copy(string(Buffer), 1, BytesRead);
      until not Success or (BytesRead = 0);

      // Wait for process to complete
      WaitForSingleObject(ProcessInfo.hProcess, INFINITE);

      // Get exit code
      GetExitCodeProcess(ProcessInfo.hProcess, DWORD(ExitCode));

      Result := True;
    finally
      CloseHandle(ProcessInfo.hProcess);
      CloseHandle(ProcessInfo.hThread);
    end;
  finally
    if PipeWrite <> 0 then
      CloseHandle(PipeWrite);
    CloseHandle(PipeRead);
  end;
end;

procedure WriteBanner;
begin
  writeln(SKeymanDeveloperName + ' Conversion Utility');
  writeln('Version ' + CKeymanVersionInfo.VersionWithTag + ', ' + GetVersionCopyright);
  writeln;
end;

function CmdLineToArray: TArray<string>;
var
  i: Integer;
begin
  SetLength(Result, ParamCount);
  for i := 1 to ParamCount do
    Result[i-1] := ParamStr(i);
end;

function DoRun: Boolean;
var
  FParameters: TKMConvertParameters;
begin
  Result := False;

  // convert transforms keyboards from one format to another
  // and also generates template projects, etc.

  if not FParameters.CheckParams(CmdLineToArray) then
  begin
    if FParameters.EmitUsage then
    begin
      WriteBanner;
      FParameters.WriteUsage;
    end;
    Exit;
  end;

  if not FParameters.NoLogo then
    WriteBanner;

  case FParameters.Mode of
    cmImportWindows:
      Result := DoImportWindowsKeyboard(FParameters);
    cmTemplate:
      Result := DoCreateKeyboardTemplate(FParameters);
    cmLdmlKeyboard:
      Result := DoCreateLDMLKeyboardTemplate(FParameters);
    cmLexicalModel:
      Result := DoCreateModelTemplate(FParameters);
    cmConvertKmnToLdml:
      Result := DoConvertProject(FParameters, 'ldml');
    cmConvertLdmlToKmn:
      Result := DoConvertProject(FParameters, 'kmn');
  end;
end;

end.
