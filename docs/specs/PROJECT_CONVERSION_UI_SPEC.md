# KM Developer UI Integration: Project Conversion

**Status:** Implementation Specification
**Target:** Keyman Developer (Tike) New Project Dialog
**Dependencies:** kmc convert project command

---

## Overview

Add project conversion functionality to the Keyman Developer "New Project" dialog, allowing users to convert existing keyboard projects between KMN and LDML formats through a graphical interface.

---

## UI Location

**Dialog:** New Project (UfrmNewProject.pas or equivalent)
**Section:** Below "Clone Local Project"
**New Options:**
- ☐ Convert KMN-based project to LDML
- ☐ Convert LDML-based project to KMN *(grayed out/disabled with tooltip: "Coming soon")*

---

## Conversion Dialog Flow

### 1. Initial Selection

When user selects "Convert KMN-based project to LDML":

```
┌─────────────────────────────────────────────────────────────┐
│ Convert Keyboard Project                            [?] [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Source Project:                                             │
│ ┌─────────────────────────────────────────────┐  [Browse]  │
│ │ C:\Projects\my_keyboard\my_keyboard.kpj     │             │
│ └─────────────────────────────────────────────┘             │
│                                                             │
│ Destination Folder:                                         │
│ ┌─────────────────────────────────────────────┐  [Browse]  │
│ │ C:\Projects\my_keyboard_ldml\               │             │
│ └─────────────────────────────────────────────┘             │
│                                                             │
│ ☑ Copy resource files (fonts, images, documentation)       │
│ ☑ Update package file (.kps)                               │
│                                                             │
│                          [Convert]  [Cancel]                │
└─────────────────────────────────────────────────────────────┘
```

###  2. Multiple KMN Files Detected

If multiple .kmn files exist in the project:

```
┌─────────────────────────────────────────────────────────────┐
│ Select Keyboard File                            [?] [X]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Multiple .kmn files found in project:                       │
│                                                             │
│ ○ source\keyboard1.kmn                                      │
│ ● source\keyboard2.kmn                                      │
│ ○ deprecated\old_keyboard.kmn                               │
│                                                             │
│ Please select which keyboard to convert.                    │
│                                                             │
│                               [OK]  [Cancel]                │
└─────────────────────────────────────────────────────────────┘
```

### 3. Progress Dialog

During conversion:

```
┌─────────────────────────────────────────────────────────────┐
│ Converting Project...                                   [-] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Converting my_keyboard to LDML format...                   │
│                                                             │
│  [████████████████████░░░░░░░░░] 75%                        │
│                                                             │
│  ✓ Parsed source project                                   │
│  ✓ Converted keyboard to LDML                              │
│  ✓ Copied 12 resource files                                │
│  ⋯ Generating project file...                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. Success Dialog

On successful conversion:

```
┌─────────────────────────────────────────────────────────────┐
│ Conversion Complete                              [?] [X]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✓ Project converted successfully!                         │
│                                                             │
│  New project created at:                                    │
│  C:\Projects\my_keyboard_ldml\                              │
│                                                             │
│  Generated files:                                           │
│    • my_keyboard.xml (LDML keyboard)                        │
│    • my_keyboard.kpj (project file)                         │
│    • my_keyboard.kps (package file)                         │
│                                                             │
│  Copied 12 resource files                                   │
│                                                             │
│  [Open Project]  [Open Folder]  [Close]                     │
└─────────────────────────────────────────────────────────────┘
```

### 5. Warning Dialog

If .kpj file missing or other warnings:

```
┌─────────────────────────────────────────────────────────────┐
│ Conversion Complete with Warnings               [?] [X]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠ Project converted with warnings                         │
│                                                             │
│  Warnings:                                                  │
│    • No .kpj file found. Results may not be as desired.     │
│    • Please verify that only intended files were copied.    │
│                                                             │
│  New project created at:                                    │
│  C:\Projects\my_keyboard_ldml\                              │
│                                                             │
│  [Open Project]  [Open Folder]  [Close]                     │
└─────────────────────────────────────────────────────────────┘
```

### 6. Error Dialog

On conversion failure:

```
┌─────────────────────────────────────────────────────────────┐
│ Conversion Failed                                [?] [X]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✗ Conversion failed                                        │
│                                                             │
│  Error:                                                     │
│    Output directory already exists:                         │
│    C:\Projects\my_keyboard_ldml\                            │
│                                                             │
│  Please choose a different destination folder or            │
│  delete the existing folder.                                │
│                                                             │
│                              [OK]                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### Delphi Code Structure

**File:** `developer/src/tike/dialogs/UfrmNewProject.pas` (or create new unit)

```pascal
unit UfrmProjectConversion;

interface

uses
  Winapi.Windows, System.Classes, Vcl.Controls, Vcl.Forms, Vcl.StdCtrls,
  Vcl.ExtCtrls, System.SysUtils;

type
  TProjectConversionMode = (pcmKmnToLdml, pcmLdmlToKmn);

  TfrmProjectConversion = class(TForm)
    lblSourceProject: TLabel;
    edtSourceProject: TEdit;
    btnBrowseSource: TButton;
    lblDestination: TLabel;
    edtDestination: TEdit;
    btnBrowseDestination: TButton;
    chkCopyResources: TCheckBox;
    chkUpdatePackage: TCheckBox;
    btnConvert: TButton;
    btnCancel: TButton;
    dlgOpenProject: TOpenDialog;
    procedure btnBrowseSourceClick(Sender: TObject);
    procedure btnBrowseDestinationClick(Sender: TObject);
    procedure btnConvertClick(Sender: TObject);
    procedure edtSourceProjectChange(Sender: TObject);
  private
    FMode: TProjectConversionMode;
    FSelectedKmnFile: string;
    function GetKmcPath: string;
    function SuggestDestinationFolder(const ASourcePath: string): string;
    function FindKmnFiles(const AProjectPath: string): TArray<string>;
    function RunKmcConvert: Boolean;
    function ShowKmnFileSelection(const AFiles: TArray<string>): Boolean;
    procedure ShowProgress(const AMessage: string);
    procedure ShowResult(ASuccess: Boolean; const AMessages: TArray<string>);
  public
    class function Execute(AMode: TProjectConversionMode): Boolean;
  end;

implementation

uses
  Keyman.Developer.System.Project.ProjectLog,
  Keyman.Developer.UI.UfrmMessages,
  System.IOUtils,
  System.JSON;

function TfrmProjectConversion.GetKmcPath: string;
begin
  // Get path to kmc executable
  Result := IncludeTrailingPathDelimiter(ExtractFilePath(ParamStr(0))) + 'kmc.cmd';
  if not FileExists(Result) then
    Result := 'kmc'; // Try PATH
end;

function TfrmProjectConversion.SuggestDestinationFolder(const ASourcePath: string): string;
var
  BasePath, BaseName: string;
begin
  // Auto-suggest: {source}_ldml or {source}_kmn
  BasePath := ExtractFilePath(ExcludeTrailingPathDelimiter(ASourcePath));
  BaseName := ExtractFileName(ExcludeTrailingPathDelimiter(ASourcePath));

  if FMode = pcmKmnToLdml then
    Result := BasePath + BaseName + '_ldml'
  else
    Result := BasePath + BaseName + '_kmn';
end;

function TfrmProjectConversion.FindKmnFiles(const AProjectPath: string): TArray<string>;
var
  SearchRec: TSearchRec;
  Files: TStringList;
begin
  Files := TStringList.Create;
  try
    // Search for .kmn files recursively
    if FindFirst(IncludeTrailingPathDelimiter(AProjectPath) + '*.kmn', faAnyFile, SearchRec) = 0 then
    begin
      repeat
        if (SearchRec.Attr and faDirectory) = 0 then
          Files.Add(IncludeTrailingPathDelimiter(AProjectPath) + SearchRec.Name);
      until FindNext(SearchRec) <> 0;
      FindClose(SearchRec);
    end;

    Result := Files.ToStringArray;
  finally
    Files.Free;
  end;
end;

function TfrmProjectConversion.ShowKmnFileSelection(const AFiles: TArray<string>): Boolean;
var
  Dialog: TfrmKmnFileSelection;
begin
  Dialog := TfrmKmnFileSelection.Create(Self);
  try
    Dialog.Files := AFiles;
    Result := Dialog.ShowModal = mrOk;
    if Result then
      FSelectedKmnFile := Dialog.SelectedFile;
  finally
    Dialog.Free;
  end;
end;

function TfrmProjectConversion.RunKmcConvert: Boolean;
var
  Command: string;
  OutputLines: TStringList;
  ExitCode: Cardinal;
begin
  Result := False;

  // Build command line
  Command := Format('"%s" convert project "%s" --format ldml --output "%s"',
    [GetKmcPath, edtSourceProject.Text, edtDestination.Text]);

  if not chkCopyResources.Checked then
    Command := Command + ' --no-copy-resources';

  if not chkUpdatePackage.Checked then
    Command := Command + ' --no-update-package';

  if FSelectedKmnFile <> '' then
    Command := Command + Format(' --source-kmn "%s"', [FSelectedKmnFile]);

  // Execute kmc
  OutputLines := TStringList.Create;
  try
    ShowProgress('Converting project...');

    ExitCode := TUtilExecute.Console(Command, ExtractFilePath(edtSourceProject.Text),
      procedure(const AText: string)
      begin
        OutputLines.Add(AText);
      end);

    Result := ExitCode = 0;
    ShowResult(Result, OutputLines.ToStringArray);

  finally
    OutputLines.Free;
  end;
end;

procedure TfrmProjectConversion.btnConvertClick(Sender: TObject);
var
  KmnFiles: TArray<string>;
begin
  // Validate inputs
  if not FileExists(edtSourceProject.Text) and not DirectoryExists(edtSourceProject.Text) then
  begin
    ShowMessage('Please select a valid source project.');
    Exit;
  end;

  if Trim(edtDestination.Text) = '' then
  begin
    ShowMessage('Please specify a destination folder.');
    Exit;
  end;

  if DirectoryExists(edtDestination.Text) then
  begin
    ShowMessage('Destination folder already exists. Please choose a different folder.');
    Exit;
  end;

  // Check for multiple .kmn files
  KmnFiles := FindKmnFiles(ExtractFilePath(edtSourceProject.Text));
  if Length(KmnFiles) > 1 then
  begin
    if not ShowKmnFileSelection(KmnFiles) then
      Exit;
  end;

  // Run conversion
  if RunKmcConvert then
  begin
    if MessageDlg('Conversion complete. Would you like to open the converted project?',
      mtConfirmation, [mbYes, mbNo], 0) = mrYes then
    begin
      ModalResult := mrOk;
      // Open project in IDE
    end;
  end;
end;

class function TfrmProjectConversion.Execute(AMode: TProjectConversionMode): Boolean;
var
  Form: TfrmProjectConversion;
begin
  Form := TfrmProjectConversion.Create(nil);
  try
    Form.FMode := AMode;
    Result := Form.ShowModal = mrOk;
  finally
    Form.Free;
  end;
end;

end.
```

### Integration into New Project Dialog

**File:** `developer/src/tike/dialogs/UfrmNewProject.pas`

Add to the list of project types:

```pascal
type
  TProjectType = (
    ptNewKeyboard,
    ptNewLdmlKeyboard,
    ptNewLexicalModel,
    ptImportWindows,
    ptCloneLocal,
    ptConvertKmnToLdml,     // NEW
    ptConvertLdmlToKmn      // NEW
  );

procedure TfrmNewProject.lstProjectTypesClick(Sender: TObject);
begin
  case TProjectType(lstProjectTypes.ItemIndex) of
    // ... existing cases ...
    ptConvertKmnToLdml:
      begin
        if TfrmProjectConversion.Execute(pcmKmnToLdml) then
          ModalResult := mrOk;
      end;
    ptConvertLdmlToKmn:
      begin
        ShowMessage('LDML to KMN conversion is not yet implemented.');
      end;
  end;
end;
```

---

## User Experience Guidelines

1. **Auto-suggest destination:** When source is selected, auto-fill destination with `{source}_ldml`
2. **Validation:** Check if destination exists before starting conversion
3. **Progress feedback:** Show progress during conversion (file copying takes time)
4. **Clear errors:** If conversion fails, show actionable error message
5. **Post-conversion:** Offer to open the converted project immediately
6. **Help tooltips:** Provide context-sensitive help for each option

---

## Testing Checklist

- [ ] Convert simple KMN project (no touch layout, no package)
- [ ] Convert KMN project with touch layout
- [ ] Convert KMN project with .kps package file
- [ ] Convert project with multiple .kmn files
- [ ] Convert project without .kpj (show warning)
- [ ] Handle destination folder already exists error
- [ ] Handle missing kmc executable error
- [ ] Test resource file copying (fonts, images)
- [ ] Verify "Open Project" button works
- [ ] Test cancel during conversion
- [ ] Verify LDML to KMN option is disabled with tooltip

---

## Future Enhancements

1. **Advanced Options:**
   - Hardware form selection (US/ISO/JIS/ABNT2/KS)
   - Keyboard ID override
   - Language/locale selection

2. **Batch Conversion:**
   - Convert multiple projects at once
   - Project list with checkboxes

3. **Preview:**
   - Show what will be converted before starting
   - File diff viewer

4. **LDML → KMN:**
   - Implement reverse conversion when ready
   - Enable the grayed-out option

---

## Dependencies

- kmc executable must be in PATH or same directory as Keyman Developer
- @keymanapp/kmc-kmn-to-ldml package installed
- Node.js runtime available

---

**Status:** Specification Complete
**Implementation:** Pending Delphi Development
**Estimated Effort:** 6-8 hours
